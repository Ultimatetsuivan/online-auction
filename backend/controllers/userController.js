const asyncHandler = require("express-async-handler");
const User = require("../models/User")
const LegalDocument = require("../models/LegalDocument");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {sendCode, sendResetEmail} = require("../utils/mail");
const pendingVerifications = new Map();
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const cloudinary = require("cloudinary").v2;

const googleClientConfig = {
  web: process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
  android: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
  ios: process.env.GOOGLE_IOS_CLIENT_ID || '',
  expo: process.env.GOOGLE_EXPO_CLIENT_ID || ''
};

const googleAudienceIds = Object.values(googleClientConfig).filter(Boolean);
const primaryGoogleClientId = googleAudienceIds[0] || process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(primaryGoogleClientId);
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateToken = (id) => {
    return jwt.sign({id} , process.env.JWT_SECRET, {expiresIn: "1d"});
};
const sendVerificationCodeOnly = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409);
      throw new Error("Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    pendingVerifications.set(normalizedEmail, { code, expires });

    console.log(`[OTP] Code sent to ${normalizedEmail}: ${code} (expires in 10 min)`);
    console.log(`[OTP] Current pending verifications count:`, pendingVerifications.size);

    await sendCode(normalizedEmail, code);

    res.status(200).json({ message: "Баталгаажуулах код илгээгдлээ" });
  });
  const verifyEmailCode = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[OTP] Verification attempt for ${normalizedEmail} with code: ${code}`);
    console.log(`[OTP] Current pending verifications:`, Array.from(pendingVerifications.keys()));

    const record = pendingVerifications.get(normalizedEmail);

    if (!record) {
      console.log(`[OTP] No record found for ${normalizedEmail}`);
      res.status(400);
      throw new Error("Баталгаажуулах код олдсонгүй. Код дахин илгээнэ үү.");
    }

    if (record.expires < Date.now()) {
      console.log(`[OTP] Code expired for ${normalizedEmail}`);
      pendingVerifications.delete(normalizedEmail);
      res.status(400);
      throw new Error("Баталгаажуулах код хугацаа дууссан. Код дахин илгээнэ үү.");
    }

    if (record.code !== code) {
      console.log(`[OTP] Invalid code for ${normalizedEmail}. Expected: ${record.code}, Got: ${code}`);
      res.status(400);
      throw new Error("Баталгаажуулах код буруу байна");
    }

    pendingVerifications.delete(normalizedEmail);
    console.log(`[OTP] Verification successful for ${normalizedEmail}`);

    res.status(200).json({ message: "Имэйл баталгаажлаа" });
  });
  
  const registerUser = asyncHandler(async (req, res) => {
    const { surname, name, registrationNumber, email, phone, password, acceptEula, eulaAccepted } = req.body;
    const acceptedEula = acceptEula === true || acceptEula === 'true' || eulaAccepted === true || eulaAccepted === 'true';

    if (!acceptedEula) {
      res.status(400);
      throw new Error("Дүрэм, нөхцөлийг зөвшөөрнө үү.");
    }

    const activeEula = await LegalDocument.findOne({ type: 'eula', isActive: true });

    if (!activeEula) {
      res.status(503);
      throw new Error("EULA тохиргоо хийгдээгүй байна. Дараа дахин оролдоно уу.");
    }

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone ? phone.trim() : null;
    const normalizedRegistrationNumber = registrationNumber ? registrationNumber.trim() : null;

    // Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(409);
      throw new Error("Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна");
    }

    // Check if registration number already exists
    if (normalizedRegistrationNumber) {
      const existingRegNumber = await User.findOne({ registrationNumber: normalizedRegistrationNumber });
      if (existingRegNumber) {
        res.status(409);
        throw new Error("Энэ регистрийн дугаар аль хэдийн бүртгэлтэй байна");
      }

      // Validate registration number format
      if (!/^УГ\d{8}$/.test(normalizedRegistrationNumber)) {
        res.status(400);
        throw new Error("Регистрийн дугаар буруу байна. Жишээ: УГ99999999");
      }
    }

    // Check if phone already exists
    if (normalizedPhone) {
      const existingPhone = await User.findOne({ phone: normalizedPhone });
      if (existingPhone) {
        res.status(409);
        throw new Error("Энэ утасны дугаар аль хэдийн бүртгэлтэй байна");
      }

      // Validate phone format
      if (!/^[0-9]{8}$/.test(normalizedPhone)) {
        res.status(400);
        throw new Error("Утасны дугаар 8 оронтой байх ёстой");
      }
    }

    const newUser = new User({
      surname: surname ? surname.trim() : undefined,
      name,
      registrationNumber: normalizedRegistrationNumber,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      eulaAccepted: true,
      eulaAcceptedAt: new Date(),
      eulaVersion: activeEula.version
    });

    await newUser.save();

    console.log(`[Registration] User registered successfully: ${normalizedEmail}, regNum: ${normalizedRegistrationNumber}`);

    res.status(201).json({ message: "Хэрэглэгч амжилттай бүртгэгдлээ" });
  });
  const addBalanceToUser = asyncHandler(async (req, res) => {
    try {
      const { userId, amount } = req.body;
      
      if (!userId || isNaN(amount)) {
        return res.status(400).json({ message: 'Invalid request' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.balance = (user.balance || 0) + parseFloat(amount);
      await user.save();
  
      res.status(200).json({ message: 'Balance updated successfully', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Мэдээллүүдээ бүрэн гүйцэл бөглөнө үү");
    }

    // Normalize and trim input
    const normalizedInput = email.trim();

    // Check if input is phone number (8 digits) or email
    const isPhoneNumber = /^[0-9]{8}$/.test(normalizedInput);

    console.log(`[Login] Attempt with: ${normalizedInput}, isPhone: ${isPhoneNumber}`);

    let user;
    if (isPhoneNumber) {
      // Login with phone number
      user = await User.findOne({ phone: normalizedInput });
      console.log(`[Login] Phone lookup result:`, user ? `Found user: ${user.name}` : 'Not found');
    } else {
      // Login with email (normalize to lowercase)
      const normalizedEmail = normalizedInput.toLowerCase();
      user = await User.findOne({ email: normalizedEmail });
      console.log(`[Login] Email lookup result:`, user ? `Found user: ${user.name}` : 'Not found');
    }

    if (!user) {
      res.status(401);
      throw new Error("Хэрэглэгч олдсонгүй мэдээлэлээ шалгана уу");
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect) {
      console.log(`[Login] Password incorrect for user: ${user.email}`);
      res.status(401);
      throw new Error("Email/Утас эсвэл нууц үг буруу байна");
    }

    console.log(`[Login] Successful login: ${user.email}`);


    const token = generateToken(user._id);

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });

    const { _id, name, photo, role } = user;
    res.status(200).json({
      _id,
      name,
      email: user.email,
      phone: user.phone,
      photo,
      role,
      token,
      balance: user.balance
    });
  });
const loginstatus = asyncHandler(async (req, res)=> {
    const token = req.cookies.token;
    if(!token){
        return res.json(false)
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if(verified){
        return res.json(true);
    }
    return res.json(false);
});
const loggoutUser = asyncHandler(async (req, res)=> {
    res.cookie("token" , "",{
        path:"/",
        httpOnly:true,
        expires: new Date(0),
        sameSite:"none",
        secure: true,
    });
    return res.status(200).json({message: "Системээс амжилттай гарлаа"});
});
const getUser = asyncHandler(async (req, res) =>{
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
});
const getUserBalance = asyncHandler(async (req, res) =>{
    const user = await User.findById(req.user._id);

    if(!user) {
        res.status(404);
        throw new Error("хэрэглэгч олдсонгүй");

    }

    res.status(200).json({
        balance: user.balance,
    });
});
const allUsers = asyncHandler(async (req, res) =>{
    const userList = await User.find({});

    if(!userList.length){
        return res.status(404).json({ message:"no user found"});

    }
    res.status(200).json(userList);
});

const generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
      res.status(400);
      throw new Error("Имэйл хаягаа оруулна уу");
  }

  console.log("Forgot password request for:", email); 

  const user = await User.findOne({ email });

  if (user) {
      console.log("User found, generating reset token..."); 
      const resetToken = generateResetToken();
      const resetTokenExpiry = Date.now() + 3600000; 
      console.log(resetToken,"asdadas")

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

      console.log("Sending reset email to:", user.email, "with URL:", resetUrl); 
      
      try {
          await sendResetEmail(user.email, resetUrl);
          console.log("Reset email sent successfully"); 
      } catch (error) {
          console.error("Error sending reset email:", error);
          throw new Error("Имэйл илгээхэд алдаа гарлаа");
      }
  }

  res.status(200).json({ 
      message: "Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх линк илгээгдсэн болно" 
  });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
      res.status(400);
      throw new Error("Линк хүчингүй эсвэл хугацаа нь дууссан байна");
  }

  res.status(200).json({ 
      message: "Линк хүчинтэй", 
      email: user.email 
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
      res.status(400);
      throw new Error("Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэнэ");
  }

  const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
      res.status(400);
      throw new Error("Линк хүчингүй эсвэл хугацаа нь дууссан байна");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ 
      message: "Нууц үг амжилттай шинэчлэгдлээ" 
  });
  
});
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error("Google credential шаардлагатай");
  }

  try {
    console.log('[Google Login] Verifying ID token...');

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleAudienceIds.length > 0 ? googleAudienceIds : process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('[Google Login] Token verified for:', email);

    // Get active EULA
    const activeEula = await LegalDocument.findOne({ type: 'eula', isActive: true });

    let user = await User.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (!user) {
      console.log('[Google Login] Creating new user');
      user = new User({
        googleId,
        name,
        email,
        photo: picture,
        password: crypto.randomBytes(16).toString('hex'),
        isVerified: true,
        eulaAccepted: true,
        eulaAcceptedAt: new Date(),
        eulaVersion: activeEula?.version || '1.0'
      });
      await user.save();
    } else if (!user.googleId) {
      console.log('[Google Login] Linking Google account to existing user');
      user.googleId = googleId;
      user.isVerified = true;
      if (!user.photo && picture) user.photo = picture;

      // Auto-accept EULA for Google users if not accepted
      if (!user.eulaAccepted && activeEula) {
        user.eulaAccepted = true;
        user.eulaAcceptedAt = new Date();
        user.eulaVersion = activeEula.version;
      }

      await user.save();
    } else {
      console.log('[Google Login] Existing Google user logging in');

      // Check and update EULA if needed
      if (!user.eulaAccepted && activeEula) {
        user.eulaAccepted = true;
        user.eulaAcceptedAt = new Date();
        user.eulaVersion = activeEula.version;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });

    console.log('[Google Login] Success for:', user.email);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      token,
      balance: user.balance,
      eulaAccepted: user.eulaAccepted
    });

  } catch (error) {
    console.error('[Google Login] Error:', error.message);
    console.error('[Google Login] Stack:', error.stack);
    res.status(400);
    throw new Error(`Google нэвтрэх алдаа: ${error.message}`);
  }
});

const googleMobileLogin = asyncHandler(async (req, res) => {
  const { googleId, email, name, picture } = req.body;

  if (!googleId || !email) {
    res.status(400);
    throw new Error("Google ID and email шаардлагатай");
  }

  try {
    console.log('[Google Mobile Login] Processing login for:', email);

    // Get active EULA
    const activeEula = await LegalDocument.findOne({ type: 'eula', isActive: true });

    let user = await User.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (!user) {
      console.log('[Google Mobile Login] Creating new user');
      user = new User({
        googleId,
        name,
        email,
        photo: picture,
        password: crypto.randomBytes(16).toString('hex'),
        isVerified: true,
        eulaAccepted: true,
        eulaAcceptedAt: new Date(),
        eulaVersion: activeEula?.version || '1.0'
      });
      await user.save();
    } else if (!user.googleId) {
      console.log('[Google Mobile Login] Linking Google account to existing user');
      user.googleId = googleId;
      user.isVerified = true;
      if (!user.photo && picture) user.photo = picture;

      // Auto-accept EULA for Google users if not accepted
      if (!user.eulaAccepted && activeEula) {
        user.eulaAccepted = true;
        user.eulaAcceptedAt = new Date();
        user.eulaVersion = activeEula.version;
      }

      await user.save();
    } else {
      console.log('[Google Mobile Login] Existing Google user logging in');

      // Check and update EULA if needed
      if (!user.eulaAccepted && activeEula) {
        user.eulaAccepted = true;
        user.eulaAcceptedAt = new Date();
        user.eulaVersion = activeEula.version;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    console.log('[Google Mobile Login] Success for:', user.email);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      token,
      balance: user.balance,
      eulaAccepted: user.eulaAccepted
    });

  } catch (error) {
    console.error('[Google Mobile Login] Error:', error.message);
    console.error('[Google Mobile Login] Stack:', error.stack);
    res.status(400);
    throw new Error(`Google нэвтрэх алдаа: ${error.message}`);
  }
});

const getGoogleClientId = asyncHandler(async (req, res) => {
  res.status(200).json({
    clientId: googleClientConfig.web || process.env.GOOGLE_CLIENT_ID || null,
    clientIds: {
      web: googleClientConfig.web || process.env.GOOGLE_CLIENT_ID || null,
      android: googleClientConfig.android || null,
      ios: googleClientConfig.ios || null,
      expo: googleClientConfig.expo || null
    }
  });
});
const updateUserPhoto = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error("Хэрэглэгч олдсонгүй");
    }

    let fileData = {};
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "Bidding/UserAvatars",
        resource_type: "image",
      });

      if (user.photo?.public_id) {
        await cloudinary.uploader.destroy(user.photo.public_id);
      }

      fileData = {
        filePath: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    user.photo = fileData;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Профайл зураг амжилттай шинэчлэгдлээ",
      photo: user.photo
    });

  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Зураг шинэчлэхэд алдаа гарлаа"
    });
  }
});

const deleteCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("Хэрэглэгч олдсонгүй");
  }

  await User.deleteOne({ _id: userId });
  res.clearCookie('token');

  res.json({
    success: true,
    message: "Таны аккаунт устгагдлаа."
  });
});

// Add test funds for development/testing purposes
const addTestFunds = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount } = req.body;

  // Validate amount
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("Invalid amount");
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Add test funds
  user.balance = (user.balance || 0) + amount;
  await user.save();

  console.log(`Added ${amount}₮ test funds to user ${user.name}. New balance: ${user.balance}₮`);

  res.status(200).json({
    success: true,
    message: `Added ${amount}₮ test funds`,
    newBalance: user.balance,
    amount: amount
  });
});

// eMongolia Authentication
const eMongoliaAuth = asyncHandler(async (req, res) => {
  const { authCode, eMongoliaData } = req.body;

  if (!eMongoliaData || !eMongoliaData.registerNumber) {
    res.status(400);
    throw new Error("eMongolia баталгаажуулалтын мэдээлэл дутуу байна");
  }

  const {
    registerNumber,
    lastName,
    firstName,
    dateOfBirth,
    gender,
    nationality
  } = eMongoliaData;

  // Check if user exists with this eMongolia ID
  let user = await User.findOne({ eMongoliaId: registerNumber });

  if (user) {
    // User exists, update their eMongolia data
    user.eMongoliaVerified = true;
    user.eMongoliaData = {
      registerNumber,
      lastName,
      firstName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      nationality,
      verifiedAt: new Date()
    };

    // Update user details if not set
    if (!user.surname && lastName) user.surname = lastName;
    if (!user.name && firstName) user.name = firstName;
    if (!user.registrationNumber && registerNumber) user.registrationNumber = registerNumber;

    await user.save();

    console.log(`[eMongolia] User logged in via eMongolia: ${user.email || user.phone}`);
  } else {
    // New user, create account with eMongolia data
    // Generate a temporary email if not provided
    const tempEmail = `emongolia_${registerNumber.toLowerCase()}@temp.mn`;

    user = new User({
      eMongoliaId: registerNumber,
      eMongoliaVerified: true,
      eMongoliaData: {
        registerNumber,
        lastName,
        firstName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        nationality,
        verifiedAt: new Date()
      },
      surname: lastName,
      name: firstName,
      registrationNumber: registerNumber,
      email: tempEmail,
      password: crypto.randomBytes(32).toString('hex'), // Random password
      eulaAccepted: false, // Will need to accept EULA
      role: 'buyer'
    });

    await user.save();

    console.log(`[eMongolia] New user created via eMongolia: ${registerNumber}`);
  }

  // Generate token
  const token = generateToken(user._id);

  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  res.status(user.eulaAccepted ? 200 : 201).json({
    _id: user._id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    photo: user.photo,
    eMongoliaVerified: user.eMongoliaVerified,
    eulaAccepted: user.eulaAccepted,
    token: token,
    message: user.eulaAccepted ? "eMongolia-аар амжилттай нэвтэрлээ" : "EULA зөвшөөрөх шаардлагатай"
  });
});

module.exports = {registerUser,
    loginUser,
    loginstatus,
    loggoutUser,
    getUser,
    getUserBalance,
    allUsers,
    verifyEmailCode,
    sendVerificationCodeOnly,
    addBalanceToUser,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    googleLogin,
    googleMobileLogin,
    getGoogleClientId,
    updateUserPhoto,
    deleteCurrentUser,
    addTestFunds,
    pendingVerifications,
    eMongoliaAuth

};
