const express = require("express");
const {registerUser, loginUser, loginstatus,googleLogin,googleMobileLogin,getGoogleClientId,updateUserPhoto, sendVerificationCodeOnly,forgotPassword, verifyResetToken, resetPassword, addBalanceToUser,verifyEmailCode, loggoutUser, getUser, getUserBalance, allUsers, commisisionBalance, deleteCurrentUser, addTestFunds, eMongoliaAuth} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();
const { upload } = require("../utils/fileUpload");

router.post("/register", registerUser);
router.post("/login",loginUser);
router.get("/loggedin", loginstatus);
router.get("/loggout", loggoutUser);
router.get("/allusers", protect, admin, allUsers);
router.get("/getuser", protect, getUser);
router.get("/userbalance", protect, getUserBalance);
router.post("/send-code", sendVerificationCodeOnly);
router.post("/verify-email", verifyEmailCode);
router.post("/addBalance",protect, admin, addBalanceToUser);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password/:token", resetPassword);
router.post('/google', googleLogin);
router.post('/google-mobile', googleMobileLogin);
router.get('/google/client-id', getGoogleClientId);
router.post('/emongolia', eMongoliaAuth);
router.put('/photo', protect, upload.single('photo'), updateUserPhoto);
router.delete('/me', protect, deleteCurrentUser);
router.post('/add-test-funds', protect, addTestFunds);

module.exports = router;
