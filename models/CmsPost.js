const mongoose = require("mongoose");

const cmsPostSchema = new mongoose.Schema(
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
        desc: {
            type: String,
            default: ""
        },

        tags: {
            type: String,
            default: "blog",
            enum: ["blog", "news", "notification"]
        },


        featuredImage: {
            type: String,
            default: "",
        },

        language: {
            type: String,
            enum: ["hi", "en", "enhi"],
            default: "en"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        shareLink: {
            type: Object,
            default: {
                link: "",
                text: ""
            }
        },
        isCommentAllowed: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
    })

const cmsPostTable = new mongoose.model("cmsPostTable", cmsPostSchema);

module.exports = {
    cmsPostTable
}