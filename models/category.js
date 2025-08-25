const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    title: {
        type: String,
        default: ""
    },
    slug: {
        type: String,
        default: "",
    },
    icon: { type: Object, default: "" },
    is_active: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: String,
        default: ""
    },
    type: {
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
    seoSlug: {
        type: String,
        default: ""
    },
    seoMetaTitle: {
        type: String,
        default: ""
    },
    seoMetaDesc: {
        type: String,
        default: ""
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    tags : [{
        type : String ,
        default : ""
    }] ,
    faqs : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'faqsTable'
    }],
}, { timestamps: true })


const categoryTable = new mongoose.model("categoryTable", categorySchema)
categorySchema.index({ type : 1 , is_active : 1} , { name : 'typeAndActive'});
module.exports = {
    categoryTable
}

