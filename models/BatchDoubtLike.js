const mongoose = require('mongoose');

const BatchDoubtLikeSchema = new mongoose.Schema({
    batchDoubt : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchDoubt',
        required: true
    }, 
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    }],
} , { timestamps :  true })

const BatchDoubtLike = new mongoose.model('BatchDoubtLike' , BatchDoubtLikeSchema);

module.exports = {
    BatchDoubtLike
}