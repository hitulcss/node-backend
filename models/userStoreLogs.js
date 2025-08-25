const mongoose = require('mongoose');
const userStoreLogsSchema =  new mongoose.Schema({
    user : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : 'UsersTable',
        default : null 
    },
    searchText : {
        type :  String ,
        default : "" ,
    },
    searchQuery : [{
        type : mongoose.Schema.Types.Mixed ,
        default : ""
    }] , 
    type : {
        type : String ,
        default : "" , 
        enum : ['course' , 'store']
    }

} , { timestamps : true}) ;

const userStoreLogsTable =  new mongoose.model('userStoreLogsTable' , userStoreLogsSchema);

module.exports = {
    userStoreLogsTable
}