const mongoose = require("mongoose");

const leaderBoardSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizTable",
  },
  leaderBoard: {
    type: Object,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  publishedAt: {
    type: Date,
    default: new Date(),
  }
}, { timestamps: true });

const leaderBoardTable = new mongoose.model(
  "leaderBoardTable",
  leaderBoardSchema
);

module.exports = {
  leaderBoardTable,
};
