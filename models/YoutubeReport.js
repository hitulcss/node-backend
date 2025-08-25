const mongoose = require('mongoose');

const youtubeReportSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    youtubeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "YouTube_Url"
    },
    desc : {
        type : String, 
        default : ""
    },
} , { timestamps : true}); 

const YoutubeReportTable  = new mongoose.model("YoutubeReportTable" , youtubeReportSchema);
module.exports = {
    YoutubeReportTable
}