const mongoose = require("mongoose");

const QuizResponseSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizTable",
  },
  ans_res: [
    {
      type: Object,
    },
  ],
  is_active: {
    type: Boolean,
    default: false,
  },
  is_testlive: {
    type: Boolean,
    default: true,
  },
  timeSpent: {
    type: String || "",
    default: "0", //  min
  },
  attemptedtype: {
    type: String,
    enum: ["submit", "resume"],
    default: "submit",
  },
  created_at: {
    type: String,
  },
  updated_at: {
    type: String,
  },
}, { timestamps: true });

const QuizResponseTable = new mongoose.model(
  "QuizResponseTable",
  QuizResponseSchema
);
QuizResponseSchema.index({ quiz_id : 1 } , { name : 'responseQuiz'}) ;
QuizResponseSchema.index({ quiz_id : 1 , user_id  : 1 } , { name : 'responseQuizUser'}) ;

module.exports = {
  QuizResponseTable,
};
