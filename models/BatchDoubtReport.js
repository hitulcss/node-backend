const mongoose = require('mongoose');

const BatchDoubtReportSchema = new mongoose.Schema({
    batchDoubt : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchDoubt',
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

const BatchDoubtReport = new mongoose.model('BatchDoubtReport' , BatchDoubtReportSchema);

module.exports = {
    BatchDoubtReport
}