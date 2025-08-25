const mongoose = require('mongoose');

const ValidityFeatureSchema =  new mongoose.Schema({
    admin : {
        type :  mongoose.Schema.Types.ObjectId ,
        ref : 'adminTeacherTable'
    } , 
    name : {
        type : String ,
        default : ""
    } , 
    batch : {
            type :  mongoose.Schema.Types.ObjectId ,
            ref : 'BatchesTable'
    } , 
    info : {
        type :  String ,
        default : ""
    } , 
    isActive : {
        type : Boolean ,
        default : true 
    }
} , { timestamps : true }) ;

const ValidityFeatureTable =  new mongoose.model('ValidityFeatureTable' , ValidityFeatureSchema);

module.exports = {
    ValidityFeatureTable
}