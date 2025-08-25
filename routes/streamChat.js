const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { isAdmin, ValidateToken } = require("../middleware/authenticateToken");
const { StreamChatTable } = require("../models/streamChat");
const { LectureTable } = require("../models/addLecture");
const { UserTable } = require("../models/userModel");

const StreamChatRouter = express.Router();

StreamChatRouter.post("/postChat/:lectureId", ValidateToken, async (req, res) => {
    const { message } = req.body
    const { lectureId } = req.params
    if (!message || !lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: "Required message & lecture Id"
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const studentDetails = await UserTable.find({
            userId: decoded.studentId
        });
        // console.log(studentDetails)
        if (!studentDetails) {
            return res.json({
                status: false,
                data: null,
                msg: "User not found",
            });
        }
        const isValidLectureId = await LectureTable.findById(lectureId)
        if (!isValidLectureId) {
            return res.json({
                status: false,
                data: null,
                msg: "Invalid lectureId"
            })
        }
        await StreamChatTable.create({
            userId: studentDetails[0]._id,
            lectureId,
            message,
        })
        res.json({
            status: true,
            data: message,
            msg: "Message sent",
        });
    } catch (err) {
        res.json({
            status: false,
            data: null,
            msg: err.message,
        });
    }
});
StreamChatRouter.get("/getChat/:lectureId", ValidateToken, async (req, res) => {
    const { lectureId } = req.params;
    if (!lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: "Required lecture Id"
        });
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const studentDetails = await UserTable.findOne({ userId: decoded.studentId });
        if (!studentDetails) {
            return res.json({
                status: false,
                data: null,
                msg: "User not found",
            });
        }
        const chatObj = await StreamChatTable.find({ lectureId }).populate({
            path: "userId",
            select: "FullName profilePhoto"
        });
        if (!chatObj) {
            return res.json({
                status: false,
                data: [],
                msg: "Chat not found for this lecture",
            });
        }
        res.json({
            status: true,
            data: [{
                lectureId,
                chatInfo: chatObj.map((item) => {
                    return {
                        user: {
                            name: item.userId.FullName ?? "",
                            icon: item.userId.profilePhoto ?? ""
                        },
                        chat: {
                            id: item._id,
                            title: item.message,
                            timestamp: item.createdAt
                        }
                    };
                }),
            }],
            msg: "Chat Info"
        });
    } catch (err) {
        res.json({
            status: false,
            data: null,
            msg: err.message,
        });
    }
});
module.exports = StreamChatRouter;