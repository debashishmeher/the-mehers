const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// 🧠 Cache transporter (create once)
let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "debashishmeher955@gmail.com",
        pass: "drtk hufd wbkz incw",
      },
      tls: { rejectUnauthorized: false, },

    });
  }
  return transporter;
};

// 🧠 Cache templates (avoid disk read every time)
const templateCache = {};

const renderTemplate = (template, data = {}) => {
  if (!templateCache[template]) {
    const filePath = path.join(
      __dirname,
      `../views/email/${template}.html`
    );

    templateCache[template] = fs.readFileSync(filePath, "utf-8");
  }

  let html = templateCache[template];

  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  });

  return html;
};

// 🎯 Core send function (universal)
const sendEmail = async ({
  to,
  subject,
  template,
  data = {},
  html,
  text,
  attachments = [],
  from = `Thryvoo Help <${process.env.EMAIL_USER}>`,
}) => {
  if (!to) throw new Error("Recipient email (to) is required");

  const finalHtml = html || renderTemplate(template, data);

  const mailOptions = {
    from,
    to,
    subject,
    html: finalHtml,
    text: text || finalHtml.replace(/<[^>]*>?/gm, ""),
    attachments,
  };

  return await getTransporter().sendMail(mailOptions);
};



// # 🎯 Prebuilt helpers (common use cases)

const sendOtpEmail = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: "Your OTP Code",
    template: "otp",
    data: {
      name: user.name?.split(" ")[0] || "",
      otp,
    },
  });
};

const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: "Welcome 🎉",
    template: "welcome",
    data: {
      name: user.name?.split(" ")[0] || "",
    },
  });
};

const sendResetPasswordEmail = async (user, url) => {
  return sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    template: "resetpassemail",
    data: {
      name: user.name?.split(" ")[0] || "",
      url,
    },
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
};
