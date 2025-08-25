const mongoose = require("mongoose");

const CUserSchema = new mongoose.Schema(
    {
        clerkUserId: {
            type: String,
            unique: true,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        username: {
            type: String,
            unique: true,
            sparse: true
        },
        name: {
            type: String,
            default: ""
        },
        imageUrl: {
            type: String,
            default: ""
        },
        events: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CEvent"
        }],
        bookings: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CBooking"
        }],
        availability: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CAvailability"
        },

    }, { timestamps: true });

const CUser = new mongoose.model("CUser", CUserSchema);

module.exports = {
    CUser,
};
