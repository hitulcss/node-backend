const mongoose = require('mongoose');

const BatchDoubtSchema = new mongoose.Schema({
    batch : {
        type :  mongoose.Schema.Types.ObjectId , 
        ref: 'BatchesTable',
        required: true
    } , 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LectureTable"
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubjectTable",
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
    },
    isResolved : {
        type :  Boolean ,
        default : false ,
    }
} , { timestamps :  true })

const BatchDoubt = new mongoose.model('BatchDoubt' , BatchDoubtSchema);

module.exports = {
    BatchDoubt
}