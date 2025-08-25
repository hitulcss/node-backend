const { sendBulkPushNotifications, sendPushNotification } = require("../firebaseService/fcmService");
const { UserTable } = require('../models/userModel');
const {
    getFcmTokenArrByUserIdArr,
  } = require("./userFunctions");
const sendCustomNotification = async (userIdArr, data) => {
    let tokenArr = [];
    if (userIdArr === "all") {
      // console.log("All users");
      const users = await UserTable.find({});
      tokenArr = users.filter((e) => e?.fcmToken).map((e) => e.fcmToken);
    } else if (userIdArr.length > 0) {
      tokenArr = await getFcmTokenArrByUserIdArr(userIdArr);
    } else {
      const users = await UserTable.find({ email: "govind.s@sdempire.co.in" })
        .sort({ created_at: 1 })
        .limit(1);
      tokenArr = users.filter((e) => e?.fcmToken != "").map((e) => e.fcmToken);
    //   tokenArr = users.filter((e) => e?.fcmToken != "").map((e) => e.fcmToken);
    }
    // const data = { title: data?.title, message: data?.message, image: data?.file };
    // console.log(tokenArr);
    return sendBulkPushNotifications(tokenArr, data);
  };

  module.exports = {
    sendCustomNotification
  }