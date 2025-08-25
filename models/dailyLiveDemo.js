const mongoose = require("mongoose")

const dailyLiveDemoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    title: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },

    student: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    }],
    subject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubjectTable'
    }],
    teacher: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    }],
    starting_date: {
        type: String,
        default: ""
    },

    ending_date: {
        type: String,
        default: ""
    },
    mode: {
        type: String,
        default: ""
    },
    materials: {
        type: String,
        default: ""
    },
    language: {
        type: String,
        default: ""
    },
    charges: {
        type: String,
        default: ""
    },
    discount: {
        type: String,
        default: "0"
    },
    description: {
        type: String,
        default: ""
    },
    banner: [{
        type: Object
    }],
    language: {
        type: String,
        enum: ["hi", "en", 'enhi']
    },
    stream: {
        type: String,
        default: ""
    },
    remark: {
        type: String,
        default: ""
    },
    demoVideo: [{
        type: Object,
        // default:""
    }],
    validity: {
        type: String,
        default: ""
    },
    is_active: {
        type: Boolean,
        default: false
    },
    isPaid: {
        type: Boolean,
        default: true
    },
    isCoinApplicable: {
        type: Boolean,
        default: false
    },
    maxAllowedCoins: {
        type: String,
        default: "0"
    },
    course_review: {
        type: String,
        default: ""
    },
    batchOrder: {
        type: String,
        default: ""
    },
    created_at: {
        type: String,
        default: ""
    },
})

const DailyDemoTable = new mongoose.model("DailyDemoTable", dailyLiveDemoSchema);

module.exports = {
    DailyDemoTable
}