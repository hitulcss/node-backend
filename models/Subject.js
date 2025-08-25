const mongoose=require("mongoose")

const SubjectSchema=new mongoose.Schema({
    title:{
        type:String,
        default:""
    },
    icon:{
        type:String,
        default : "https://d1mbj426mo5twu.cloudfront.net/assets/science.png",
    },
    is_active:{
        type:String
    },
    user:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'adminTeacherTable' 
    },
})

const SubjectTable=new mongoose.model("SubjectTable",SubjectSchema);

module.exports={
    SubjectTable
}
