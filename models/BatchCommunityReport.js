const mongoose = require('mongoose');

const BatchCommunityReportSchema = new mongoose.Schema({
    batchCommunity : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchCommunity',
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

const BatchCommunityReport = new mongoose.model('BatchCommunityReport' , BatchCommunityReportSchema);

module.exports = {
    BatchCommunityReport
}