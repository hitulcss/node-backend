const mongoose = require('mongoose');

const lectureReportSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    roomId : {
        type : mongoose.Schema.Types.ObjectId,
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
} , { timestamps : true}); 

const lectureReportTable  = new mongoose.model("lectureReportTable" , lectureReportSchema);
lectureReportSchema.index({ lectureId : 1 , roomId : 1} , { name  : 'LectureAndRoom'})
lectureReportSchema.index({ lectureId : 1} , { name : 'lecture'})
module.exports = {
    lectureReportTable
}