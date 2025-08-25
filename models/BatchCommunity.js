const mongoose = require('mongoose');

const BatchCommunitySchema = new mongoose.Schema({
    batch : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchesTable',
        required: true
    } , 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    desc : {
        type : String ,
        default : "" ,
    } ,
    
    problemImage : {
        type :  String ,
        default : ""
    },
    isActive : {
        type : Boolean ,
        default : false 
    }
} , { timestamps :  true })

const BatchCommunity = new mongoose.model('BatchCommunity' , BatchCommunitySchema);

module.exports = {
    BatchCommunity
}