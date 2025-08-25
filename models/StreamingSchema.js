const mongoose=require('mongoose')


const StreamingSchema=new mongoose.Schema({
    ChannelName:{
        type:String
    }, 
    client:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'clientTable' 
    },
    usersCount:{
        type:Number
    },
    Message:{
        type:String
    },
    is_Active:{
        type:Boolean
    },
    Stream_title:{
        type:String
    },
    blockedUsers:[{
        type:String
    }],
    Start_dateTime:{
        type:String
    },
    end_time:{
        type:String
    },
    feature_image:{
        type:String
    },
    Description:{
        type:String
    },
    created_at:{
        type:String
    },
    // batch:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:""
    // }
})


const clientSchema=mongoose.Schema({
    StreamingChannelID:{
        type:String
    },
    clientId:{
        type:String
    },
    clientName:{
        type:String
    },
    clientEmail:{
        type:String
    },
    userID:{
        type:String
    },
    RTMToken:{
        type:String
    },
    RTCToken:{
        type:String
    },
    Role:{
        type:String
    },
})


const StreamingSummerySchema=mongoose.Schema({
    ChannelName:{
        type:String
    }, 
    client:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'adminTeacherTable' 
    },
    usersCount:{
        type:Number
    },
    is_Active:{
        type:Boolean
    },
    Stream_title:{
        type:String
    },
    Start_dateTime:{
        type:String
    },
    end_time:{
        type:String
    },
    feature_image:{
        type:String
    },
    Description:{
        type:String
    },
    created_at:{
        type:String
    },
    // batch:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:""
    // }
})


const StreamingUserSchema=new mongoose.Schema({
      channelName:{
        type:String     
    },
      userJoinUID:{
         type:String
      },
      profilePicture:{
          type:String
      },
      studentName:{
        type:String
      },
      userUniqueId:{
        type:String
      }

})




const StreamingUserTable=new mongoose.model("StreamingUserInfoTable",StreamingUserSchema);
const StreamingTable=new mongoose.model('StreamingTable',StreamingSchema)
const clientTable=new mongoose.model('clientTable',clientSchema);
const StreamingSumaryTable=new mongoose.model('StreamingSumaryTables',StreamingSummerySchema)


module.exports={
    clientTable,
    StreamingTable,
     StreamingUserTable ,
    StreamingSumaryTable
}