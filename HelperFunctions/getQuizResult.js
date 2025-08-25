const { QuizQuestionsTable } = require("../models/Quiz_question");
const { QuizResponseTable } = require("../models/QuizResponse");

const quizResult = async (userId) => {
  const quizResponse = await QuizResponseTable.find({
    user_id: userId,
  }).populate("quiz_id").sort({ createdAt : -1  }).limit(5);
  const studentScores = [];
  for (let attempted of quizResponse) {
    const quizQuestions = await QuizQuestionsTable.find({
      quiz_id: attempted.quiz_id?._id,
    });
    const correctRes = quizQuestions.map((e) => ({
      ans_id: e._id,
      question_title: e.question_title[0],
      que_level: e.que_level[0],
      option1: e.option1[0],
      option2: e.option2[0],
      option3: e.option3[0],
      option4: e.option4[0],
      answer: e.answer[0],
      correctOption: e.correctOption,
    }));
    let userScores = {};
    const studentRes = attempted.ans_res[0] || [];
    correctRes.forEach((e, i) => {
      e.myAnswer = Object.values(studentRes)[i] || "";
    });
    let correctAns = 0;
    let wrongAnswers = 0;
    correctRes.forEach((e) => {
      if (e.correctOption === e.myAnswer) {
        correctAns++;
      } else if (e.myAnswer !== "") {
        wrongAnswers++;
      }
    });
    let myScore = 0;
    if (attempted?.quiz_id?.is_negative) {
      myScore =
        correctAns * parseFloat(attempted?.quiz_id?.eachQueMarks) -
        wrongAnswers * parseFloat(attempted?.quiz_id?.negativeMarks);
    } else {
      myScore = correctAns * parseFloat(attempted?.quiz_id?.eachQueMarks);
    }
    userScores = {
      quizTitle: attempted?.quiz_id?.quiz_title,
      quizId: attempted?.quiz_id?._id,
      wrongAnswers ,
      correctAns, 
      myScore,
      totalMarks: (
        parseFloat(attempted?.quiz_id?.eachQueMarks) * correctRes.length
      ).toFixed(2),
      accuracy: ((correctAns / correctRes.length) * 100).toFixed(2),
    };
    if( attempted?.quiz_id?._id){
      studentScores.push(userScores);
    }
  }
  return studentScores;
};

module.exports = {
  quizResult,
};
