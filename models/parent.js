const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema(
  {
    parentId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    token: {
      type: String,
    },
    phone: {
      type: String,
    },
    phoneOtp: {
      type: String,
      default: "1234"
    },
    profilePhoto: {
      type: String,
      default:
        "https://d1mbj426mo5twu.cloudfront.net/assets/Avtar.png",
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
      default: "",
    },

    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersTable'
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    utm_campaign: {
      type: String,
      default: ""
    },
    utm_source: {
      type: String,
      default: ""
    },
    utm_medium: {
      type: String,
      default: ""
    },

  }, { timestamps: true });




const ParentTable = new mongoose.model("ParentTable", ParentSchema);

module.exports = {
  ParentTable,
};
