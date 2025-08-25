const mongoose = require('mongoose');

const lectureDoubtSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    roomId : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : 'lectureRoomTable'
    },
    // batchId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "BatchesTable",
    // },
    lectureId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "LectureTable"
    },
    title : {
        type : String, 
        default : ""
    },
    time : {
        type : String,
        default : ""
    },
    answer: {
        type : String ,
        default : ""
    },
    resolver : {
        type : mongoose.Schema.Types.ObjectId ,
        ref: 'adminTeacherTable' ,
        default : null ,
    },
    resolveTime : {
        type : String ,
        default : ""
    },
    isResolved: {
        type : Boolean ,
        default : false
    }
} , { timestamps : true}); 

const lectureDoubtTable  = new mongoose.model("lectureDoubtTable" , lectureDoubtSchema);
lectureDoubtSchema.index({ lectureId : 1 , roomId : 1} , { name  : 'LectureAndRoom'})
lectureDoubtSchema.index({ lectureId : 1} , { name : 'lecture'})
module.exports = {
    lectureDoubtTable
}