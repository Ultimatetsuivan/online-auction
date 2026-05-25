const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.SMPT_EMAIL, 
    pass: process.env.SMPT_PASS,  
  },
  tls: {
    rejectUnauthorized: false 
  }
});

const sendEmail = async (options) => {
  if (!options?.email) {
    throw new Error("Имэйл шаардлагатай");
  }

  const message = {
    from: `"${process.env.SMPT_FROM_NAME}" <${process.env.SMPT_EMAIL}>`, 
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message, 
  };

  try {
    const info = await transport.sendMail(message);
    return info;
  } catch (error) {
    throw new Error("Имэйл илгээхэд алдаа гарлаа");
  }
};

const sendCode = async (email, code) => {
  if (!email || !code) {
    throw new Error("Имэйл болон код шаардлагатай");
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Таны баталгаажуулах код</h2>
      <p>Доорх кодыг ашиглан имэйлээ баталгаажуулна уу:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #2563eb;">${code}</span>
      </div>
      <p style="color: #6b7280;">Энэ код 10 минутын дотор хүчинтэй</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #9ca3af;">Хэрэв та энэ имэйл илгээсэн гэж санахгүй байгаа бол үл тоож болно.</p>
    </div>
  `;

  return sendEmail({
    email,
    subject: "Таны баталгаажуулах код - Дуудлага худалдаа",
    html: htmlContent
  });
};

const sendResetEmail = async (email, resetUrl) => {
  if (!email || !resetUrl) {
    throw new Error("Имэйл болон reset URL шаардлагатай");
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Нууц үг сэргээх хүсэлт</h2>
      <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна. Доорх товчин дээр дарж үргэлжлүүлнэ үү:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}"
           style="display: inline-block;
                  padding: 12px 24px;
                  background-color: #2563eb;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;">
          Нууц үг сэргээх
        </a>
      </div>
      <p style="color: #6b7280;">Хэрэв та энэ хүсэлт илгээгээгүй бол энэ имэйлийг үл тоож болно.</p>
      <p style="color: #ef4444;">Энэ линк 1 цагийн дотор хүчинтэй</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Дуудлага худалдаа. Бүх эрх хуулиар хамгаалагдсан.</p>
    </div>
  `;

  return sendEmail({
    email,
    subject: "Нууц үг сэргээх - Дуудлага худалдаа",
    html: htmlContent
  });
};

const sendTempPasswordEmail = async (email, tempPassword) => {
  if (!email || !tempPassword) {
    throw new Error("Имэйл болон түр нууц үг шаардлагатай");
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Нууц үг сэргээх</h1>
      </div>

      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Сайн байна уу,</p>

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Та нууц үгээ сэргээх хүсэлт илгээсэн байна. Доорх түр нууц үгийг ашиглан нэвтэрч орж,
          шинэ нууц үг үүсгэнэ үү.
        </p>

        <div style="background: #f9fafb; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Таны түр нууц үг:</p>
          <div style="background: #ffffff; padding: 15px; border-radius: 6px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 3px; font-family: 'Courier New', monospace;">
              ${tempPassword}
            </span>
          </div>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px; display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">⏰</span>
            <strong>Анхаар:</strong> Энэ түр нууц үг 24 цагийн турш хүчинтэй байна
          </p>
        </div>

        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">📋 Дараагийн алхамууд:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            <li style="margin-bottom: 8px;">Түр нууц үгээ хуулж авна уу</li>
            <li style="margin-bottom: 8px;">Нэвтрэх хуудас руу очно уу</li>
            <li style="margin-bottom: 8px;">Түр нууц үгээр нэвтэрнэ үү</li>
            <li style="margin-bottom: 8px;">Шинэ нууц үг үүсгэнэ үү</li>
          </ol>
        </div>

        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;">
            <strong>⚠️ Аюулгүй байдал:</strong> Хэрэв та энэ хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомжилж,
            нууц үгээ өөрчлөхийг зөвлөж байна.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 15px 0 0 0;">
          © ${new Date().getFullYear()} Дуудлага худалдаа. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    email,
    subject: "🔐 Түр нууц үг - Дуудлага худалдаа",
    html: htmlContent
  });
};

module.exports = {
  sendEmail,
  sendCode,
  sendResetEmail,
  sendTempPasswordEmail,
};