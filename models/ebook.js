const mongoose = require('mongoose') ;
const ebookSchema =  new mongoose.Schema({
    title : {
        type : String ,
        default: "",
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable",
        default : null ,
    },
    slug : {
        type :  String ,
        default : ""
    },
    category:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productCategoryTable"
    }],
    preview:{
        type : Object ,
        // default : ""
    },
    description : {
        type : String ,
        default : ""
    } ,
    banner : {
        type : String ,
        default : "",
    },
    tags : [{
        type : String , 
        default : ""
    }] ,
    keyFeatures : [{
        type : String , 
        default : ""
    }] ,
    language: {
        type: String,
        enum: ["hi", "en", 'enhi']
    },
    faqs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'faqsTable',
        default: null
    }],
    metaTitle : {
        type : String ,
        default : ""
    },
    metaDesc : {
        type : String ,
        default : ""
    },
    chapterCount : {
        type : Number ,
        default : 0
    },
    regularPrice : {
        type : String ,
        default : ""
    },
    salePrice : {
        type : String ,
        default : ""
    } , 
    demoBooks : [{
        type : Object 
    }] , 
    shareLink : {
        type : Object ,
        default : {
            link : "" ,
            text : ""
        }
    },
    isActive : {
        type : Boolean ,
        default : false 
    },
    isPaid : {
        type : Boolean ,
        default : true 
    }

} , { timestamps : true });

const ebookTable = new mongoose.model('ebookTable' , ebookSchema);

module.exports = {
    ebookTable
}