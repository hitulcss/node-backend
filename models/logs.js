const mongoose = require("mongoose")

const logsSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref  : 'adminTeacherTable'
    },
    event: {
        type: String,
        default: ""
    },
    action: {
        type: String,
        default: ""
    },
    data: [{
        type: Object,
        default: {}
    }]

}, { timestamps: true })

const logsTables = new mongoose.model("logsTables", logsSchema);

module.exports = {
    logsTables
}