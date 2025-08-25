const mongoose = require('mongoose');

const SuccessStorySchema =  new mongoose.Schema({

  desc : {
    type : String ,
    default :"" ,
  } , 
  admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'adminTeacherTable'
    }, 
  url : {
    type : String ,
    default : ""
  } ,
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersTable",
  },
  resultInfo : {
    type : String ,
    default : ""
  } , 
  category : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categoryTable',
    default: null
  },
  year : {
    type : Number ,
  } , 
  isActive : {
    type : Boolean ,
    default : false 
  }
} , { timestamps : true }) ;

const SuccessStoryTable = new mongoose.model("SuccessStoryTable" , SuccessStorySchema);

module.exports = {
    SuccessStoryTable
}