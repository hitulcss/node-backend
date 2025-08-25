const mongoose = require('mongoose');

const shortReportSchema = new mongoose.Schema({
    short : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'short',
        required: true
    } , 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    reason : { 
        type :  String ,
        default : "" ,
    }
} , { timestamps :  true })

const shortReportTable = new mongoose.model('shortReport' , shortReportSchema);

module.exports = {
    shortReportTable
}