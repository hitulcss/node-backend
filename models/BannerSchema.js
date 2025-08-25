const mongoose = require('mongoose')

const BannerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    banner_url: {
        type: String
    },
    title: {
        type: String
    },
    language: {
        type: String,
        enum: ['hi', 'en', 'enhi']
    },
    // fileType:{
    //    type:String,
    //    enum:['image','video']
    // },
    category: {
        type: String
        // type:mongoose.Schema.Types.ObjectId,
        // ref:'categoryTable' 
    },
    BannerType: {
        type: String,
        enum: ['APP', 'WEB', 'TAB']
    },
    link: {
        type: String,
        default: 'none',
        enum: ['none', 'batch', 'testSeries', 'category', 'link', 'scholarship']
    },
    linkWith: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean
    },
    created_at: {
        type: String
    }
}, { timestamps: true })



const BannerTable = new mongoose.model("BannerTable", BannerSchema)
BannerSchema.index({ BannerType : 1 , is_active : 1} , { name : 'typeAndActive'})
module.exports = {
    BannerTable
}