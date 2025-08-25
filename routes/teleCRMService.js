const express = require("express");
const { default: mongoose } = require("mongoose");
const { populate } = require("dotenv");
const moment = require('moment-timezone');
const teleCRMServiceRoute = express.Router();

// const { cldrBookingUsrData } = require("../HelperFunctions/crmTracking")
const { sendEmail } = require("../ContactUser/NodeMailer");

const { sendWAOTP,
    demoWelcomeImmediately,
    demoReminder1HrBefore,
    demoReminder15MinBefore,
    demoReminder5MinBefore,
    demoFollowUpAfter2Min,
    demoFollowUpAfter24Hrs } = require("../HelperFunctions/whatsAppTemplates")

// send confirmation template

// DemoBooked leads directly goes into Demo booked insteads of Fresh lead

// LEAD stage change: Fresh leads to demo booked 
teleCRMServiceRoute.post("/leads_stage_demo_booked", async (req, res) => {
    try {
        const { name, email, phone, startDate, startTime, endTime, eventTitle, meetLink } = req.body
        const dataObj = {
            name,
            email,
            phone,
            date: startDate,//"01 April 2025",
            startTime: startTime,//"5:00 PM",
            endTime: endTime,//"5:45 PM",
            meetLink: meetLink,
            eventName: eventTitle ?? "SD Campus for Sainik/JNV Demo Class",

        }
        // REMOVE +91 from mobile no before sending WA Template
        // confirmation email
        // await sendEmail("DemoSessionConfirmedImmediately", email, name, dataObj)
        //WA template
        //await demoWelcomeImmediately(dataObj)
        return res.json({
            status: true,
            data: null,
            msg: "Success.",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        });
    }
});

teleCRMServiceRoute.post("/demo_reminder_1hr", async (req, res) => {
    try {
        const { name, email, phone, startDate, startTime, endTime, eventTitle, meetLink } = req.body
        const dataObj = {
            name,
            email,
            phone,
            date: startDate,//"01 April 2025",
            startTime: startTime,//"5:00 PM",
            endTime: endTime,//"5:45 PM",
            meetLink: meetLink,
            eventName: eventTitle ?? "SD Campus for Sainik/JNV Demo Class",

        }
        // confirmation email
        await sendEmail("DemoReminder1HrsBefore", email, name, dataObj)
        //WA template
        await demoReminder1HrBefore(dataObj)
        return res.json({
            status: true,
            data: null,
            msg: "Success.",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        });
    }
});

teleCRMServiceRoute.post("/demo_reminder_15min", async (req, res) => {
    try {
        const { name, email, startDate, startTime, endTime, eventTitle, meetLink } = req.body
        const dataObj = {
            name,
            email,
            phone,
            date: startDate,//"01 April 2025",
            startTime: startTime,//"5:00 PM",
            endTime: endTime,//"5:45 PM",
            meetLink: meetLink,
            eventName: eventTitle ?? "SD Campus for Sainik/JNV Demo Class",

        }
        // confirmation email
        await sendEmail("DemoReminder15MinsBefore", email, name, dataObj)
        //WA Template
        await demoReminder15MinBefore(dataObj)
        return res.json({
            status: true,
            data: null,
            msg: "Success.",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        });
    }
});

teleCRMServiceRoute.post("/demo_reminder_5min", async (req, res) => {
    try {
        const { name, email, phone, startDate, startTime, endTime, eventTitle, meetLink } = req.body
        const dataObj = {
            name,
            email,
            phone,
            date: startDate,//"01 April 2025",
            startTime: startTime,//"5:00 PM",
            endTime: endTime,//"5:45 PM",
            meetLink: meetLink,
            eventName: eventTitle ?? "SD Campus for Sainik/JNV Demo Class",

        }
        // confirmation email
        await sendEmail("DemoReminder5MinsBefore", email, name, dataObj)
        // WA Template
        await demoReminder5MinBefore(dataObj)
        return res.json({
            status: true,
            data: null,
            msg: "Success.",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        });
    }
});

teleCRMServiceRoute.post("/demo_followup_2min", async (req, res) => {
    try {
        const { name, email, phone } = req.body
        const dataObj = {
            name,
            email,
            phone

        }
        // confirmation email
        await sendEmail("DemoFollowUpAfter2Mins", email, name, dataObj)
        // WA Template
        await demoFollowUpAfter2Min(dataObj)
        return res.json({
            status: true,
            data: null,
            msg: "Success.",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        });
    }
});

teleCRMServiceRoute.post("/demo_followup_24hrs", async (req, res) => {
    try {
        const { name, email, phone } = req.body
        const dataObj = {
            name,
            email,
            phone

        }
        // confirmation email
        await sendEmail("DemoFollowUpAfter24Hrs", email, name, dataObj)
        // WA Template
        await demoFollowUpAfter24Hrs(dataObj)
        return res.json({
            status: true,
            data: null,
            msg: "Success.",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        });
    }
});

module.exports = teleCRMServiceRoute;