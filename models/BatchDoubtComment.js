const mongoose = require('mongoose');

const BatchDoubtCommentSchema = new mongoose.Schema({
    batchDoubt : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchDoubt',
        required: true
    } , 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    msg : { 
        type :  String ,
        default : "" ,
    } , 
    image : {
        type : String , 
        default : "" , 
    } , 
    isActive : {
        type :  Boolean ,
        default : true 
    }
} , { timestamps :  true })

const BatchDoubtComment = new mongoose.model('BatchDoubtComment' , BatchDoubtCommentSchema);

module.exports = {
    BatchDoubtComment
}