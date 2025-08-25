const mongoose = require('mongoose');

const ValiditySchema =  new mongoose.Schema({
    admin : {
        type :  mongoose.Schema.Types.ObjectId ,
        ref : 'adminTeacherTable'
    } , 
    month  : {
        type : Number ,
        default : 1 , 
    } ,
    name : {
        type : String ,
        default : ""
    } , 
    batch : {
        type :  mongoose.Schema.Types.ObjectId ,
        ref : 'BatchesTable'
    } , 
    salePrice : {
        type : Number ,
        default : 0  
    } ,
    regularPrice : {
        type : Number , 
        default : 0 
    } ,
    isActive : {
        type : Boolean ,
        default : true 
    } ,
    isRecommended : {
        type : Boolean ,
        default : false 
    } ,
    features: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "ValidityFeatureTable"
    }],
} , { timestamps : true }) ;

const ValidityTable =  new mongoose.model('ValidityTable' , ValiditySchema);
ValiditySchema.index({batch : 1 } , { name : 'batchAndActive'})

module.exports = {
    ValidityTable
}