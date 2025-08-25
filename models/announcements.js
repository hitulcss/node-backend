const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    title: {
        type: String,
        default:""
    },
    description : {
        type : String,
        default : ""
    } ,
    link: {
        type: String,
        default: 'none',
        enum: ['none', 'batch', 'testSeries']
    },
    linkWith: {
        type: String,
        default: ''

    },
    isActive: {
        type: Boolean,
        default:false,
    },
    
}, { timestamps : true})



const announcementTable = new mongoose.model("announcementTable", announcementSchema)
announcementSchema.index({ linkWith :  1} , { name : "linkWithWise"})
module.exports = {
    announcementTable
}