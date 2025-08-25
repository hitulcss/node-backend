const mongoose = require("mongoose");

const CBookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CEvent",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CUser",
      required: true,
    },
    clerkUserId: {
      type: String,
      ref: "CUser",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    additionalInfo: {
      type: String,
      default: "",
    },
    utmCampaign: {
      type: String,
      default: "",
    },
    utmSource: {
      type: String,
      default: "",
    },
    utmMedium: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    meetLink: {
      type: String,
      required: true,
    },
    googleEventId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CBooking = new mongoose.model("CBooking", CBookingSchema);

module.exports = {
  CBooking,
};
