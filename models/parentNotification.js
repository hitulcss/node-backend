const mongoose = require('mongoose');

const parentNotificationSchema = new mongoose.Schema({
    title : {
        type : String ,
        default : ""
    } ,
     description : {
        type : String ,
        default : ""
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

const ParentNotificationTable =  new mongoose.model('ParentNotificationTable' , parentNotificationSchema) ;

module.exports = {
    ParentNotificationTable
}