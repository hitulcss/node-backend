const mongoose=require('mongoose')

const NewTestQuestions =mongoose.Schema({
    admin:{
        type:mongoose.Schema.Types.ObjectId,
         ref:'adminTeacherTable' ,
    },
    testSeries:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'TestSeriesTable',
    },
    test:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"TestSeriesTestTable",
    },
    questionTitle:{
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
    isActive:{
        type:Boolean
    },
   
} , { timestamps :  true})


const NewTestQuestionsTable=new mongoose.model('NewTestQuestionTable',NewTestQuestions)

module.exports={
    NewTestQuestionsTable
}