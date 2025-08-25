const mongoose = require('mongoose');

const lectureRatingSchema =  new mongoose.Schema({
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
    rating : {
        type : String ,
        enum : ["1" , "2" , "3" , "4" , "5"],
        default : "5",
    },
    title : {
        type : String, 
        default : ""
    },
} , { timestamps : true}); 

const lectureRatingTable  = new mongoose.model("lectureRatingTable" , lectureRatingSchema);
lectureRatingSchema.index({ lectureId : 1 , roomId : 1} , { name  : 'LectureAndRoom'})
lectureRatingSchema.index({ lectureId : 1} , { name : 'lecture'})
module.exports = {
    lectureRatingTable
}