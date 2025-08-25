const mongoose = require("mongoose")

const scholarshipTestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizTable"
    },
    title: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: "" //editor
    },
    banner: {
        type: String,
        default: ""
    },
    startingAt: {
        type: String,
        default: ""
    },
    duration: {
        type: String,
        default: ""
    },
    resultDeclaration: {
        type: String,
        default: ""
    },
    registrationEndAt: {
        type: String,
        default: ""
    },
    created_at: {
        type: String,
        default: ""
    },
    shareLink : {
        type : Object ,
        default : {
            link : "" ,
            text : ""
        }
    },
    isActive : {
        type : Boolean ,
        default : false
    }

} , { timestamps : true })

const scholarshipTestTable = new mongoose.model("scholarshipTestTable", scholarshipTestSchema);

module.exports = {
    scholarshipTestTable
}