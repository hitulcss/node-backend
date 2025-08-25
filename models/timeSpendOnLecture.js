

const mongoose = require('mongoose');

const timeSpendOnLectureSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'UsersTable'
    },
    lecture : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'LectureTable'
    },
    timeSpend : {
        type : String,
        default:"0"
    },
    createdAt : {
        type: String,
        default:""
    },
    roomId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'lectureRoomTable',
        default : null ,
    } ,
    attainAt : {
        type : Date , 
        default : Date.now() ,
    }
    
// } ,{ timestamps : true })
})

const timeSpendOnLecture = new mongoose.model("timeSpendOnLecture" , timeSpendOnLectureSchema);
timeSpendOnLectureSchema.index({ lecture : 1} , { name : 'lectureWise'});
module.exports = {
    timeSpendOnLecture
}