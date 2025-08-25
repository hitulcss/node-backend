const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  message: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const userRequestModel = new mongoose.model("userRequestTable", requestSchema);

module.exports = {
  userRequestModel,
};
