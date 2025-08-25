const mongoose = require("mongoose");

const myNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  title: {
    type: String,
  },
  message: {
    type: String,
  },
  route: {
    type: String,
    default: "",
  },
  imageUrl: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const myNotificationModel = new mongoose.model(
  "myNotificatioTable",
  myNotificationSchema
);

module.exports = {
  myNotificationModel,
};
