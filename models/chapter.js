const mongoose = require('mongoose') ;
const chapterSchema =  new mongoose.Schema({
    title : {
        type : String ,
        default: "",
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable"
    },
    ebook : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'ebookTable'
    },
    description : {
        type : String ,
        default : ""
    } ,
    paid : {
        type :Boolean ,
        default : false
    },
    topicCount : {
        type : Number ,
        default : 0
    },
    chapterNumber : {
        type : Number ,
        default : 1,
    },
    // topics : [{
    //     type : Object  
    // }] , 
    isActive : {
        type : Boolean ,
        default : false 
    }

} , { timestamps : true });

const chapterTable = new mongoose.model('chapterTable' , chapterSchema);

module.exports = {
    chapterTable
}