const express = require("express");
const { ValidateToken, isAdmin } = require("../middleware/authenticateToken");
const { admin } = require("./pushNotification");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { adminTeacherTable } = require("../models/adminTeacherModel");
const { UserTable } = require("../models/userModel");
const { formatDate } = require("../middleware/dateConverter");
const { findUserByUserId } = require("../HelperFunctions/userFunctions");
const { myNotificationModel } = require("../models/myNotification");
const NotificationRoutes = express.Router();

const db = admin.firestore();

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24,
};

const addNotificationForUser = async (userId, message, status, title) => {
  const date = new Date(moment().add(5, "hours").add(30, "minutes"));
  date.setHours(date.getHours() + 5, date.getMinutes() + 30);
  const userIdWithTime = userId + date.getTime();
  let batchAdded = db.collection("userNotification").doc(userIdWithTime);
  await batchAdded.set({
    user_id: userId,
    message: message,
    status: status,
    title: title,
    created_at: formatDate(date),
    // batchDetails: batchDetails,
  });
};

NotificationRoutes.post("/addNotification", isAdmin, async (req, res) => {
  const { userId } = req.body;
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "not an admin",
      });
    } else {
      const { message, status, title } = req.body;
      const date = new Date(moment().add(5, "hours").add(30, "minutes"));
      const userIdWithTime = userId + date.getTime();
      let batchAdded = db.collection("userNotification").doc(userIdWithTime);
      await batchAdded.set({
        user_id: userId,
        message: message,
        status: status,
        title: title,
        created_at: formatDate(date),
        // batchDetails: batchDetails,
      });
      res.json({
        status: true,
        data: batchAdded,
        msg: "batch added successfully",
      });
    }
  });
});

// NotificationRoutes.get("/getNotifications", ValidateToken, async (req, res) => {
//   jwt.verify(req.token, process.env.SECRET_KEY, async (err, Data) => {
//     if (err) {
//       res.json({
//         err: err,
//         status: false,
//         data: null,
//         msg: "not an admin",
//       });
//     } else {
//       const userDetails = await findUserByUserId(Data.studentId);
//       const adminDetails = await adminTeacherTable.findOne({
//         userId: Data.studentId,
//       });
//       if (userDetails || adminDetails) {
//         let userId;
//         if (userDetails) {
//           userId = userDetails.userId;
//         } else {
//           userId = adminDetails.userId;
//         }
//         let usr = [];
//         // const {batchName}=req.query;
//         // if(batchName){
//         const batchMessage = await db
//           .collection("userNotification")
//           .where("user_id", "==", userId)
//           .get();
//         if (batchMessage.docs.length > 0) {
//           for (const user of batchMessage.docs) {
//             usr.push(user.data());
//           }
//         }
//         res.json({
//           status: true,
//           data: usr,
//           msg: "fetched the batch messages",
//         });
//         // }else{
//         //  const batchNotifications = await db.collection('NewBatch').get()
//         // if (batchNotifications.docs.length > 0) {
//         //       for (const user of batchNotifications.docs) {
//         //        usr.push(user.data())
//         //     }}
//         //     res.json({
//         //         status:true,
//         //         data:usr,
//         //         msg:"fetched all the notifications"
//         //     })
//         // }
//       } else {
//         res.json({
//           status: false,
//           data: null,
//           msg: "Not an user",
//         });
//       }
//     }
//   });
// });

NotificationRoutes.get("/getNotifications", ValidateToken, async (req, res) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decodedToken.studentId);
    if (!userDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not a user",
      });
    }
    const notifications = await myNotificationModel
      .find({ user: userDetails._id })
      .lean()
      .sort({ createdAt: -1 });
    const usrNotiData = notifications.map(
      ({ _id, title, message, route, imageUrl, isRead, createdAt }) => ({
        id: _id,
        title,
        message,
        route,
        imageUrl,
        isRead,
        createdAt: moment(createdAt).fromNow(),
      })
    );
    res.json({
      status: true,
      data: usrNotiData,
      msg: "Fetched all the notifications",
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      data: "Invalid token",
      msg: "Not an admin",
    });
  }
});

NotificationRoutes.put("/updateIsRead/:id", ValidateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const decodedToken = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decodedToken.studentId);
    if (!userDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not a user",
      });
    }
    const notification = await myNotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    res.json({
      status: true,
      data: notification,
      msg: "Success",
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      data: "Invalid token",
      msg: "Not an admin",
    });
  }
});

NotificationRoutes.post("/firebase/notification", (req, res) => {
  const registrationToken = req.body.registrationToken;
  const message = req.body.message;
  const options = notification_options;
  admin
    .messaging()
    .sendToDevice(registrationToken, message, options)
    .then((response) => {
      res.status(200).send("Notification sent successfully");
    })
    .catch((error) => {
      console.log(error);
    });
});

module.exports = { NotificationRoutes, addNotificationForUser };
