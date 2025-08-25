
const mongoose=require("mongoose")

const YouTube_Urls=new mongoose.Schema({
    user:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'adminTeacherTable' 
    },
    title:{
       type:String
    },
    video_url:{
        type:String
    },
    desc :{
        type:String , 
        default : "" 
    },
    notes : [
        {
            type : Object ,
        }
    ] , 
    is_active:{
        type:Boolean
    },
    created_at:{
        type:String
    },
    slug :{
        type : String,
        default:""
    },
    link: {
        type: String,
        default: 'none',
        enum: ['none', 'batch', 'testSeries' , 'category']
    },
    linkWith: {
        type: String,
        default: ''
    },
    language:{
        type:String,
        enum:['hi','en','enhi']
    },
    category: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'categoryTable',
              default: null
    }],
    subCategory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subCategoryTable',
        default: null
    }],
    subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubjectTable",
    },

    shareLink: {
        type: Object,
        default: {
            link: "",
            text: ""
        }
    },
})

const YouTube_Url=new mongoose.model("YouTube_Url",YouTube_Urls);
YouTube_Urls.index({ is_active : 1 , linkWith : 1   ,language : 1} , { name  :' activeAndLinkWith'})
module.exports={
    YouTube_Url
}