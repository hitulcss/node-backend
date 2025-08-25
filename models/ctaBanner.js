const mongoose = require('mongoose');

const ctaBannerSchema =  new mongoose.Schema({
    admin : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'adminTeacherTable'
    },
    icon :  {
        type : String,
        default : ''
    },
    link : {
        type : String ,
        default : ''
    },
    linkWith : {
        type : String ,
        default :''

    },
    renderLink : {
        type : String ,
        default : ""
    },
    routingLink : {
        type : String ,
        default : ""
    },
    isActive : {
        type : Boolean ,
        default : false 
    }
} , { timestamps : true})

const ctaBannerTable = new mongoose.model('ctaBannerTable' , ctaBannerSchema);

module.exports = {
    ctaBannerTable
}