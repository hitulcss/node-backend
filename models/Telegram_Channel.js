const mongoose=require("mongoose")

const Telegram_ChannelSchema=new mongoose.Schema({
    user:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'adminTeacherTable' 
    },
    channel_url:{
        type:String
    },
    title:{
        type:String
    },
    is_active:{
        type:Boolean
    },
    created_At:{
        type:String
    }
})

const Telegram_Channel=new mongoose.model("Telegram_Channel",Telegram_ChannelSchema);

module.exports={
    Telegram_Channel
}