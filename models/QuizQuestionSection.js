const mongoose = require('mongoose');

const QuizQuestionSectionSchema =  new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable",
    },
    title : {
        type : String , 
        default : "" , 
    } ,
    sectionId : {
        type :  String ,
        unique : true ,
        // default : "" , 
    } , 
    isActive : {
        type : Boolean ,
        default : true , 
    }
} , { timestamps : true });

QuizQuestionSectionSchema.pre('save' , async function (next)  {
    // console.log(this);
    if( !this.sectionId){
        let words = this.title.substring(0 , 5) ;
        let latest =  await this.constructor.findOne({}).sort({ createdAt : -1});
        let sequence = latest ? parseInt(latest.sectionId.match(/\d+$/) || 1) + 1 : 1
        this.sectionId = `${words}-${sequence}` ;
    }
    next();
})

const QuizQuestionSection = new mongoose.model('QuizQuestionSection' , QuizQuestionSectionSchema);

module.exports = {
    QuizQuestionSection
}