const mongoose = require('mongoose') ;
const channelSchema =  new mongoose.Schema({
    name : {
        type : String ,
        default: "",
    },
    profile : {
        type : String , 
        default : "https://static.sdcampus.com/AIR/sdcampus_logo_1715583423.png"
    } , 
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable"
    },
    category : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryTable',
        default: null
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

} , { timestamps : true });

const channelTable = new mongoose.model('channel' , channelSchema);

module.exports = {
    channelTable
}