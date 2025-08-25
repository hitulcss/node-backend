// const https = require('https');
const axios = require("axios");
const moment = require('moment');

const crmTracking = async (details) => {
  // console.log(details);
  try {
    const token =
      "3a9f6994-86f1-4276-976a-a3291ff39a7c1737438495365:56809f8c-68d1-46a7-a562-2785d5321fbe";
    const enterpriseId = "678b72eebd94f25f5f9a3da0";
    const url = `https://api.telecrm.in/enterprise/${enterpriseId}/autoupdatelead`;
    const data = {
      fields: {
        name: details?.name,
        phone: details?.phone,
        email: details?.email === "user@gmail.com" ? "" : details?.email,
        utmSource: details?.utm_source,
        utmCampaign: details?.utm_campaign,
        utmMedium: details?.utm_medium,
        platform: details?.platform == 'app' ? "android_app" : details?.platform == 'ios' ? "ios_app" : details?.platform == 'campus_web_cta' ? "campus_web_cta" : "campus_website",
        category: details?.category ?? "",
        subCategory: details?.subCategory ?? "",
        // android_app, ios_app, campus_website
        // date :  moment().format("DD-MM-YYYY HH:mm A") ?? "" , 
      },
      actions: [
        {
          type: details?.platform == "app" ? "App SignUP" : "Website SignUP",
          text: "Sign Up",
        },
      ],
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    // console.log(response);

  } catch (error) {
    console.log(error.message);
  }
};

const cldrBookingUsrData = async (usrData) => {
  // console.log(usrData);
  try {
    const token =
      "3a9f6994-86f1-4276-976a-a3291ff39a7c1737438495365:56809f8c-68d1-46a7-a562-2785d5321fbe";
    const enterpriseId = "678b72eebd94f25f5f9a3da0";
    const url = `https://api.telecrm.in/enterprise/${enterpriseId}/autoupdatelead`;
    const data = {
      fields: {
        name: usrData?.name,
        email: usrData?.email ?? "recording@sdcampus.com",
        phone: usrData?.phone,
        utmsource: usrData?.utm_source,
        utmcampaign: usrData?.utm_campaign,
        utmmedium: usrData?.utm_medium,
        platform: usrData?.platform,
        category: usrData?.category ?? "",
        status: "Demo Booked",
        // subCategory: usrData?.subCategory ?? "",
        eventName: usrData.eventName ?? "SD Campus for Sainik/JNV Demo Class",
        eventStartDate: usrData.eventStartDate,
        eventStartTime: usrData.eventStartTime,
        eventEndTime: usrData.eventEndTime,
        meetingLink: usrData.meetingLink
      },
      actions: [
        // {
        //   type: "SYSTEM_NOTE",
        //   text: `utm_source: ${usrData?.utm_source}`,
        // },
        // {
        //   type: "SYSTEM_NOTE",
        //   text: `utm_medium: ${usrData?.utm_medium}`,
        // },
        // {
        //   type: "SYSTEM_NOTE",
        //   text: `utm_campaign: ${usrData?.utm_campaign}`,
        // },
      ],
    };

    const response = await axios.post(url, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      return true
    } else return false
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  crmTracking,
  cldrBookingUsrData
};
