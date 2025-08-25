const mongoose=require("mongoose")

const TestimonialSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        res:"adminTeacherTable"
    },
    student_name:{
        type:String
    },
    rank:{
        type:String
    },
    photo:{
        type:Object
    },
    message:{
        type:String
    },
    exam:{
        type:String
    },
    language:{
        type:String,
        enum:['hi','en','enhi']
    },
    year:{
        type:String
    },
    is_active:{
        type:Boolean
    },
    created_at:{
        type:String
    }
})


const TestimonialTable=new mongoose.model("TestimonialTable",TestimonialSchema);

module.exports={
    TestimonialTable
}
