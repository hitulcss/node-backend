const mongoose = require("mongoose");

const QuestionTextSchema = mongoose.Schema({
  e: {
    type: String,
    default: "",
  },
  h: {
    type: String,
    default: "",
  },
});

const QuizQuestionSchema = mongoose.Schema({
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizQuestionSection",
  },
  question_title: [QuestionTextSchema],
  que_level: [QuestionTextSchema],
  option1: [QuestionTextSchema],
  option2: [QuestionTextSchema],
  option3: [QuestionTextSchema],
  option4: [QuestionTextSchema],
  answer: [QuestionTextSchema],
  correctOption: {
    type: String,
    default: "",
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: String,
  },
  updated_at: {
    type: String,
  },
}, { timestamps: true });

const QuizQuestionsTable = mongoose.model(
  "QuizQuestionsTable",
  QuizQuestionSchema
);

QuizQuestionSchema.index({ quiz_id : 1 } , { name : "questionQuizWise"})
module.exports = {
  QuizQuestionsTable,
};
