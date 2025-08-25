const mongoose = require('mongoose');

const BatchCommunityCommentReplyReportSchema = new mongoose.Schema({
    batchCommunityCommentReply : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchCommunityCommentReply',
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

const BatchCommunityCommentReplyReport = new mongoose.model('BatchCommunityCommentReplyReport' , BatchCommunityCommentReplyReportSchema);

module.exports = {
    BatchCommunityCommentReplyReport
}