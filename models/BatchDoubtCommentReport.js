const mongoose = require('mongoose');

const BatchDoubtCommentReportSchema = new mongoose.Schema({
    batchDoubtComment : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchDoubtComment',
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

const BatchDoubtCommentReport = new mongoose.model('BatchDoubtCommentReport' , BatchDoubtCommentReportSchema);

module.exports = {
    BatchDoubtCommentReport
}