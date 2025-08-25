const mongoose = require('mongoose');

const ResultBannerSchema =  new mongoose.Schema({
  title : {
    type : String ,
    default : ""
  } ,
  admin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'adminTeacherTable'
  },
  year : {
    type : Number ,
  } , 
  banner : {
    type : String ,
    default :"" ,
  } , 
  category : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categoryTable',
    default: null
  },
  isActive :{
    type : Boolean ,
    default : false
  }
} , { timestamps : true }) ;

const resultBannerTable = new mongoose.model("resultBannerTable" , ResultBannerSchema);

module.exports = {
    resultBannerTable
}