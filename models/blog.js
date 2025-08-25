const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "adminTeacherTable"
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categoryTable',
        },
        title: {
            type: String,
            default: "",
        },
        slug: {
            type: String,
            default: ""
        },
        metaTitle: {
            type: String,
            default: ""
        },
        metaDesc: {
            type: String,
            default: ""
        },
        desc: {
            type: String,
            default: ""
        },
        
        tags: [{
            type: String,
            default: "sd"
        }],
       
        
        featuredImage: {
            type: String,
            default: "",
        },
        // images: [{
        //     type: String,
        //     default: ""
        // }],
        language: {
            type: String,
            enum: ["hi", "en", "enhi"]
        },
        platform: {
            type: String,
            enum: ["app", "website", "store"],
            default:"website"
        },
        link : {
            type : String ,
            default:"",
        },
        excerptTitle : {
            type : String,
            default : ""
        },
        isActive: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true,
    })

const blogsTable = new mongoose.model("blogsTable", blogSchema);
blogSchema.index({ isActive : 1 , platform : 1 } , { name : 'ActiveAndPlatfromWise'})
module.exports = {
    blogsTable
}