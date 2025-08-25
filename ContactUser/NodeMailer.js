const mailer = require('nodemailer');
const mailTemplete = require('./mailTemplete');

const sendEmail = async (templeteName, to, name, data) => {
  const smtpTransport = mailer.createTransport({
    host: process.env.host,
    port: 587,
    secure: false,
    auth: {
      user: process.env.email,
      pass: process.env.pass
    }
  });

  const mailComposer = mailTemplete[templeteName](to, name, data);

  try {
    const response = await smtpTransport.sendMail(mailComposer);
    smtpTransport.close();

    return {
      success: true,
      response,
      mailComposer
    };

  } catch (error) {
    smtpTransport.close();

    console.error("Email send failed:", error.message);
    return {
      success: false,
      error: error.message || error,
      mailComposer
    };
  }
};

module.exports = { sendEmail };
