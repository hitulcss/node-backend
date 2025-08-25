const mongoose=require("mongoose")

const TestSubjectSchema=new mongoose.Schema({
    title:{
        type:String,
        default:""
    },
    icon:{
        type:String,
        default : "https://d1mbj426mo5twu.cloudfront.net/assets/science.png",
    },
    isActive:{
        type:Boolean ,
        default : true , 
    },
    admin:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'adminTeacherTable' 
    },
})

const TestSubjectTable = new mongoose.model("TestSubjectTable",TestSubjectSchema);

module.exports={
    TestSubjectTable
}
