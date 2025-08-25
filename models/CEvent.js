const mongoose = require("mongoose");

const CEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
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
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CBooking",
      },
    ],
    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true }
);
CEventSchema.virtual("bookingsCount").get(function () {
  return this.bookings ? this.bookings.length : 0;
});

CEventSchema.set("toObject", { virtuals: true });
CEventSchema.set("toJSON", { virtuals: true });
const CEvent = new mongoose.model("CEvent", CEventSchema);

module.exports = {
  CEvent,
};
