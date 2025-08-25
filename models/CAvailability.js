const mongoose = require("mongoose");

const CAvailabilitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CUser",
            unique: true,
            required: true
        },
        clerkUserId: {
            type: String,
            ref: "CUser",
            required: true
        },
        days: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CDayAvailability"
        }],
        timeGap: {
            type: Number,
            required: true
        },

    }, { timestamps: true });

const CAvailability = new mongoose.model("CAvailability", CAvailabilitySchema);

module.exports = {
    CAvailability,
};
