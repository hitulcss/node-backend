const mongoose = require("mongoose")

const storeFeatureVideosSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'adminTeacherTable'
        },
        title: {
            type: String,
            default: ""
        },
        icon: {
            type: String,
            default: ""
        },
        videoType: {
            type: String,
            default: "yt",
            enum: ['yt', 'upload']
        },
        url: {
            type: String,
            default: ""//productId/bookId
        },
        isActive: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true,
    }
)


const storeFeatureVideosTable = new mongoose.model("storeFeatureVideosTable", storeFeatureVideosSchema)
storeFeatureVideosSchema.index({ isActive :1 } ,{ name : 'active'})
module.exports = {
    storeFeatureVideosTable
}

