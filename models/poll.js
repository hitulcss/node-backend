const mongoose = require('mongoose');

const pollSchema =  new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable",
    },
    lectureId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "LectureTable"
    },
    // roomId : {
    //     type : mongoose.Schema.Types.ObjectId ,
    //     ref  : 'lectureRoomTable'
    // },
    options : [
        {
            type  : String ,
            default : ""
        }
    ],
    pollType : {
        type : String, 
        default : "single",
        enum : ["single" , "multiple" , "integer" , 'vote']
    },
    duration : {
        type : String, 
        default : ""
    },
    correctOptions : [
        {
            type  : String, 
            default : "",
        }
    ],
    isActive : {
        type : Boolean,
        default : false
    }

} , { timestamps : true}); 

const pollTable  = new mongoose.model("pollTable" , pollSchema);

module.exports = {
    pollTable
}