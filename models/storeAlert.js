const mongoose = require('mongoose');

const storeAlertSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminTeacherTable"
    },
    title:{
        type:String,
        default:""
    },
    link: {
        type: String,
        default: 'none',
        enum: ['none', 'product', 'category']
    },
    linkWith: {
        type: String,
        default: ''//productId/bookId
    },
    isActive: {
        type: Boolean,
        default: false
    },
},{timestamps:true});

const storeAlertTable = new mongoose.model('storeAlertTable', storeAlertSchema);

module.exports = {
    storeAlertTable
}