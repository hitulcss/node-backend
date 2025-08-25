const mongoose = require("mongoose");

const IssueReportTableSchema = mongoose.Schema({
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
  issue_desc: {
    type: String,
  },
  created_at: {
    type: String,
  },
  updated_at: {
    type: String,
  },
}, { timestamps: true });

const issueReport = new mongoose.model("issueReport", IssueReportTableSchema);

module.exports = {
  issueReport,
};
