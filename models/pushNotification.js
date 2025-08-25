const mongoose = require('mongoose');

const pushNotificationSchema = new mongoose.Schema({
    admin : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'adminTeacherTable'
    },
    userType : {
        type : String ,
        default :'all',
        enum : ['all' , 'batch' , 'category' , 'currentCategory']
    },
    linkWith :[ {
        type : String ,
        default : ""  // according usertype
    }],
    data : {
        type : Object,
        default : {
            title: "",
          message: "",
          fileUrl: "",
          route: "",
          rootId: "",
          childId: "",
          linkUrl : ""
        }
    },
    publishDate : {
        type :Date ,
        default : Date.now()
    },
    isActive : {
        type : Boolean,
        default : false
    }
} , { timestamps : true });

const pushNotificationTable =  new mongoose.model("pushNotificationTable" , pushNotificationSchema);

module.exports = {
    pushNotificationTable
}