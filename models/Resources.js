const mongoose = require("mongoose")

const ResourcesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryTable'
    },
    subject: {
        type: String,
        default: ""
    },
    subjectId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubjectTable",
    }, 
    year : {
        type : Number ,
    } , 
    title: {
        type: String,
        default: ""
    },
    file_url: {
        type: Object
    },
    language: {
        type: String,
        enum: ['hi', 'en', 'enhi']
    },
    is_active: {
        type: Boolean,
        default: true
    },
    Created_At: {
        type: String,
        default: ""
    },
    resource_type: {
        type: String,
        default: ""
    }
}, { timestamps: true })

const ResourcesTable = new mongoose.model("Resource", ResourcesSchema);
module.exports = {
    ResourcesTable
}