const mongoose = require('mongoose') ;
const myEbookSchema =  new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    },
    ebook : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'ebookTable'
    },
    amount : {
        type : Number ,
        default : 0 ,
    },
    expireDate : {
        type : Date ,
    },
    isActive : {
        type : Boolean ,
        default : false
    }
} , { timestamps : true });

const myEbookTable = new mongoose.model('myEbookTable' , myEbookSchema);

module.exports = {
    myEbookTable
}