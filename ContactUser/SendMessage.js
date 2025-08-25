const axios = require("axios");
const twilio = require('twilio');
// const SendOtpSms = async (otp, mobile) => {
//   const res = await axios.get(
//     `https://pgapi.vispl.in/fe/api/v1/send?username=ssgrn.trans&password=yVirD&unicode=false&from=UHUPSC&to=${mobile}&dltContentId=1207167482223907448&text=Your OTP verification code is ${otp} - UPSC HINDI`
//   );
//   if (res?.data.statusCode === 200) return res.data.statusCode;
// };

const SendOtpSms = async (otp, mobile) => {
  try {
    const res = await axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=Ea7CWOcw6zhA8bZselkMdf14p3jXoDqrQGLNRK0F9nVxSmIPBHNgoIjaCeJUfzdA0Mn4QyPHhqb68c1R&route=dlt&sender_id=SDEMPR&message=165812&variables_values=${otp}&flash=0&numbers=${mobile}`)
    if (res && res.status === 200 && res.statusText === "OK") {
      // console.log('SUCCess')
      return true;  // Success
    } else {
      // console.log("FAILED")
      return false;  // Handle other unexpected responses
    }
  } catch (error) {
    return false;  // Handle network or other errors
  }
};



// const SendOtpSms = async (otp, mobile) => {
//   const accountSid = 'ACcdef1cb56e17e26890da3df0142b9e16';
//   const authToken = '7b3dbaee24dc996dc2f9929234595281';
//   const phoneNumber = "+919983904397";
//   const twilioClient = twilio(accountSid, authToken);
//   // Generate a random 6-digit OTP
//   const message = await twilioClient.messages.create({
//     body: `Your OTP verification code is : ${otp} - SD CAMPUS`,
//     to: `+91${mobile}`,
//     from: '+16693337866',
//   });
//   if (message) return true
//   else return false;
// };

module.exports = {
  SendOtpSms,
};
