const mongoose = require('mongoose');

const YoutubeRatingSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    youtubeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "YouTube_Url"
    },
    rating : {
        type : String ,
        enum : ["1" , "2" , "3" , "4" , "5"],
        default : "5",
    },
    title : {
        type : String, 
        default : ""
    },
} , { timestamps : true}); 

const YoutubeRatingTable  = new mongoose.model("YoutubeRatingTable" , YoutubeRatingSchema);
module.exports = {
    YoutubeRatingTable
}