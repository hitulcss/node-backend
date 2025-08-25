const mongoose=require('mongoose')

const TestQuestions=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
         ref:'adminTeacherTable' ,
    },
    testSeries_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'TestSeriesTable',
    },
    test_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"TestSeriesTestTable",
    },
    question_title:{
       type:String
    },
    option1:{
       type:String
    },
    option2:{
       type:String
    },
    option3:{
       type:String
    },
    option4:{
       type:String
    },
    answer:{
      type:String
    },
    correctOption:{
       type:String
    },
    is_active:{
        type:Boolean
    },
    created_at:{
        type:String
    },
    updated_at:{
        type:String
    },
})


const TestQuestionsTable=new mongoose.model('TestQuestionTable',TestQuestions)

module.exports={
    TestQuestionsTable
}