const express = require('express');
const { ValidateToken, isAdmin, isTeacher } = require("../middleware/authenticateToken");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const moment = require("moment");
// const lodash = require('lodash');
const { fetchData } = require('../HelperFunctions/fileRead');
const { findUserByUserId } = require('../HelperFunctions/userFunctions');
const { lectureDoubtTable } = require('../models/lectureDoubt');
const { lectureReportTable } = require("../models/lectureReport");
const { LectureTable } = require('../models/addLecture');
const { pollTable } = require("../models/poll");
const { findAdminTeacherUsingUserId } = require('../HelperFunctions/adminTeacherFunctions');
const { lectureRatingTable } = require('../models/lectureRating');
const { pollResponseTable } = require('../models/pollResponse');
const { lectureCommentTable } = require('../models/lectureComment');
const { MybatchTable } = require('../models/MyBatches');
const { lectureRoomTable } = require('../models/lectureRoom');
const { lectureRecordedCommentsTable } = require('../models/lectureRecordedComments');
const { reportLectureCommentTable } = require('../models/reportLectureComment');
const liveLecture = express.Router();
const { badWordCheck } = require('../HelperFunctions/BadWordCheck');
// new Middlw ware which 
async function isHost(req, res, next) {
    try {
        const token = req?.headers?.authorization?.split(" ")[1];
        req.token = token;
        let decode;
        if (req?.query?.role == 'teacher' || req?.query?.role == 'moderator') {
            decode = jwt.verify(req.token, process.env.TEACHER_SECRET_KEY);
        } else {
            decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        }
        const isExist = await findAdminTeacherUsingUserId(decode?.studentId);
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Not An Host`
            })
        }
        req.adminId = isExist?._id;
        req.role = isExist?.Role;
        next();

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
}

function compareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    // implement custom sort if necessary
    arr1.sort();
    arr2.sort();
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }

    return true;
}

liveLecture.post("/postDoubt", ValidateToken, async (req, res) => {
    const { title, lectureId, time } = req.body;
    if (!title || !lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Title lectureId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const isLecture = await LectureTable.findOne({ _id: lectureId });
        if (!isLecture) {
            return res.json({
                status: false,
                data: null,
                msg: 'lecture not found'
            })
        }
        const findRoom = await lectureRoomTable.findOne({ lecture: isLecture?._id, students: { $in: user?._id } }).select('_id')
        const newDoubt = new lectureDoubtTable({
            user: user?._id,
            title,
            roomId: findRoom?._id,
            lectureId: isLecture?._id,
            time: time
            // batchId : isLecture?.batch
        });
        const saveDoubt = await newDoubt.save();
        return res.json({
            status: true,
            data: saveDoubt,
            msg: `Your Doubt Submitted`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getAllDoubts", isHost, async (req, res) => {
    const { lectureIds } = req.body;
    if (lectureIds.length < 1) {
        return res.json({
            status: false,
            data: null,
            msg: 'lectureId Required'
        })
    }
    try {
        // const decode = jwt.verify(req.token  , process.env.TEACHER_SECRET_KEY);
        // const admin = await findAdminTeacherUsingUserId(decode.studentId);
        // if( !admin){
        //     return res.json({
        //         status : false ,
        //         data : null ,
        //         msg : "not an teachers"
        //     })
        // }
        let allDoubts = [];
        if (req.role == 'moderator') {
            // if moderator then send only one lectureIds
            // first get the room 
            const mentorRoom = await lectureRoomTable.findOne({ lecture: lectureIds[0], mentor: { $in: req?.adminId } }).select("_id");
            allDoubts = await lectureDoubtTable.find({ roomId: mentorRoom?._id }).populate("lectureId", "lecture_title").populate({
                path: 'roomId',
                select: "_id title ",
                populate: {
                    path: 'batch',
                    select: "batch_name"
                }
            }).populate('resolver', "_id FullName").populate('user', "FullName");

        } else {
            allDoubts = await lectureDoubtTable.find({ lectureId: { $in: lectureIds } }).populate("lectureId", "lecture_title").populate({
                path: 'roomId',
                select: "_id title ",
                populate: {
                    path: 'batch',
                    select: "batch_name"
                }
            }).populate('resolver', "_id FullName").populate('user', "FullName");

        }
        // const allDoubts = await lectureDoubtTable.find({lectureId : { $in : lectureIds}}).populate("batchId", "batch_name").populate('user' , "FullName");
        return res.json({
            status: true,
            data: allDoubts.map((item) => {
                return {
                    id: item?._id ?? "",
                    user: item.user?.FullName ?? "",
                    lectureName: item?.lectureId?.lecture_title ?? '',
                    doubt: item.title ?? "",
                    time: item?.time ?? "",
                    answer: item?.answer ?? "",
                    resolver: { id: item?.resolver?._id ?? "", name: item?.resolver?.FullName ?? "" },
                    resolveTime: item?.resolveTime ?? "",
                    isResolved: item?.isResolved ?? false,
                    roomDetails: { id: item?.roomId?._id ?? "", roomName: item?.roomId?.title ?? "", batchName: item?.roomId?.batch?.batch_name ?? "" },

                }
            }),
            msg: "Doubts fetched"
        })



    } catch (error) {
        res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.put("/solveDoubt/:id", isHost, async (req, res) => {
    const { id } = req.params;
    const { answer, resolveTime, mentorId, isResolved } = req.body;
    if (!answer || !resolveTime) {
        return res.json({
            status: false,
            data: null,
            msg: 'answer resolveTime Required'
        })
    }
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: 'doubtId Required'
        })
    }
    try {
        // const decode = jwt.verify(req.token  , process.env.TEACHER_SECRET_KEY);
        // const admin = await findAdminTeacherUsingUserId(decode.studentId);
        // if( !admin){
        //     return res.json({
        //         status : false ,
        //         data : null ,
        //         msg : "not an teachers"
        //     })
        // }
        const isDoubt = await lectureDoubtTable.findOne({ _id: id });
        if (!isDoubt) {
            return res.json({
                status: false,
                data: null,
                msg: 'doubt not found'
            })
        }
        const doubt = await lectureDoubtTable.findByIdAndUpdate(id, {
            resolver: mentorId,
            answer: answer,
            resolveTime: resolveTime,
            isResolved: true
        }, { new: true, lean: true })

        // const allDoubts = await lectureDoubtTable.find({lectureId : { $in : lectureIds}}).populate("batchId", "batch_name").populate('user' , "FullName");
        return res.json({
            status: true,
            data: null,
            msg: `${doubt?.title} is solved`
        })



    } catch (error) {
        res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getDoubts", ValidateToken, async (req, res) => {
    const { lectureId } = req.query;
    if (!lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Lecture Id`
        })
    }
    try {
        const decode = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decode.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: " Not an user"
            })
        }
        const userRoom = await lectureRoomTable.findOne({ lecture: lectureId, students: { $in: user?._id } }).select('_id');
        const userDoubts = await lectureDoubtTable.find({ roomId: userRoom?._id, lectureId: lectureId }).populate('resolver', '_id FullName Role')
        return res.json({
            status: true,
            data: userDoubts?.map((item) => {
                return {
                    id: item?._id ?? "",
                    title: item?.title ?? "",
                    isResolved: item?.isResolved ?? false,
                    time: item?.time ?? "",
                    resolver: { name: item?.resolver?.FullName ?? "", id: item?.resolver?._id ?? "" },
                    resolveTime: item?.resolveTime ?? "",
                    answer: item?.answer ?? "",
                }
            }),
            msg: `User Doubts`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.post("/postReport", ValidateToken, async (req, res) => {
    const { title, lectureId } = req.body;
    if (!title || !lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Title lectureId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const isLecture = await LectureTable.findOne({ _id: lectureId });
        if (!isLecture) {
            return res.json({
                status: false,
                data: null,
                msg: 'lecture not found'
            })
        }
        const findRoom = await lectureRoomTable.findOne({ lecture: isLecture?._id, students: { $in: user?._id } }).select('_id')
        const newReport = new lectureReportTable({
            user: user?._id,
            title,
            roomId: findRoom?._id,
            lectureId: isLecture?._id,
            // batchId : isLecture?.batch,
        });
        const saveReport = await newReport.save();
        return res.json({
            status: true,
            data: saveReport,
            msg: `Your Feedback Submitted`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.post("/postRating", ValidateToken, async (req, res) => {
    const { title, lectureId, rating } = req.body;
    if (!title || !lectureId || !["1", "2", "3", "4", "5"].includes(rating)) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Title lectureId rating`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const isLecture = await LectureTable.findOne({ _id: lectureId });
        if (!isLecture) {
            return res.json({
                status: false,
                data: null,
                msg: 'lecture not found'
            })
        }
        const findRoom = await lectureRoomTable.findOne({ lecture: isLecture?._id, students: { $in: user?._id } }).select('_id')

        const newRating = new lectureRatingTable({
            user: user?._id,
            title,
            rating,
            roomId: findRoom?._id,
            lectureId: isLecture?._id,
            // batchId : isLecture?.batch,
        });
        const saveRating = await newRating.save();
        return res.json({
            status: true,
            data: saveRating,
            msg: `Your Review Submitted`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.post("/createPoll", isHost, async (req, res) => {
    const { lectureIds, options, duration, correctOptions, pollType, isActive } = req.body;
    if (lectureIds.length < 1) {
        return res.json({
            status: false,
            data: null,
            msg: 'lectureId Required'
        })
    }
    try {
        // const decode = jwt.verify(req.token  , process.env.TEACHER_SECRET_KEY);
        // const admin = await findAdminTeacherUsingUserId(decode.studentId);
        // if( !admin){
        //     return res.json({
        //         status : false ,
        //         data : null ,
        //         msg : "not an teacher"
        //     })
        // }
        let pollArray = []
        for (let lectureId of lectureIds) {

            // find the room of lectureId 
            // const rooms = await lectureRoomTable.find({lecture : lectureId }).select("_id");
            // for( let room of rooms){
            let newPoll = {
                // admin : admin?._id,
                admin: req.adminId,
                // roomId : room?._id ,
                lectureId: lectureId,
                options: options,
                pollType: pollType,
                duration: duration,
                correctOptions: correctOptions,
                isActive: isActive
            }
            pollArray.push(newPoll);
            // }

        }
        const response = await pollTable.insertMany(pollArray);
        return res.json({
            status: true,
            data: response?.map((item) => item?._id),
            msg: 'poll created for multiple lecture'
        })

    } catch (error) {
        res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// getPoll
liveLecture.get("/getPoll", ValidateToken, async (req, res) => {
    const { lectureId } = req.query;
    if (!lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required lectureId `
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const isPoll = await pollTable.find({ lectureId: lectureId }).sort({ createdAt: -1 }).limit(1).populate('lectureId', 'batch');
        if (!isPoll[0] || isPoll[0]?.isActive == false) { // also check if createdAt & current time difference greater than poll duration then do not show 
            return res.json({
                status: false,
                data: null,
                msg: `Poll not exists`
            })
        }
        // console.log(isPoll[0]?.lectureId?.batch)
        const isMyBatch = await MybatchTable.findOne({ user: user?._id, batch_id: isPoll[0]?.lectureId?.batch });
        if (!isMyBatch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not Authorized to Access The Poll'
            })
        }
        return res.json({
            status: true,
            data: {
                options: isPoll[0]?.options ?? [""],
                duration: isPoll[0]?.duration ?? '',
                pollId: isPoll[0]?._id ?? "",
            },
            msg: 'Poll fetched'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// poll response
liveLecture.post("/postResponse", ValidateToken, async (req, res) => {
    const { lectureId, options, duration, pollId } = req.body;
    if (options.length < 1 || !lectureId || !duration || !pollId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Title lectureId duration pollId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const isPoll = await pollTable.findOne({ _id: pollId, lectureId: lectureId }).populate('lectureId', '_id batch')
        if (!isPoll || isPoll?.isActive == false) {
            return res.json({
                status: false,
                data: null,
                msg: `poll not exists`
            })
        }
        const isMyBatch = await MybatchTable.findOne({ user: user?._id, batch_id: isPoll?.lectureId?.batch });
        if (!isMyBatch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not Authorized to Access The Poll'
            })
        }
        if ((isPoll.pollType == 'single' || isPoll?.pollType == 'vote') && options.length > 1) {
            return res.json({
                status: false,
                data: null,
                msg: `You can submit only one option.`
            })
        }
        const isSubmit = await pollResponseTable.findOne({ pollId: isPoll?._id, user: user?._id });
        if (isSubmit) {
            return res.json({
                status: false,
                data: null,
                msg: 'Response Already submitted'
            })
        }
        const userRoom = await lectureRoomTable.findOne({ lecture: lectureId, students: { $in: user?._id } }).select('_id');
        // let result = lodash.isEqual(options , isPoll?.correctOptions) ? "success" : "failed";
        let result = compareArrays(options, isPoll?.correctOptions) ? "success" : 'failed'
        // console.log(result);
        const newRes = new pollResponseTable({
            pollId: isPoll?._id,
            roomId: userRoom?._id,
            lectureId: isPoll?.lectureId?._id,
            user: user?._id,
            duration: duration,
            options: options,
            result,
        })
        const saveRes = await newRes.save();
        if (saveRes) {
            return res.json({
                status: true,
                data: null,
                msg: `Your response submitted`
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// comments api for recorded api
liveLecture.post("/postComment", ValidateToken, async (req, res) => {
    const { title, lectureId } = req.body;
    if (!title || !lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Title lectureId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        let url = `https://d1mbj426mo5twu.cloudfront.net/assets/feed/output.txt`
        const wordArray = await fetchData(url);
        if (wordArray.includes(title.toLowerCase())) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isLecture = await LectureTable.findOne({ _id: lectureId });
        if (!isLecture || isLecture?.LiveOrRecorded == 'Live') {
            return res.json({
                status: false,
                data: null,
                msg: 'lecture not found Or  live'
            })
        }
        if (isLecture?.isCommentAllowed == false) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not allowed'
            })
        }
        const findRoom = await lectureRoomTable.findOne({ lecture: isLecture?._id, students: { $in: user?._id } }).select('_id')
        const newComment = new lectureCommentTable({
            user: user?._id,
            title,
            roomId: findRoom?._id,
            lectureId: isLecture?._id,
            // batchId : isLecture?.batch,
        });
        const saveComment = await newComment.save();
        return res.json({
            status: true,
            data: saveComment,
            msg: `Your Comment Submitted`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// get All comments
liveLecture.get("/getComments", ValidateToken, async (req, res) => {
    const { lectureId } = req.query;
    if (!lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required lectureId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const comments = await lectureCommentTable.find({ lectureId: lectureId }).populate("user", "FullName profilePhoto");
        return res.json({
            status: true,
            data: comments.map((item) => {
                return {
                    id: item?._id ?? "",
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" },
                    title: item?.title ?? "",
                    createdAt: moment(item.createdAt).fromNow() ?? "",
                }
            }),
            msg: `All Comments fetched`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.delete("/deleteComment", ValidateToken, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        if (user?.email.includes('@sdempire.co.in')) {
            await lectureCommentTable.findByIdAndDelete(commentId);
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })
        } else {
            const comment = await lectureCommentTable.findOneAndDelete({ user: user?._id, _id: commentId });
            if (comment) {
                return res.json({
                    status: true,
                    data: null,
                    msg: "Comment deleted"
                })
            } else {
                return res.json({
                    status: false,
                    data: null,
                    msg: "Not authorized to delete"
                })
            }
        }

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})



// get polls with response,

// get poll response by pollId , lectureId

// for teacher 
// liveLecture.get("/getPollLeaderBoard" ,isTeacher,  async(req,res) => {
liveLecture.get("/getPollLeaderBoard", isHost, async (req, res) => {
    // const { pollId , lectureId } = req.query ;
    const { pollIds } = req.body;

    // if( !pollId || !lectureId){
    //     return res.json({
    //         status : false ,
    //         data : null ,
    //         msg : `Required poll Id & lectureId`
    //     })
    // }
    try {
        // const decode = jwt.verify(req.token , process.env.TEACHER_SECRET_KEY);
        // const teacher = await findAdminTeacherUsingUserId(decode?.studentId);
        // if(!teacher){
        //     return res.json({
        //         status : false ,
        //         data : null ,
        //         msg : 'Not an Teacher'
        //     })
        // }
        const isPoll = await pollTable.findOne({ _id: pollIds[0] });
        if (!isPoll) {
            return res.json({
                status: false,
                data: null,
                msg: 'Poll not found'
            })
        }
        // for( let i =  0 ; i < )
        const pollResponse = await pollResponseTable.find({ pollId: pollIds }).populate('user', 'FullName').sort({ duration: 1 }).collation({ locale: "en_US", numericOrdering: true });
        // console.log(allPollResponse.length);
        // const pollResponse = await pollResponseTable.find({pollId : pollId , lectureId : lectureId }).populate('user' , 'FullName').sort({ duration : 1 }).collation({ locale: "en_US", numericOrdering: true });
        const optionsPercentage = {};
        for (let i = 0; i < isPoll?.options?.length; i++) {
            let key = `${isPoll?.options[i]}`;
            optionsPercentage[`${key}`] = 0
        }
        // console.log(optionsPercentage)
        let leaderBoard = [];
        for (let i = 0; i < pollResponse.length; i++) {
            for (let j = 0; j < pollResponse[i].options?.length; j++) {
                let key = `${pollResponse[i]?.options[j]}`
                //    console.log(key);
                optionsPercentage[`${key}`] = optionsPercentage[`${key}`] + 1;
            }
            // console.log(optionsPercentage)
            let obj = {
                rank: i + 1,
                name: pollResponse[i]?.user?.FullName ?? "",
                duration: pollResponse[i]?.duration ?? ""
            };
            if (pollResponse[i]?.result == 'success') {
                leaderBoard.push(obj)
            }
        }
        for (let key in optionsPercentage) {
            //    optionsPercentage[key] =  ((optionsPercentage[key] / pollResponse?.length ) * 100).toFixed(0)
            optionsPercentage[key] = ((optionsPercentage[key] / pollResponse?.length)).toFixed(0)
        }

        return res.json({
            status: true,
            data: { optionsPercentage, leaderBoard },
            msg: 'leader fetched'
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: `${error.message}`
        })
    }
})

liveLecture.get("/getPollLeaderBoardForMentor", isTeacher, async (req, res) => {
    const { pollId, lectureId } = req.query;
    if (!pollId || !lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Poll Id`
        })
    }
    try {
        const decode = jwt.verify(req.token, process.env.TEACHER_SECRET_KEY);
        const teacher = await findAdminTeacherUsingUserId(decode.studentId);
        if (!teacher) {
            return res.json({
                status: false,
                data: null,
                msg: "not an teacher"
            })
        }
        // console.log(teacher?._id);
        //  find mentor room in the lecture ;
        const mentorRoom = await lectureRoomTable.findOne({ lecture: lectureId, mentor: { $in: teacher?._id } }).select('_id');
        // console.log(mentorRoom?._id)
        const isPoll = await pollTable.findOne({ _id: pollId });
        if (!isPoll) {
            return res.json({
                status: false,
                data: null,
                msg: 'Poll not found'
            })
        }
        // for( let i =  0 ; i < )
        const pollResponse = await pollResponseTable.find({ pollId: pollId, roomId: mentorRoom?._id, result: 'success' }).populate('user', 'FullName').sort({ duration: 1 }).collation({ locale: "en_US", numericOrdering: true });
        // console.log(allPollResponse.length);
        // const pollResponse = await pollResponseTable.find({pollId : pollId , lectureId : lectureId }).populate('user' , 'FullName').sort({ duration : 1 }).collation({ locale: "en_US", numericOrdering: true });
        const optionsPercentage = {};
        for (let i = 0; i < isPoll?.options?.length; i++) {
            let key = `${isPoll?.options[i]}`;
            optionsPercentage[`${key}`] = 0
        }
        // console.log(optionsPercentage)
        let leaderBoard = [];
        for (let i = 0; i < pollResponse.length; i++) {
            for (let j = 0; j < pollResponse[i].options?.length; j++) {
                let key = `${pollResponse[i]?.options[j]}`
                //    console.log(key);
                optionsPercentage[`${key}`] = optionsPercentage[`${key}`] + 1;
            }
            // console.log(optionsPercentage)
            let obj = {
                rank: i + 1,
                name: pollResponse[i]?.user?.FullName ?? "",
                duration: pollResponse[i]?.duration ?? ""
            };
            if (pollResponse[i]?.result == 'success') {
                leaderBoard.push(obj)
            }
        }
        for (let key in optionsPercentage) {
            //    optionsPercentage[key] =  ((optionsPercentage[key] / pollResponse?.length ) * 100).toFixed(0)
            optionsPercentage[key] = ((optionsPercentage[key] / pollResponse?.length)).toFixed(0)
        }

        return res.json({
            status: true,
            data: { optionsPercentage, leaderBoard },
            msg: 'leader fetched'
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// for user
liveLecture.get("/getPollLeaderBoardForUser", ValidateToken, async (req, res) => {
    const { pollId, lectureId } = req.query;
    try {
        const decode = jwt.verify(req.token, process.env.SECRET_KEY)
        const user = await findUserByUserId(decode?.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an User`
            })
        }
        const isPoll = await pollTable.findOne({ _id: pollId });
        if (!isPoll) {
            return res.json({
                status: false,
                data: null,
                msg: 'Poll not found'
            })
        }

        // get User Room name
        const userRoom = await lectureRoomTable.findOne({ lecture: lectureId, students: { $in: user?._id } }).select("_id");

        const pollResponse = await pollResponseTable.find({ pollId: pollId, lectureId: lectureId, roomId: userRoom?._id, result: 'success' }).populate('user', 'FullName').sort({ duration: 1 }).collation({ locale: "en_US", numericOrdering: true });
        const optionsPercentage = {};
        for (let i = 0; i < isPoll?.options?.length; i++) {
            let key = `${isPoll?.options[i]}`;
            optionsPercentage[`${key}`] = 0
        }
        // console.log(optionsPercentage)
        let leaderBoard = [];
        for (let i = 0; i < pollResponse.length; i++) {
            for (let j = 0; j < pollResponse[i].options?.length; j++) {
                let key = `${pollResponse[i]?.options[j]}`
                //    console.log(key);
                optionsPercentage[`${key}`] = optionsPercentage[`${key}`] + 1;
            }
            // console.log(optionsPercentage)
            let obj = {
                rank: i + 1,
                name: pollResponse[i]?.user?.FullName ?? "",
                duration: pollResponse[i]?.duration ?? ""
            };
            if (pollResponse[i]?.result == 'success') {
                leaderBoard.push(obj)
            }
        }
        for (let key in optionsPercentage) {
            //    optionsPercentage[key] =  ((optionsPercentage[key] / pollResponse?.length ) * 100).toFixed(0)
            optionsPercentage[key] = ((optionsPercentage[key] / pollResponse?.length)).toFixed(2) ?? "0.00"

        }

        return res.json({
            status: true,
            data: { optionsPercentage, leaderBoard },
            msg: 'leader fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// testing function
liveLecture.get("/getUserRoom", async (req, res) => {
    const { batchId, studentId } = req.query;
    try {
        const rooms = await lectureRoomTable.find({ batch: batchId, students: { $in: studentId } }).sort({ createdAt: -1 })
        return res.json({
            status: true,
            data: rooms?.map((item) => { return { name: item?.title } }),
            msg: 'User room'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getModeratorsLecture", isHost, async (req, res) => {
    const { role } = req.query;
    if (role != 'moderator') {
        return res.json({
            status: false,
            data: null,
            msg: 'Required Role'
        })
    }

    try {
        const lectures = await LectureTable.find({ isActive: true }).sort({ createdAt: -1 }).populate({
            path: 'teacher',
            select: "FullName profilePhoto demoVideo category qualification",
            populate: {
                path: 'subject',
                select: 'title'
            }
        });
        // let responseArray = [] ;
        let currentDate = moment(new Date()).format('DD-MM-YYYY');
        let todayLecture = lectures.filter((item) => {
            let startDate = moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY');
            let endDate = moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY');
            return moment(currentDate, 'DD-MM-YYYY').isSame(moment(startDate, 'DD-MM-YYYY'));
        });
        let response = [];
        await Promise.all(todayLecture?.map(async (item) => {
            const rooms = await lectureRoomTable.find({ mentor: { $in: req?.adminId }, lecture: item?._id }).populate('batch', 'batch_name').populate('mentor', '_id FullName');

            let obj = {
                id: item?._id ?? "",
                // _id: item?._id ?? "",
                commonName: item?.commonName ?? "",
                lectureTitle: item?.lecture_title ?? "",
                teacher: { name: item?.teacher[0]?.FullName ?? "", profilePhoto: item?.teacher[0]?.profilePhoto ?? "", qualification: item?.teacher[0]?.qualification ?? "" } ?? { name: "", profilePhoto: "", qualification: "" },
                starting_date: item?.starting_date ?? "",
                duration: moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
                language: item?.language ?? "",
                ending_date: item?.ending_date ?? "",
                material: item?.material ?? {},
                dpp: item?.dpp ?? {},
                description: item?.description ?? "",
                rooms: rooms?.map((item2) => {
                    return {
                        id: item2?._id ?? "",
                        roomName: item2?.title ?? "",
                        mentor: item2?.mentor?.map((item3) => {
                            return {
                                mentorId: item3?._id ?? "",
                                mentorName: item3?.FullName ?? "",
                            }
                        }),
                        batchName: item2?.batch?.batch_name ?? "",
                        students: item2?.students ?? [],
                    }
                })
            }
            if (rooms?.length > 0) {
                response.push(obj);
            }
        }))



        return res.json({
            status: true,
            data: response,
            msg: 'Moderate today lectures'
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


liveLecture.post("/postCommentForRecorded", ValidateToken, async (req, res) => {
    const { commentText, lectureId } = req.body;
    if (!commentText || !lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentText lectureId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        if (!user?.email?.includes('@sdempire.co.in')) {
            const lectureComments = await lectureRecordedCommentsTable.find({ user: user?._id, lectureId: lectureId })
            if (lectureComments?.length >= 5) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Max comments limit reached'
                })
            }
        }

        if (await badWordCheck(msg)) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isLecture = await LectureTable.findOne({ _id: lectureId });
        // console.log(isLecture)
        if (!isLecture || isLecture?.LiveOrRecorded != 'Recorded') {
            return res.json({
                status: false,
                data: null,
                msg: 'lecture not found Or  live'
            })
        }
        if (isLecture?.isCommentAllowed == false) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not allowed'
            })
        }

        const newComment = new lectureRecordedCommentsTable({
            user: user?._id,
            commentText,
            lectureId: isLecture?._id,
            isPin: false
        });
        const saveComment = await newComment.save();
        return res.json({
            status: true,
            data: saveComment,
            msg: `Your Comment Submitted`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.post("/editCommentForRecorded", ValidateToken, async (req, res) => {
    const { commentText, commentId } = req.body;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        let url = `https://d1mbj426mo5twu.cloudfront.net/assets/feed/output.txt`
        const wordArray = await fetchData(url);
        if (wordArray.includes(commentText.toLowerCase())) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }


        const newComment = await lectureRecordedCommentsTable.findOneAndUpdate({ _id: commentId, user: user?._id }, {
            commentText,
        }, { new: true, lean: true });
        if (!newComment) {
            return res.json({
                status: false,
                data: null,
                msg: `Comments not exist Or It is not your comment `
            })
        }
        // const saveComment = await newComment.save();
        return res.json({
            status: true,
            data: newComment,
            msg: `Your Comment Updated into ${newComment?.commentText}`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.delete("/deleteCommentForRecorded", ValidateToken, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        // delete all replies comments also
        if (user?.email.includes('@sdempire.co.in')) {
            await lectureRecordedCommentsTable.findByIdAndDelete(commentId);
            await lectureRecordedCommentsTable.deleteMany({ replyTo: commentId });
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })
        } else {
            const comment = await lectureRecordedCommentsTable.findOneAndDelete({ user: user?._id, _id: commentId });
            await lectureRecordedCommentsTable.deleteMany({ replyTo: commentId });
            if (comment) {
                return res.json({
                    status: true,
                    data: null,
                    msg: "Comment deleted"
                })
            } else {
                return res.json({
                    status: false,
                    data: null,
                    msg: "Not authorized to delete"
                })
            }
        }

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.put("/markCommentToPin", ValidateToken, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        const isComment = await lectureRecordedCommentsTable.findOne({ _id: commentId });
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        if (user?.email.includes('@sdempire.co.in')) {
            let isPin = isComment?.isPin == true ? false : true;
            const newComment = await lectureRecordedCommentsTable.findByIdAndUpdate(commentId, { isPin: isPin }, { new: true, lean: true });
            // console.log(newComment?.isPin)
            return res.json({
                status: true,
                data: null,
                msg: `Comment ${newComment.isPin ? 'pinned' : 'unpinned'} successfully`
            })
        } else {
            return res.json({
                status: false,
                data: null,
                msg: "Not authorized to pin"
            })
        }

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.put("/markCommentToReport", ValidateToken, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        let reports = await reportLectureCommentTable.findOne({ commentId: commentId });
        if (!reports?._id) {
            let report = new reportLectureCommentTable({
                user: [user?._id],
                commentId: commentId,
            })
            reports = await report.save();
            return res.json({
                status: true,
                data: null,
                msg: "Comment reported successfully"
            })

        } else {
            let isReport = reports?.user?.find((item) => item?.toString() === user?._id?.toString());
            if (isReport) {
                return res.json({
                    status: true,
                    data: null,
                    msg: 'Already reported by you'
                })
            }
            await reportLectureCommentTable.findOneAndUpdate({ commentId: commentId }, { $addToSet: { user: { $each: [user?._id] } } })

            // const comment =  await lectureRecordedCommentsTable.findByIdAndUpdate(commentId , { isReport : true});
            return res.json({
                status: true,
                data: null,
                msg: "Comment reported successfully"
            })
        }
        // let users =  reports.user ;


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.post("/replyToCommentForRecorded", ValidateToken, async (req, res) => {
    const { commentText, lectureId, replyTo } = req.body;
    if (!commentText || !replyTo) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentText replyTo`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        if (!user?.email?.includes('@sdempire.co.in')) {
            const lectureComments = await lectureRecordedCommentsTable.find({ user: user?._id, lectureId: lectureId, replyTo: { $ne: null } })
            if (lectureComments?.length >= 5) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Max comments limit reached'
                })
            }
        }

        let url = `https://d1mbj426mo5twu.cloudfront.net/assets/feed/output.txt`
        const wordArray = await fetchData(url);
        if (wordArray.includes(commentText.toLowerCase())) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isComment = await lectureRecordedCommentsTable.findOne({ _id: replyTo });
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not found'
            })
        }

        const newComment = new lectureRecordedCommentsTable({
            user: user?._id,
            commentText,
            lectureId: isComment?.lectureId,
            replyTo: isComment?._id,
            isPin: false
        });
        const saveComment = await newComment.save();
        return res.json({
            status: true,
            data: saveComment,
            msg: `Your Comment Submitted`

        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getRecordedComments", ValidateToken, async (req, res) => {
    const { lectureId } = req.query;
    try {
        const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
        const user = await findUserByUserId(decoded.studentId);
        if (!user) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an user'
            })
        }
        // get all comment which replyTo is null 

        const comments1 = await lectureRecordedCommentsTable.aggregate([
            {
                $match: {
                    lectureId: mongoose.Types.ObjectId(lectureId),
                    replyTo: { $eq: null }
                }
            },
            { $sort: { 'isPin': -1, 'createdAt': -1 } },
            {
                $lookup: {
                    from: 'userstables',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $lookup: {
                    from: 'lecturerecordedcommentstables',
                    let: { commentId: '$_id' },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr: {
                                    $eq: ['$replyTo', '$$commentId']
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'userstables',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'replyUserDetails'
                            }
                        },
                        {
                            $unwind: '$replyUserDetails'
                        },
                        {
                            $project: {
                                id: '$_id',
                                _id: 0,
                                comment: '$commentText',
                                // isReport : 1 ,
                                createdAt: 1,
                                user: {
                                    id: '$replyUserDetails._id',
                                    name: '$replyUserDetails.FullName',
                                    profilePhoto: '$replyUserDetails.profilePhoto'
                                }

                            }
                        }
                    ],
                    // localField : '_id',
                    // foriegnField : 'replyTo',
                    as: 'replies'
                }
            },
            // {
            //     $addField : {
            //         createdAt1 : {
            //             '$function' : {
            //                 body : function(createdAt){ return  moment(createdAt).fromNow()},
            //                 arrgs : ['$createdAt'] ,
            //                 lang : "js"
            //             }
            //         }
            //     }
            // },
            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    isPin: 1,
                    comment: '$commentText',
                    createdAt: 1,
                    //    isReport :  1,
                    user: {
                        id: '$userDetails._id',
                        name: '$userDetails.FullName',
                        profilePhoto: '$userDetails.profilePhoto'
                    },
                    replies: 1
                }
            }
        ])

        // const comments =  await lectureRecordedCommentsTable.find({ lectureId : lectureId , replyTo : { $eq : null }}).populate('user' , '_id FullName profilePhoto').sort({  isPin : -1 , createdAt :  -1  });

        // let responseArr = [] ;
        // for( let i = 0 ; i < comments.length ; i++){
        //     let replies =  await lectureRecordedCommentsTable.find({ lectureId : lectureId , replyTo :  comments[i]?._id }).populate('user' , '_id FullName profilePhoto');
        //     let obj = {
        //         id :  comments[i]?._id ?? "" ,
        //         comment :  comments[i]?.commentText ?? "" ,
        //         createdAt : moment(comments[i]?.createdAt).fromNow() ,
        //         isPin : comments[i]?.isPin ?? false ,
        //         user :  { name :  comments[i]?.user?.FullName ?? "" , profilePhoto : comments[i]?.user?.profilePhoto ?? "" } ,
        //         replies :  replies.map((item) => {
        //             return {
        //                 id :  item?._id ?? "" ,
        //                 comment : item?.commentText ?? "" ,
        //                 createdAt : moment(item?.createdAt).fromNow() ,
        //                 user :  { name :  item?.user?.FullName ?? "" , profilePhoto : item?.user?.profilePhoto ?? "" }
        //             }
        //         })

        //     }
        //     // console.log(obj);
        //     responseArr.push(obj);
        // }

        return res.json({
            status: true,
            data: comments1?.map((item) => { return { ...item, createdAt: moment(item?.createdAt).fromNow(), replies: item?.replies?.map((item2) => { return { ...item2, createdAt: moment(item2.createdAt).fromNow() } }) } }),
            // data : responseArr,
            msg: 'Comments fetched'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getBatchLecturesReport/:batchId", isAdmin, async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) {
        return res.json({
            status: false,
            data: null,
            msg: 'Required batchId'
        })
    }
    try {
        const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: 'NOt an admin'
            })
        }
        const lectures = await LectureTable.find({ batch: batchId })
        let lectureIds = lectures?.map((item) => { return item?._id });
        let reports = await lectureReportTable.find({ lectureId: lectureIds }).populate("user", "_id FullName email mobileNumber").populate({
            path: 'lectureId',
            select: "_id batch teacher lecture_title starting_date ending_date",
            populate: {
                path: "teacher",
                select: "_id FullName Role"
            },
            // populate: {
            //     path: 'batch',
            //     select: '_id batch_name'
            // }
        })
        const hashmap = new Map();
        for (let report of reports) {
            // console.log(timespend.lecture.teacher)
            // let time = convertSecondsToTime(timespend?.timeSpend);
            let obj = {
                title: report?.title,
                Name: report?.user?.FullName,
                Phone: report?.user?.mobileNumber,
                Email: report?.user?.email == 'user@gmail.com' ? "NA" : report?.user?.email,
                // Duration: time,

                lectureName: report?.lectureId?.lecture_title,
                // batchName: report?.lectureId?.batch?.batch_name,
                lectureStartDateTime: report?.lectureId?.starting_date,
                lectureEndDateTime: report?.lectureId?.ending_date,
            }
            // timespend?.timeSpend =   (timespend?.timeSpend / 60)
            if (!hashmap.has(report?.lectureId?.lecture_title)) {
                hashmap.set(report?.lectureId?.lecture_title, [obj]);
            } else {
                let array = hashmap.get(report?.lectureId?.lecture_title);
                array.push(obj);
                hashmap.set(report?.lectureId?.lecture_title, array);
            }
        }
        // console.log(hashmap)
        let response = [...hashmap].map(([name, value]) => ({ lectureName: name, report: value }));
        return res.json({
            status: true,
            data: response ?? [],
            msg: 'reports feched'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getBatchLecturesComments/:batchId", isAdmin, async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) {
        return res.json({
            status: false,
            data: null,
            msg: 'Required batchId'
        })
    }
    try {
        const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: 'NOt an admin'
            })
        }
        const lectures = await LectureTable.find({ batch: batchId })
        let lectureIds = lectures?.map((item) => { return item?._id });
        let comments = await lectureCommentTable.find({ lectureId: lectureIds }).populate("user", "_id FullName email mobileNumber").populate({
            path: 'lectureId',
            select: "_id batch teacher lecture_title starting_date ending_date",
            populate: {
                path: "teacher",
                select: "_id FullName Role"
            },
            // populate: {
            //     path: 'batch',
            //     select: '_id batch_name'
            // }
        })

        const hashmap = new Map();
        for (let comment of comments) {
            // console.log(timespend.lecture.teacher)
            // let time = convertSecondsToTime(timespend?.timeSpend);
            let obj = {
                title: comment?.title,
                Name: comment?.user?.FullName,
                Phone: comment?.user?.mobileNumber,
                Email: comment?.user?.email == 'user@gmail.com' ? "NA" : comment?.user?.email,
                // Duration: time,

                lectureName: comment?.lectureId?.lecture_title,
                // batchName: report?.lectureId?.batch?.batch_name,
                lectureStartDateTime: comment?.lectureId?.starting_date,
                lectureEndDateTime: comment?.lectureId?.ending_date,
            }
            // timespend?.timeSpend =   (timespend?.timeSpend / 60)
            if (!hashmap.has(comment?.lectureId?.lecture_title)) {
                hashmap.set(comment?.lectureId?.lecture_title, [obj]);
            } else {
                let array = hashmap.get(comment?.lectureId?.lecture_title);
                array.push(obj);
                hashmap.set(comment?.lectureId?.lecture_title, array);
            }
        }
        // console.log(hashmap)
        let response = [...hashmap].map(([name, value]) => ({ lectureName: name, comment: value }));
        return res.json({
            status: true,
            data: response ?? [],
            msg: 'comments  feched'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

liveLecture.get("/getLectureComments/:lectureId", isAdmin, async (req, res) => {
    const { lectureId } = req.params;
    if (!lectureId) {
        return res.json({
            status: false,
            data: null,
            msg: 'Required lectureId'
        })
    }
    try {
        const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: 'NOt an admin'
            })
        }
        // const lectures = await LectureTable.find({ batch : batchId })
        // let lectureIds = lectures?.map((item) => { return item?._id });
        let comments = await lectureCommentTable.find({ lectureId: lectureId }).populate("user", "_id FullName email mobileNumber").populate({
            path: 'lectureId',
            select: "_id batch teacher lecture_title starting_date ending_date",
            populate: {
                path: "teacher",
                select: "_id FullName Role"
            },
            // populate: {
            //     path: 'batch',
            //     select: '_id batch_name'
            // }
        })

        const hashmap = new Map();
        for (let comment of comments) {
            // console.log(timespend.lecture.teacher)
            // let time = convertSecondsToTime(timespend?.timeSpend);
            let obj = {
                title: comment?.title,
                Name: comment?.user?.FullName,
                Phone: comment?.user?.mobileNumber,
                Email: comment?.user?.email == 'user@gmail.com' ? "NA" : comment?.user?.email,
                // Duration: time,

                lectureName: comment?.lectureId?.lecture_title,
                // batchName: report?.lectureId?.batch?.batch_name,
                lectureStartDateTime: comment?.lectureId?.starting_date,
                lectureEndDateTime: comment?.lectureId?.ending_date,
            }
            // timespend?.timeSpend =   (timespend?.timeSpend / 60)
            if (!hashmap.has(comment?.lectureId?.lecture_title)) {
                hashmap.set(comment?.lectureId?.lecture_title, [obj]);
            } else {
                let array = hashmap.get(comment?.lectureId?.lecture_title);
                array.push(obj);
                hashmap.set(comment?.lectureId?.lecture_title, array);
            }
        }
        // console.log(hashmap)
        let response = [...hashmap].map(([name, value]) => ({ lectureName: name, comment: value }));
        return res.json({
            status: true,
            data: response ?? [],
            msg: 'comments  feched'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

module.exports = liveLecture
