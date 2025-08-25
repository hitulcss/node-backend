const mongoose = require('mongoose');

const topicSchema =  new mongoose.Schema({
    title : {
        type : String ,
        default : ""
    } ,
    admin :{
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'adminTeacherTable'
    } , 
    chapter : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'chapterTable'
    },
    details : {
        type : Object
    } ,
    topicNumber : {
        type : Number,
        default : 1 
    },
    isActive : {
        type : Boolean ,
        default : false 
    }

} , { timestamps : true })

const topicTable =  new mongoose.model('topicTable' , topicSchema) ;

module.exports = {
    topicTable
}