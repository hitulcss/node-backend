const mongoose = require('mongoose') ;
const shortSchema =  new mongoose.Schema({
    title : {
        type : String ,
        default: "",
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "channel"
    },
    urls : [{
        type : Object , 
        default : {
            label : "" ,
            url : ""
        }
    }], 
    description : {
        type : String ,
        default : ""
    } ,
    isActive : {
        type : Boolean ,
        default : false 
    } , 
    shareLink : {
        type : Object ,
        default : {
            link : "" ,
            text : ""
        }
    },
    shareCount : {
        type : Number , 
        default : 0 , 
    }

} , { timestamps : true });

const shortTable = new mongoose.model('short' , shortSchema);

module.exports = {
    shortTable
}