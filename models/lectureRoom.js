const mongoose = require('mongoose');

const lectureRoomSchema  =  new mongoose.Schema({
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    }],
    title : {
        type : String ,
        default :""  
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchesTable"
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LectureTable"
    },
    mentor : [{
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'adminTeacherTable'
    }],
    isActive : {
        type : Boolean ,
        default : true
    }
} , { timestamps : true }) 

const lectureRoomTable =  new mongoose.model('lectureRoomTable' , lectureRoomSchema);
lectureRoomSchema.index({ lecture  : 1} , { name : 'lecture'})
module.exports = {
    lectureRoomTable
}