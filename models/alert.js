const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userIdArr: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersTable",
    },
  ],
  title: {
    type: String,
  },
  desc: {
    type: String,
  },
  type: {
    type: String,
    enum: ['warning', 'emergency', 'information']
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
}, { timestamps: true });

const alertTable = new mongoose.model("alertTable", alertSchema);

module.exports = {
  alertTable,
};
