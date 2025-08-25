const mongoose = require('mongoose');

const BatchCommunityLikeSchema = new mongoose.Schema({
    batchCommunity : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchCommunity',
        required: true
    }, 
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    }],
} , { timestamps :  true })

const BatchCommunityLike = new mongoose.model('BatchCommunityLike' , BatchCommunityLikeSchema);

module.exports = {
    BatchCommunityLike
}