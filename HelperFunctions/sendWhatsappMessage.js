const https = require("https");
const axios = require("axios");
const sendWhatsappMessage = () => {
  // const encodeMsg = encodeURIComponent(message) ;
  // https.get(`https://api.whatsapp.com/send?phone=${number}&text=${encodeMsg}`);
  // return encodeMsg

  const url = "https://marketing.otpless.app/v1/api/send";
  const headers = {
    clientId: "J939SCNAEC9S6JGRA1M3B61316F6MZ35",
    clientSecret: "zm2qb9qszmq15m0fdyecleo3sr8kec6s",
    "Content-Type": "application/json",
  };
  const data = JSON.stringify({
    sendTo: "917458062388",
    channel: "WHATSAPP",
    message: "Your text message here"
    // templateId: "OTPLESS_40672433",
    // headerValues: {
    //   1: "header_value",
    // },
    // bodyValues: {
    //   1: "Abhishek",
    // },
    // buttonValues: {
    //   1: "SD CAMPUS",
    // },
  });
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      clientId: "J939SCNAEC9S6JGRA1M3B61316F6MZ35",
      clientSecret:"zm2qb9qszmq15m0fdyecleo3sr8kec6s",
    },
  };

  const req = https.request(url, options, (res) => {
    let responseData = "";

    res.on("data", (chunk) => {
      responseData += chunk;
    });

    res.on("end", () => {
      console.log(JSON.parse(responseData));
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });

  req.write(data);
  req.end();

  //   axios
  //     .put(url, data, { headers })
  //     .then((response) => {
  //       console.log(response.data);
  //     })
  //     .catch((error) => {
  //         console.log(error)
  //     //   console.error(error.message);
  //     });
};

module.exports = {
  sendWhatsappMessage,
};
