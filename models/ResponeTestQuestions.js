const mongoose = require('mongoose')


const ResponseTestQuestions = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable",
    },
    TestQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestQuestionTable"
    },
    selected_answer: {
        type: String
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestSeriesTestTable",
    },
    is_active: {
        type: Boolean
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
}, { timestamps: true })


const ResponseTestTable = new mongoose.model('ResponseTestTable', ResponseTestQuestions)

module.exports = {
    ResponseTestTable
}