const mongoose =  require('mongoose');
const reportLectureCommentSchema =  new mongoose.Schema({
    user : [{
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'UsersTable'
    }], 
    commentId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'lectureRecordedCommentsTable',
    },
} , { timestamps : true});

const reportLectureCommentTable =  new mongoose.model('reportLectureCommentTable' , reportLectureCommentSchema) ;

module.exports  = {
    reportLectureCommentTable
}