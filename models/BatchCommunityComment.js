const mongoose = require('mongoose');

const BatchCommunityCommentSchema = new mongoose.Schema({
    batchCommunity : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchCommunity',
        required: true
    } , 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    image : {
        type : String , 
        default : "" , 
    } , 
    msg : { 
        type :  String ,
        default : "" ,
    } , 
    isActive : {
        type :  Boolean ,
        default : true 
    }
} , { timestamps :  true })

const BatchCommunityComment = new mongoose.model('BatchCommunityComment' , BatchCommunityCommentSchema);

module.exports = {
    BatchCommunityComment
}