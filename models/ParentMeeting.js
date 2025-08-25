const mongoose = require('mongoose');

const parentMeetingSchema = new mongoose.Schema({
    title : {
        type : String ,
        default : ""
    } ,
     description : {
        type : String ,
        default : ""
     } ,
     banner : {
      type : String , 
      default : "" ,
     },
     meetingLink : {
        type : String ,
        default : ""
     } , 
     startTime : {
        type : Date
     } , 
     endTime : {
        type :  Date ,
     } , 
     link : {
        type : String , 
        enum : ['batch' , 'category' , 'none'] , 
     } ,
     linkWith : {
        type : String ,
        default : '' ,
     }

})

const ParentMeetingTable =  new mongoose.model('ParentMeetingTable' , parentMeetingSchema) ;

module.exports = {
    ParentMeetingTable
}