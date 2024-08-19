const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = "Chandra Academy <debashishmeher955@gmail.com>";
  }
  newTransporter() {
    return nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: "debashishmeher955@gmail.com",
        pass: "28cs5Lk4bSEn7dCf",
      },
    });
  }
  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      name: this.firstName,
      url: this.url,
      subject,
    });

    const emailOption = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText.fromString(html),
    };

    await this.newTransporter().sendMail(emailOption);
  }

  async sendWelcome() {
    await this.send("welcome", "welcome to our company.");
  }

  async resetPassword() {
    await this.send("resetpassemail", "forgot your password.");
  }
};
