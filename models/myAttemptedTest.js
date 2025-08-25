const mongoose = require("mongoose");
const { formatDate } = require("../middleware/dateConverter");

const MyAttemptedTestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestSeriesTestTable",
  },
  testSeries_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestSeriesTable",
  },
  Score: {
    type: String,
    default: "NA",
  },
  answer_sheet: {
    type: Object,
    default: {
      fileLoc: "",
      fileName: "",
      fileSize: "",
    },
  },
  checked_answer_sheet: {
    type: Object,
    default: {
      fileLoc: "",
      fileName: "",
      fileSize: "",
    },
  },
  is_attempted: {
    type: String,
  },
  is_active: {
    type: Boolean,
  },
  attemptedtype: {
    type: String,
    enum: ["submit", "resume"],
    default: "submit",
  },
  timeSpent: {
    type: String || "",
    default: "0", // in min
  },
  created_at: {
    type: String,
    default: formatDate(new Date()),
  },
  updated_at: {
    type: String,
    default: formatDate(new Date()),
  },
}, { timestamps: true });

const MyAttemptedTestTable = new mongoose.model(
  "MyAttemptedTestTable",
  MyAttemptedTestSchema
);

module.exports = {
  MyAttemptedTestTable,
};
