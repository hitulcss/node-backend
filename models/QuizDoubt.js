const mongoose = require("mongoose");

const doubtsTableSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
  },
  que_title: {
    type: String,
  },
  doubt_desc: {
    type: String,
  },
  created_at: {
    type: String,
  },
  updated_at: {
    type: String,
  },
}, { timestamps: true });

const DoubtTable = new mongoose.model("DoubtTable", doubtsTableSchema);

module.exports = {
  DoubtTable,
};
