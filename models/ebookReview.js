const mongoose = require('mongoose') ;
const ebookReviewSchema =  new mongoose.Schema({
    title : {
        type : String ,
        default: "",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    ebook : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'ebookTable'
    },
    rating  : {
        type : Number ,
        enum : [1 , 2 , 3 , 4 , 5]
    } ,
} , { timestamps : true });

const ebookReviewTable = new mongoose.model('ebookReviewTable' , ebookReviewSchema);

module.exports = {
    ebookReviewTable
}