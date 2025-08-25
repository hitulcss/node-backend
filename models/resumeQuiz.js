const mongoose = require("mongoose");

const QuizResumeSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizTable",
  },
  ans_res: [
    {
      type: Object,
    },
  ],
  timeSpent: {
    type: String,
    default: "0", //  min
  },
  createdAt: {
    type: String,
  },
  updatedAt: {
    type: String,
    default: new Date(),
  },
}, { timestamps: true });

const QuizResumeTable = new mongoose.model("QuizResumeTable", QuizResumeSchema);

module.exports = {
  QuizResumeTable,
};
