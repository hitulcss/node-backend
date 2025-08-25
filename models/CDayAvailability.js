const mongoose = require("mongoose");

const CDayAvailabilitySchema = new mongoose.Schema(
    {
        availabilityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CAvailability",
            required: true
        },
        day: {
            type: String,
            enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
            required: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
    }, { timestamps: true });

const CDayAvailability = new mongoose.model("CDayAvailability", CDayAvailabilitySchema);

module.exports = {
    CDayAvailability,
};
