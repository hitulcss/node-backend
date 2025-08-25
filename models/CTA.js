const mongoose = require('mongoose');

const ctaSchema = new mongoose.Schema({
    fullName: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categoryTable",
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    // class: {
    //     type: String,
    //     default: ""
    // },
    standard: {
        type: String,
        default: ""
    },
    msg: {
        type: String,
        default: ""
    },
    utm_campaign: {
        type: String,
        default: ""
    },
    utm_source: {
        type: String,
        default: ""
    },
    utm_medium: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const ctaTable = new mongoose.model('ctaTable', ctaSchema);
module.exports = {
    ctaTable
}