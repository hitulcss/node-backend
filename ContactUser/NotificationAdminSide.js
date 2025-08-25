const { NotificationModel } = require("../models/Notification");

const sendNotificationTeacher = async (studentId, teacher, title) => {
  const helperNotification = await new NotificationModel({
    user: studentId,
    to: teacher,
    title: title,
    Avatar:
      "https://d1mbj426mo5twu.cloudfront.net/assets/Avtar.png",
    type: "batch",
    isUnRead: true,
    notificationBody: `You were added to the batch , SD Campus welcomes you to the batch `,
  });
  helperNotification.save();
  //  return true;
}

module.exports = {
  sendNotificationTeacher
}