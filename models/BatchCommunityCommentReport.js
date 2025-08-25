const mongoose = require('mongoose');

const BatchCommunityCommentReportSchema = new mongoose.Schema({
    batchCommunityComment : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchCommunityComment',
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

const BatchCommunityCommentReport = new mongoose.model('BatchCommunityCommentReport' , BatchCommunityCommentReportSchema);

module.exports = {
    BatchCommunityCommentReport
}