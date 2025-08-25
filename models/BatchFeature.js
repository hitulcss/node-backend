const mongoose = require('mongoose');

const BatchFeatureSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    feature :  {
        type : String , 
        enum : ['lecture' , 'note' , 'dpp' , 'quiz' , 'announcement' , 'doubt' , 'community' , 'planner']
    }  ,
    icon : {
        type :  String ,
        default : ""
    } , 
    isActive :  {
        type : Boolean ,
        default : true 
    } ,
    order : {
        type : Number ,
        required : true , 
    }
} , { timestamps : true })

const BatchFeature = new mongoose.model('BatchFeature' , BatchFeatureSchema);

module.exports = {
    BatchFeature
}