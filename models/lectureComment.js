const mongoose = require('mongoose');

const lectureCommentSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    roomId : {
        type : mongoose.Schema.Types.ObjectId ,
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

const lectureCommentTable  = new mongoose.model("lectureCommentTable" , lectureCommentSchema);
lectureCommentSchema.index({ lectureId : 1 , roomId : 1} , { name  : 'LectureAndRoom'})
lectureCommentSchema.index({ lectureId : 1} , { name : 'lecture'})

module.exports = {
    lectureCommentTable
}