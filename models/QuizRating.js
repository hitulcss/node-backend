const mongoose = require('mongoose');

const quizRating =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    quiz : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Quiz'
    },
    rating : {
        type : Number ,
        enum : [1 , 2 , 3 , 4 , 5],
    },
    
} , { timestamps : true}); 

const QuizRating  = new mongoose.model("QuizRating" , quizRating);

module.exports = {
    QuizRating
}