const mongoose =  require('mongoose');
const lectureRecordedCommentsSchema =  new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'UsersTable'
    },
    commentText : {
        type : String ,
        default : "",
    } , 
    replyTo : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'lectureRecordedCommentsTable',
        default :  null ,
    },
    lectureId : {
        type :  mongoose.Schema.Types.ObjectId ,
        ref : 'LectureTable'
    },
    isPin : {
        type : Boolean ,
        default :  false
    }
} , { timestamps : true});

const lectureRecordedCommentsTable =  new mongoose.model('lectureRecordedCommentsTable' , lectureRecordedCommentsSchema) ;

module.exports  = {
    lectureRecordedCommentsTable
}