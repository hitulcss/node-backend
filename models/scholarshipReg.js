const mongoose = require("mongoose")

const scholarshipRegSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsersTable'
        },
        scholarshipTestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "scholarshipTestTable"
        },
        registrateredAt: {
            type: String,
            default: ""
        },
    },
    {
        timestamps: true
    }
)

const scholarshipRegTable = new mongoose.model("scholarshipRegTable", scholarshipRegSchema);
scholarshipRegSchema.index({ user : 1  , scholarshipTestId : 1} , { name : 'userAndScholarshipTest'})
module.exports = {
    scholarshipRegTable
}