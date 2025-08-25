const mongoose = require('mongoose');

const pollResponseSchema =  new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    lectureId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "LectureTable"
    },
    roomId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'lectureRoomTable'
    },
    pollId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "pollTable"
    },
    duration : {
        type : String, 
        default : "" // in sec
    },
    options : [
        {
            type  : String, 
            default : "",
        }
    ],
    result: {
        type:String ,
        enum : ['success', 'failed']
    }
   

} , { timestamps : true}); 

const pollResponseTable  = new mongoose.model("pollResponseTable" , pollResponseSchema);

module.exports = {
    pollResponseTable
}