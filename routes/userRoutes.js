const express = require('express');
const moment = require('moment');
const { ValidateTokenForUser, isAdmin } = require('../middleware/authenticateToken');
const { LectureTable } = require('../models/addLecture');
const { lectureRoomTable } = require('../models/lectureRoom');
const { BatchesTable } = require('../models/BatchesSchema');
const multer = require('multer');
const { BatchDoubt } = require('../models/BatchDoubt');
const { BatchDoubtLike } = require('../models/BatchDoubtLike');
const { default: mongoose } = require('mongoose');
const { BatchDoubtComment } = require('../models/BatchDoubtComment');
const { UserTable } = require('../models/userModel');
const { fetchData } = require('../HelperFunctions/fileRead');
const upload = multer({ dest: 'uploads/batch' });
const userRoutes = express.Router();
const jwt = require('jsonwebtoken');
const { LectureResourceTable } = require('../models/lectureResources');
const { pipeline } = require('nodemailer/lib/xoauth2');
const { MybatchTable } = require('../models/MyBatches');
const { uploadFile } = require('../aws/UploadFile');
const { BatchDoubtReport } = require('../models/BatchDoubtReport');
const { BatchCommunity } = require('../models/BatchCommunity');
const { BatchCommunityLike } = require('../models/BatchCommunityLike');
const { BatchCommunityComment } = require('../models/BatchCommunityComment');
const { BatchCommunityReport } = require('../models/BatchCommunityReport');
const { BatchCommunityView } = require('../models/BatchCommunityView');
const { BatchCommunityCommentReply } = require('../models/BatchCommunityCommentReply');
const { badWordCheck } = require('../HelperFunctions/BadWordCheck');
const { BatchCommunityCommentReport } = require('../models/BatchCommunityCommentReport');
const { BatchCommunityCommentReplyReport } = require('../models/BatchCommunityCommentReplyReport');
const { announcementTable } = require('../models/announcements');
const { SubjectTable } = require('../models/Subject');
const { BatchDoubtCommentReport } = require('../models/BatchDoubtCommentReport');
const { sendCustomNotification } = require('../HelperFunctions/sendCustomNotification');
const { sendEmail } = require('../ContactUser/NodeMailer');
const { ValidityTable } = require('../models/Validity');
const { ValidityFeatureTable } = require('../models/ValidityFeature');
const { categoryTable } = require('../models/category');
const { couponTable } = require('../models/Coupon');
const { helps, videos } = require('../HelperFunctions/needHelp');
const { resultBannerTable } = require('../models/ResultBanner');
const { SuccessStoryTable } = require('../models/SuccessStory');
const { storeCartTable } = require("../models/storeCart");



userRoutes.get("/getSubjectOfBatch", ValidateTokenForUser, async (req, res) => {
    const { batchId } = req.query;
    if (!batchId) {
        return res.json({
            status: false,
            data: null,
            msg: 'Required batchId'
        })
    }
    try {

        let query = {
            _id: batchId,
            is_active: true,
        }
        // console.log(query);
        const isBatch = await BatchesTable.findOne(query).populate('features', '_id feature icon isActive order').populate("subject", "_id title icon");
        if (!isBatch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch not found'
            })
        }
        return res.json({
            status: true,
            data: isBatch?.subject?.map((item) => {
                return {
                    id: item?._id ?? "",
                    title: item?.title ?? "",
                    icon: item?.icon ?? "https://d1mbj426mo5twu.cloudfront.net/assets/science.png",
                }
            }),
            data1: {
                subjects: isBatch?.subject?.map((item) => {
                    return {
                        id: item?._id ?? "",
                        title: item?.title ?? "",
                        icon: item?.icon ?? "https://d1mbj426mo5twu.cloudfront.net/assets/science.png",
                    }
                }),
                batchFeatures: isBatch?.features?.filter((item) => item.isActive != false).sort((a, b) => a.order - b.order).map((item) => {
                    return {
                        featureId: item?._id ?? "",
                        icon: item?.icon ?? "",
                        feature: item?.feature ?? "",
                    }
                })
            },
            msg: 'All Subject fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getLectureOfSubject", ValidateTokenForUser, async (req, res) => {
    const { batchId, subjectId } = req.query;
    if (!batchId && !subjectId) {
        return res.json({
            status: false,
            data: null,
            msg: 'Required batchId or subjectId'
        })
    }
    try {

        const isBatch = await BatchesTable.findOne({ _id: batchId, subject: { $in: subjectId } }).populate("subject", "_id title");
        if (!isBatch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch not found'
            })
        }

        // const lectures = await LectureTable.find({ batch: batchId, subject: subjectId, isActive: true }).select('lecture_title starting_date ending_date link').sort({ createdAt: 1 });
        // return res.json({
        //     status: true,
        //     data: lectures.map((item , index ) => {
        //         return { 
        //             id : item?._id ?? "" , 
        //             banner :  item?.banner != "" ?  item?.banner : "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg" , 
        //             banner :  item?.banner != "" ?  item?.banner : "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg" , 
        //             title :  item?.lecture_title ?? "" , 
        //             startTime  : item?.starting_date ?? "" ,
        //             link : index == 0 ? item?.link :  "" ,
        //             endTime :  item?.ending_date ?? "" 
        //         }
        //     }),
        //     msg: 'All Lecture fetched'
        // })
        const lectures = await LectureTable.find({ batch: batchId, subject: subjectId, isActive: true }).sort({ createdAt: 1 });
        let response = lectures?.map((item, index) => {
            return {
                ...item?._doc,
                link: index == 0 ? item?.link : "",
                dpp: {
                    fileLoc: "",
                    fileName: "",
                    fileSize: "",
                },
                material: {
                    fileLoc: "",
                    fileName: "",
                    fileSize: "",
                },
                banner: item?.banner != "" ? item?.banner : "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg",
                commonName: item?._doc?.commonName ?? "",
            }
        });
        await UserTable.updateOne({ _id: user?._id }, { $addToSet: { viewedLectures: isLecture?._id } });
        await UserTable.updateOne({ _id: user?._id }, { $set: { lastActive: new Date() } });
        return res.json({
            status: true,
            data: response,
            msg: 'All Subject fetched'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getNotes", ValidateTokenForUser, async (req, res) => {
    const { batchId, subjectId } = req.query;
    if (!batchId || !subjectId) {
        return res.json({
            status: false,
            data: null,
            msg: "Required batchId Or SubjectId"
        })
    }
    try {


        const isBatch = await BatchesTable.findOne({ _id: batchId, subject: { $in: subjectId } });
        if (!isBatch) {
            return res.json({
                status: false,
                data: null,
                msg: "Batch not found"
            })
        }


        const lectures = await LectureTable.find({ batch: batchId, subject: subjectId, isActive: true });
        // console.log(lectures);
        let responseArr = [];
        let i = 0;
        for (let lec of lectures) {
            const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $ne: "DPP" }, is_active: true }).sort({ createdAt: -1 });
            let lectureMaterial = {
                resource_title: lec?.material?.fileName ?? "", resourceType: "pdf", file: {
                    fileLoc: lec?.material?.fileLoc ?? "",
                    fileName: lec?.material?.fileName ?? "",
                    fileSize: lec?.material?.fileSize ?? "",
                }
            }
            let resArr = [];
            if (lectureMaterial.file.fileName != "") resArr.push(lectureMaterial);
            if (notes.length > 0) {
                notes.map((item) => {
                    let resource = {
                        fileLoc: item?.upload_file?.fileLoc ?? "",
                        fileName: item?.upload_file?.fileName ?? "",
                        fileSize: item?.upload_file?.fileSize ?? "",
                    }
                    if (resource.fileName != "" && resource.fileLoc != "") resArr.push({ resource_title: item.title, resourceType: item.resourceType, file: resource, });
                })
            }
            if (resArr.length > 0) responseArr.push({ title: lec.lecture_title, res: resArr });
        }

        return res.json({
            status: true,
            data: responseArr?.map((item, index) => {
                return {
                    title: item?.title,
                    res: item?.res?.map((item2, index2) => {
                        return {
                            resource_title: item2?.resource_title ?? '',
                            resourceType: item2?.resourceType,
                            file: {
                                fileLoc: index === 0 && index2 === 0 ? item2?.file?.fileLoc : '',
                                fileName: item2?.file?.fileName,
                                fileSize: item2?.file?.fileSize,
                            },
                        };
                    }),
                };
            }),
            msg: 'All Notes fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

userRoutes.get("/getDPPs", ValidateTokenForUser, async (req, res) => {
    const { batchId, subjectId } = req.query;
    if (!batchId || !subjectId) {
        return res.json({
            status: false,
            data: null,
            msg: "Required batchId Or SubjectId"
        })
    }
    try {

        const isBatch = await BatchesTable.findOne({ _id: batchId, subject: { $in: subjectId } });
        if (!isBatch) {
            return res.json({
                status: false,
                data: null,
                msg: "Batch not found"
            })
        }
        const lectures = await LectureTable.find({ batch: batchId, subject: subjectId }).sort({ createdAt: 1 });
        let responseArr = [];
        for (let lec of lectures) {
            const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $eq: "DPP" }, is_active: true }).sort({ createdAt: 1 });
            let lectureDPP = {
                resource_title: lec?.dpp?.fileName ?? "", resourceType: "DPP", file: {
                    fileLoc: "",
                    fileName: lec?.dpp?.fileName ?? "",
                    fileSize: lec?.dpp?.fileSize ?? "",
                }
            }
            let resArr = [];
            if (lectureDPP.file.fileName != "") resArr.push(lectureDPP);
            if (notes.length > 0) {
                notes.map((item) => {
                    let resource = {
                        fileLoc: item?.upload_file?.fileLoc ?? "",
                        fileName: item?.upload_file?.fileName ?? "",
                        fileSize: item?.upload_file?.fileSize ?? "",
                    }
                    if (resource.fileName != "" && resource.fileLoc != "") resArr.push({ resource_title: item.title, resourceType: item.resourceType, file: resource, });

                })
            }
            if (resArr.length > 0) responseArr.push({ title: lec.lecture_title, res: resArr });
        }

        return res.json({
            status: true,
            data: responseArr?.map((item, index) => {
                return {
                    title: item?.title,
                    res: item?.res?.map((item2, index2) => {
                        return {
                            resource_title: item2?.resource_title ?? '',
                            resourceType: item2?.resourceType,
                            file: {
                                fileLoc: index === 0 && index2 === 0 ? item2?.file?.fileLoc : '',
                                fileName: item2?.file?.fileName,
                                fileSize: item2?.file?.fileSize,
                            },
                        };
                    }),
                };
            }),
            msg: 'All Notes fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})


//  doubts 
userRoutes.post("/createDoubt", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    try {
        const { batchId, desc, lectureId, subjectId } = req.body;
        const user = await UserTable.findOne({ _id: req.userId }).select('FullName profilePhoto email mobileNumber isVerified');
        let isBadMsg = await badWordCheck(desc);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isMyBatch = await MybatchTable.findOne({ user: req.userId, batch_id: batchId }).populate('batch_id', 'batch_name').populate('user', 'FullName profilePhoto isVerified');
        if (!isMyBatch) {
            return res.json({
                status: false,
                data: null,
                msg: `Not Authorized`
            })
        }
        const isLecture = await LectureTable.findOne({ _id: lectureId, subject: subjectId }).populate('subject', 'title').populate('teacher', '_id FullName profilePhoto email').select('lecture_title teacher');
        if (!isLecture) {
            return res.json({
                status: false,
                data: null,
                msg: 'Lecture not found'
            })
        }
        const existing = await BatchDoubt.findOne({
            user: req.userId,
            desc: desc,
            batch: batchId,
            createdAt: {
              $gte: new Date(Date.now() - 100000) // within the last 10 seconds
            }
          });
          
        if (existing) {
            console.log("Duplicate doubt detected:", existing);
            return res.json({
                status: false,
                data: null,
                msg: 'Duplicate doubt already exists.'
            })
        }
          
        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `/batchDoubt/${isMyBatch?.batch_id?.batch_name?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        const doubt = await BatchDoubt.create({
            batch: batchId,
            user: req.userId,
            lecture: lectureId,
            desc,
            subject: subjectId,
            problemImage: fileLoc,
            isActive: isMyBatch?.user?.isVerified == true ? true : fileLoc != "" ? false : true,
            isResolved: false,
        })
        if (doubt && doubt?.isActive) {
            const data = {
                title: `Your doubt has been raised.`,
                message: `${desc}`,
                fileUrl: doubt?.problemImage || "",
                route: "batchDoubtById",
                rootId: `${batchId}`,
                childId: doubt?._id
            };
            await sendCustomNotification([req.userId], data)
            let emailData = {
                courseName: isMyBatch?.batch_id?.batch_name ?? "",
                doubtDesc: desc,
                problemImage: doubt?.problemImage ?? "",
                lectureName: isLecture?.lecture_title ?? "",
                subject: isLecture?.subject?.title ?? "",
                studentName: user?.FullName ?? "student",
                studentPhone: user?.mobileNumber ?? ""
            }
            // console.log( emailData);
            if (isLecture?.teacher[0]?.email !== "") {
                await sendEmail('BatchDoubtForTeacher', isLecture?.teacher[0]?.email, isLecture?.teacher[0]?.FullName ?? "Teacher", emailData);
            }

        }

        return res.json({
            status: true,
            data: doubt?.isActive ? {
                "user": {
                    "name": isMyBatch?.user?.FullName ?? "",
                    "profilePhoto": isMyBatch?.user?.profilePhoto ?? "",
                    "isVerified": isMyBatch?.user?.isVerified ?? false,
                },
                desc,
                "problemImage": doubt?.problemImage ?? "",
                "lectureName": isLecture?.lecture_title ?? "",
                "createdAt": moment(doubt.createdAt).fromNow(),
                lectureName: isLecture?.lecture_title ?? "",
                teacher: isLecture?.teacher[0]?.FullName ?? "",
                subject: isLecture?.subject?.title ?? "",
                "id": doubt?._id,
                "isLiked": false,
                "comments": [],
                "likes": 0,
                "isMyDoubt": true,
                isResolved: doubt?.isResolved ?? false,
                totalComments: 0,
            } : {},
            msg: 'Doubt created successfully'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/batchDoubtLikeAndDislike", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchDoubtId } = req.body;
        // console.log("before" , req.userId);
        const userId = mongoose.Types.ObjectId(req.userId);
        // console.log("after"  , userId)
        let isBatchDoubtLike = await BatchDoubtLike.findOne({ batchDoubt: batchDoubtId });
        let isLiked = false;
        if (!isBatchDoubtLike) {
            isBatchDoubtLike = await BatchDoubtLike.create({ batchDoubt: batchDoubtId, users: [] })
        }
        // console.log(isBatchDoubtLike?.users?.includes(userId))
        // console.log(isBatchDoubtLike?.users )
        // console.log(userId);
        if (!isBatchDoubtLike?.users?.includes(userId)) {
            await BatchDoubtLike.updateOne({ _id: isBatchDoubtLike?._id }, { $push: { users: userId } });
            isLiked = true;
        } else {
            await BatchDoubtLike.updateOne({ _id: isBatchDoubtLike?._id }, { $pull: { users: userId } });
        }
        return res.json({
            status: true,
            data: null,
            msg: isLiked ? 'Doubt liked sucessfully' : 'Doubt liked remove.'
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/createBatchDoubtComment", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    try {
        const { batchDoubtId, msg } = req.body;
        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isDoubt = await BatchDoubt.findOne({ _id: batchDoubtId });
        if (!isDoubt) {
            return res.json({
                status: false,
                data: null,
                msg: 'Doubt not exist.'
            })
        }
        const user = await UserTable.findOne({ _id: req.userId }).select("_id FullName profilePhoto isVerified")
        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchDoubt/comment/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        const newComment = await BatchDoubtComment.create({
            batchDoubt: batchDoubtId,
            msg: msg,
            user: req.userId,
            image: fileLoc,
            isActive: user?.isVerified == true ? true : fileLoc != "" ? false : true
        });
        if (newComment && newComment?.isActive) {
            const data = {
                title: `New comment on your doubt`,
                message: `${msg}`,
                fileUrl: newComment?.image || "",
                route: "batchDoubtById",
                rootId: `${isDoubt?.batch}`,
                childId: batchDoubtId
            };
            await sendCustomNotification([isDoubt?.user], data)
        }
        return res.json({
            status: true,
            data: newComment?.isActive == true ? {
                "commentId": newComment?._id,
                "isMyComment": true,
                "user": {
                    "name": user?.FullName ?? "",
                    "profilePhoto": user?.profilePhoto ?? "",
                    isVerified: user?.isVerified ?? false,

                },
                "msg": msg,
                "image": fileLoc,
                "createdAt": moment(newComment.createdAt).fromNow(),
                // replies: [],
            } : {},
            msg: 'Batch Doubt Comment'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getBatchDoubts", ValidateTokenForUser, async (req, res) => {
    try {
        let { batchId, page, pageSize } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        const isMyBatch = await MybatchTable.findOne({ user: req.userId, batch_id: batchId });
        if (!isMyBatch) {
            return res.json({
              status: false,
              data: null,
              msg: "not authorized to access"
            })
        }
        const doubts = await BatchDoubt.aggregate([
            {
                $facet: {
                    doubts: [
                        {
                            $match: { batch: mongoose.Types.ObjectId(batchId), createdAt: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $skip: (page - 1) * pageSize
                        },
                        {
                            $limit: pageSize
                        },
                        {
                            $lookup: {
                                from: 'userstables',
                                foreignField: '_id',
                                localField: 'user',
                                as: 'userDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$userDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'subjecttables',
                                foreignField: '_id',
                                localField: 'subject',
                                as: 'subjectDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$subjectDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'lecturetables',
                                let: { lectureId: '$lecture' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$_id', "$$lectureId"] } } },
                                    {
                                        $lookup: {
                                            from: 'adminteachertables',
                                            localField: 'teacher',
                                            foreignField: '_id',
                                            as: 'teacherDetails',
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: '$teacherDetails',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $project: {
                                            lectureId: '$_id',
                                            _id: 0,
                                            lectureTitle: '$lecture_title',
                                            createdAt: '$createdAt',
                                            teacher: '$teacherDetails.FullName'

                                        }
                                    }
                                ],
                                as: 'lectures'
                            }
                        },
                        {
                            $unwind: {
                                path: '$lectures',
                                preserveNullAndEmptyArrays: true
                            }
                        },

                        {
                            $lookup: {
                                from: 'batchdoubtlikes',
                                foreignField: 'batchDoubt',
                                localField: '_id',
                                as: 'doubtLikes'
                            }
                        },
                        {
                            $unwind: {
                                path: '$doubtLikes',
                                preserveNullAndEmptyArrays: true
                            }
                        },

                        {
                            $lookup: {
                                from: 'batchdoubtcomments',
                                let: { doubtId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$batchDoubt', "$$doubtId"] }, isActive: true } },
                                    {
                                        $project: {
                                            commentId: '$_id',
                                        }
                                    }
                                ],
                                as: 'comments'
                            }
                        },
                        {
                            $project: {
                                id: '$_id',
                                _id: 0,
                                desc: 1,
                                problemImage: 1,
                                createdAt: 1,
                                subject: '$subjectDetails.title',
                                user: {
                                    _id: '$userDetails._id',
                                    name: '$userDetails.FullName',
                                    profilePhoto: '$userDetails.profilePhoto',
                                    isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } }

                                },
                                isResolved: 1,
                                lectureName: '$lectures.lectureTitle',
                                teacher: '$lectures.teacher',
                                // lectures : 0 , 
                                isLiked: { $in: [req.userId, { $ifNull: ["$doubtLikes.users", []] }] },
                                likes: { $cond: { if: { $isArray: '$doubtLikes.users' }, then: { $size: '$doubtLikes.users' }, else: 0 } },
                                totalComments: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } }
                            }
                        }
                    ],
                    totalCounts: [
                        { $match: { isActive: true, batch: mongoose.Types.ObjectId(batchId) } },
                        { $group: { _id: null, count: { $sum: 1 } } },
                        { $replaceWith: { count: "$count" } },
                        { $project: { _id: 0, count: 1 } }
                    ]
                }
            },
            {
                $project: {
                    doubts: 1,
                    totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
                }
            }

        ])

        return res.json({
            status: true,
            data: {
                totalCounts: doubts[0]?.totalCounts ?? 0,
                doubts: doubts[0]?.doubts?.map((item) => {
                    return {
                        ...item,
                        isResolved: item?.isResolved ?? false,
                        "isMyDoubt": req.userId.equals(item?.user?._id),
                        createdAt: moment(item?.createdAt).fromNow(),
                    }
                })
            } ?? { doubts: [], totalCounts: 0 },
            msg: `Doubts fetch successfully`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

//  user routes 
userRoutes.get("/getMyBatchDoubts", ValidateTokenForUser, async (req, res) => {
    try {
        let { batchId, page, pageSize } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        // console.log(req.userId);
        const doubts = await BatchDoubt.aggregate([
            {
                $facet: {
                    doubts: [
                        {
                            $match: { batch: mongoose.Types.ObjectId(batchId), isActive: true, user: mongoose.Types.ObjectId(req.userId) }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $skip: (page - 1) * pageSize
                        },
                        {
                            $limit: pageSize
                        },
                        {
                            $lookup: {
                                from: 'userstables',
                                foreignField: '_id',
                                localField: 'user',
                                as: 'userDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$userDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'subjecttables',
                                foreignField: '_id',
                                localField: 'subject',
                                as: 'subjectDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$subjectDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'lecturetables',
                                let: { lectureId: '$lecture' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$_id', "$$lectureId"] } } },
                                    {
                                        $lookup: {
                                            from: 'adminteachertables',
                                            localField: 'teacher',
                                            foreignField: '_id',
                                            as: 'teacherDetails',
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: '$teacherDetails',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $project: {
                                            lectureId: '$_id',
                                            _id: 0,
                                            lectureTitle: '$lecture_title',
                                            createdAt: '$createdAt',
                                            teacher: '$teacherDetails.FullName'

                                        }
                                    }
                                ],
                                as: 'lectures'
                            }
                        },
                        {
                            $unwind: {
                                path: '$lectures',
                                preserveNullAndEmptyArrays: true
                            }
                        },

                        {
                            $lookup: {
                                from: 'batchdoubtlikes',
                                foreignField: 'batchDoubt',
                                localField: '_id',
                                as: 'doubtLikes'
                            }
                        },
                        {
                            $unwind: {
                                path: '$doubtLikes',
                                preserveNullAndEmptyArrays: true
                            }
                        },

                        {
                            $lookup: {
                                from: 'batchdoubtcomments',
                                let: { doubtId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$batchDoubt', "$$doubtId"] }, isActive: true } },
                                    {
                                        $project: {
                                            commentId: '$_id',
                                        }
                                    }
                                ],
                                as: 'comments'
                            }
                        },
                        {
                            $project: {
                                id: '$_id',
                                _id: 0,
                                desc: 1,
                                problemImage: 1,
                                createdAt: 1,
                                subject: '$subjectDetails.title',
                                user: {
                                    _id: '$userDetails._id',
                                    name: '$userDetails.FullName',
                                    profilePhoto: '$userDetails.profilePhoto',
                                    isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } }

                                },
                                isResolved: 1,
                                lectureName: '$lectures.lectureTitle',
                                teacher: '$lectures.teacher',
                                // lectures : 0 , 
                                isLiked: { $in: [req.userId, { $ifNull: ["$doubtLikes.users", []] }] },
                                likes: { $cond: { if: { $isArray: '$doubtLikes.users' }, then: { $size: '$doubtLikes.users' }, else: 0 } },
                                totalComments: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } }
                            }
                        }
                    ],
                    totalCounts: [
                        { $match: { isActive: true, batch: mongoose.Types.ObjectId(batchId), user: mongoose.Types.ObjectId(req.userId) } },
                        { $group: { _id: null, count: { $sum: 1 } } },
                        { $replaceWith: { count: "$count" } },
                        { $project: { _id: 0, count: 1 } }
                    ]
                }
            },
            {
                $project: {
                    doubts: 1,
                    totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
                }
            }

        ])

        return res.json({
            status: true,
            data: {
                totalCounts: doubts[0]?.totalCounts ?? 0,
                doubts: doubts[0]?.doubts?.map((item) => {
                    return {
                        ...item,
                        isResolved: item?.isResolved ?? false,
                        "isMyDoubt": req.userId.equals(item?.user?._id),
                        createdAt: moment(item?.createdAt).fromNow(),
                    }
                })
            } ?? { doubts: [], totalCounts: 0 },
            msg: `Doubts fetch successfully`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/reportDoubt", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchDoubtId, reason } = req.body;
        if (['', null, undefined].includes(reason)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required reason'
            })
        }
        const isBatchDoubt = await BatchDoubt.findOne({ _id: batchDoubtId });
        if (!batchDoubtId) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Doubt not exists`
            })
        }
        let isBatchReport = await BatchDoubtReport.findOne({ batchDoubt: isBatchDoubt?._id, user: req.userId });
        if (isBatchReport) {
            return res.json({
                status: false,
                data: null,
                msg: 'Already reported'
            })
        }
        await BatchDoubtReport.create({ batchDoubt: isBatchDoubt?._id, user: req.userId, reason: reason });
        return res.json({
            status: true,
            data: null,
            msg: 'Doubt reported successfully'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getDoubt", ValidateTokenForUser, async (req, res) => {
    try {
        let { batchDoubtId } = req.query;
        const doubt = await BatchDoubt.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(batchDoubtId), isActive: true }
            },
            {
                $lookup: {
                    from: 'userstables',
                    foreignField: '_id',
                    localField: 'user',
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: '$userDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'subjecttables',
                    foreignField: '_id',
                    localField: 'subject',
                    as: 'subjectDetails'
                }
            },
            {
                $unwind: {
                    path: '$subjectDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'lecturetables',
                    let: { lectureId: '$lecture' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', "$$lectureId"] } } },
                        {
                            $lookup: {
                                from: 'adminteachertables',
                                localField: 'teacher',
                                foreignField: '_id',
                                as: 'teacherDetails',
                            },
                        },
                        {
                            $unwind: {
                                path: '$teacherDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                lectureId: '$_id',
                                _id: 0,
                                lectureTitle: '$lecture_title',
                                createdAt: '$createdAt',
                                teacher: '$teacherDetails.FullName'

                            }
                        }
                    ],
                    as: 'lectures'
                }
            },
            {
                $unwind: {
                    path: '$lectures',
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: 'batchdoubtlikes',
                    foreignField: 'batchDoubt',
                    localField: '_id',
                    as: 'doubtLikes'
                }
            },
            {
                $unwind: {
                    path: '$doubtLikes',
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: 'batchdoubtcomments',
                    let: { doubtId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$batchDoubt', "$$doubtId"] }, isActive: true } },
                        { $sort: { createdAt: -1 } },
                        {
                            $lookup: {
                                from: 'userstables',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'userDetails',
                            },
                        },
                        { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                commentId: '$_id',
                                _id: 0,
                                msg: '$msg',
                                image: 1,
                                createdAt: '$createdAt',
                                user: {
                                    _id: '$userDetails._id',
                                    name: '$userDetails.FullName',
                                    profilePhoto: '$userDetails.profilePhoto',
                                    isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } }

                                }
                            }
                        }
                    ],
                    as: 'comments'
                }
            },
            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    desc: 1,
                    problemImage: 1,
                    createdAt: 1,
                    subject: '$subjectDetails.title',
                    user: {
                        _id: '$userDetails._id',
                        name: '$userDetails.FullName',
                        profilePhoto: '$userDetails.profilePhoto',
                        isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } }

                    },
                    isResolved: 1,
                    lectureName: '$lectures.lectureTitle',
                    teacher: '$lectures.teacher',
                    comments: 1,
                    isLiked: { $in: [req.userId, { $ifNull: ["$doubtLikes.users", []] }] },
                    likes: { $cond: { if: { $isArray: '$doubtLikes.users' }, then: { $size: '$doubtLikes.users' }, else: 0 } },
                    totalComments: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } }
                }
            }
        ]);

        return res.json({
            status: true,
            data: {
                ...doubt[0],
                isResolved: doubt[0]?.isResolved ?? false,
                "isMyDoubt": req.userId.equals(doubt[0]?.user?._id),
                createdAt: moment(doubt[0]?.createdAt).fromNow(),
                comments: doubt[0]?.comments?.map((item2) => {
                    return {
                        ...item2,
                        "isMyComment": req.userId.equals(item2?.user?._id),
                        createdAt: moment(item2?.createdAt).fromNow()
                    }
                }),
            },
            msg: `Doubt fetch successfully`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


userRoutes.put("/editDoubtComment", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    const { commentId, msg, image } = req.body;
    if (!commentId || !msg) {
        return res.json({
            status: false,
            data: null,
            msg: `Required CommentId & msg`
        })
    }
    try {
        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }

        const isComment = await BatchDoubtComment.findOne({ _id: commentId }).populate('user', '_id FullName profilePhoto isVerified');
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        let fileLoc = image ?? "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchDoubt/comments/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        if (!req.userId.equals(isComment?.user?._id)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not authorized to edit'
            })
        }
        let isActive = isComment?.image == fileLoc ? isComment?.isActive : isComment?.user?.isVerified == true ? true : fileLoc == "" ? true : false;
        const newComment = await BatchDoubtComment.findOneAndUpdate({ _id: commentId }, { msg: msg, image: fileLoc, isActive: isActive }, { new: true, lean: true })
        return res.json({
            status: true,
            data: newComment?.isActive == true ? {
                "commentId": newComment?._id,
                "user": {
                    "name": isComment?.user?.FullName ?? "",
                    "profilePhoto": isComment?.user?.profilePhoto ?? "",
                    isVerified: isComment?.user?.isVerified ?? false,

                },
                image: fileLoc ?? "",
                "isMyComment": true,
                "msg": newComment?.msg ?? "",
                "createdAt": moment(newComment?.createdAt).fromNow()
            } : {},
            msg: "Comment edited"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})


// delete Batch Doubt 
userRoutes.delete("/deleteBatchDoubt", ValidateTokenForUser, async (req, res) => {
    try {
        const { doubtId } = req.query;
        if (!doubtId) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Doubt Id required`
            })
        }
        const doubt = await BatchDoubt.findOneAndDelete({ _id: doubtId, user: req.userId });
        await BatchDoubtComment.deleteMany({ batchDoubt: doubt?._id });

        if (!doubt) {
            return res.json({
                status: false,
                data: null,
                msg: 'Doubt not found'
            })
        }
        return res.json({
            status: true,
            data: null,
            msg: 'Doubt deleted successfully'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})
// delete Batch Doubt  Comment  
userRoutes.delete("/deleteDoubtComment", ValidateTokenForUser, async (req, res) => {
    try {
        const { commentId } = req.query;
        if (!commentId) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Doubt comment Id required`
            })
        }
        const comment = await BatchDoubtComment.findOneAndDelete({ _id: commentId, user: req.userId });
        if (!comment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not found'
            })
        }
        return res.json({
            status: true,
            data: null,
            msg: 'Comment deleted successfully'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.put("/editDoubtComment", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    const { commentId, msg, image } = req.body;
    if (!commentId || !msg) {
        return res.json({
            status: false,
            data: null,
            msg: `Required CommentId & msg`
        })
    }
    try {
        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }

        const isComment = await BatchDoubtComment.findOne({ _id: commentId }).populate('user', '_id FullName profilePhoto isVerified');
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        let fileLoc = image ?? "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchDoubt/comments/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        if (!req.userId.equals(isComment?.user?._id)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not authorized to edit'
            })
        }
        let isActive = isComment?.image == fileLoc ? isComment?.isActive : isComment?.user?.isVerified == true ? true : fileLoc == "" ? true : false;
        const newComment = await BatchDoubtComment.findOneAndUpdate({ _id: commentId }, { msg: msg, image: fileLoc, isActive: isActive }, { new: true, lean: true })
        return res.json({
            status: true,
            data: newComment?.isActive == true ? {
                "commentId": newComment?._id,
                "user": {
                    "name": isComment?.user?.FullName ?? "",
                    "profilePhoto": isComment?.user?.profilePhoto ?? "",
                    isVerified: isComment?.user?.isVerified ?? false,

                },
                image: fileLoc ?? "",
                "isMyComment": true,
                "cmntsMsg": newComment?.msg ?? "",
                "createdAt": moment(newComment?.createdAt).fromNow()
            } : {},
            msg: "Comment edited"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

userRoutes.put("/editBatchDoubt", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    try {
        const { desc, batchDoubtId, problemImage } = req.body;
        if (!desc) {
            return res.json({
                status: false,
                data: null,
                msg: 'Message required'
            })
        }
        let isBadMsg = await badWordCheck(desc);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const user = await UserTable.findOne({ _id: req.userId }).select('FullName profilePhoto isVerified');
        const isBatchDoubt = await BatchDoubt.findOne({ _id: batchDoubtId, user: user?._id }).populate('subject', 'title').populate({
            path: 'lecture',
            select: "lecture_title",
            populate: {
                path: 'teacher',
                select: 'FullName'
            }
        }).populate('batch', 'batch_name');
        if (!isBatchDoubt) {
            return res.json({
                status: false,
                data: null,
                msg: 'This doubt not exist.'
            })
        }

        let fileLoc = problemImage;
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchDoubt/${isBatchDoubt?.batch_name?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        const doubt = await BatchDoubt.findOneAndUpdate(
            { _id: isBatchDoubt?._id },
            {
                desc,
                problemImage: fileLoc,
                isActive: user?.isVerified == true ? true : fileLoc === isBatchDoubt?.problemImage ? isBatchDoubt?.isActive : fileLoc != "" ? false : true
            }, { new: true, lean: true });

        const likes = await BatchDoubtLike.findOne({ batchDoubt: isBatchDoubt?._id, });
        const comments = await BatchDoubtComment.find({ batchDoubt: isBatchDoubt?._id, isActive: true }).populate('user', '_id FullName profilePhoto isVerified');
        return res.json({
            status: true,
            data: doubt?.isActive == true ? {
                "user": {
                    "name": user?.FullName ?? "",
                    "profilePhoto": user?.profilePhoto ?? "",
                    isVerified: user?.isVerified ?? false,

                },
                desc,
                "problemImage": doubt?.problemImage,
                "createdAt": moment(doubt.createdAt).fromNow(),
                "id": doubt?._id,
                "isLiked": likes?.users.includes(user?._id) ? true : false,
                "likes": likes?.length ?? 0,
                "lectureName": isBatchDoubt?.lecture?.lecture_title ?? "",
                "teacher": isBatchDoubt?.lecture?.teacher[0]?.FullName ?? "",
                "subject": isBatchDoubt?.subject?.title ?? "",
                totalComments: comments?.length,
                isResolved: doubt?.isResolved ?? false,
                "isMyDoubt": true,
                comments: comments?.map((item2) => {
                    return {
                        commentId: item2?._id,
                        msg: item2?.msg ?? "",
                        image: item2?.image ?? "",
                        user: {
                            _id: item2?.user?._id ?? "",
                            name: item2?.user?.FullName ?? "",
                            profilePhoto: item2?.user?.profilePhoto ?? "",
                            isVerified: item2?.user?.isVerified ?? false,
                        },
                        "isMyComment": req.userId.equals(item2?.user?._id),
                        createdAt: moment(item2?.createdAt).fromNow()
                    }
                }),
            } : {},
            msg: 'Batch Doubt created successfully'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// batch community 


userRoutes.post("/createCommunity", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    try {
        const { batchId, desc } = req.body;
        if (!batchId || !desc) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch & details required'
            })
        }
        let isBadMsg = await badWordCheck(desc);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const user = await UserTable.findOne({ _id: req.userId }).select('FullName profilePhoto isVerified');
        const isBatch = await BatchesTable.findOne({ _id: batchId });
        if (!isBatch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch Id  Required'
            })
        }


        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchCommunity/${isBatch?.batch_name?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        // console.log(fileLoc);
        const community = await BatchCommunity.create({
            batch: batchId,
            user: req.userId,
            desc,
            problemImage: fileLoc,
            isActive: user?.isVerified == true ? true : fileLoc != "" ? false : true
        })
        if (community && community?.isActive) {
            const data = {
                title: `${user?.FullName} posted in Community`,
                message: `${desc}`,
                fileUrl: community?.problemImage || "",
                route: "batchCommunity",
                rootId: `${batchId}`,
                childId: ""
            };
            await sendCustomNotification(isBatch?.student, data)
        }

        return res.json({
            status: true,
            data: community?.isActive == true ? {
                "user": {
                    "name": user?.FullName ?? "",
                    "profilePhoto": user?.profilePhoto ?? "",
                    "isVerified": user?.isVerified ?? false,
                },
                desc,
                "problemImage": community?.problemImage ?? "",
                "createdAt": moment(community.createdAt).fromNow(),
                "id": community?._id,
                "isLiked": false,
                "likes": 0,
                "views": 0,
                "isMyCommunity": true,
            } : {},
            msg: 'Community created successfully'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/batchCommunityLikeAndDislike", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchCommunityId } = req.body;
        // console.log("before" , req.userId);
        const userId = mongoose.Types.ObjectId(req.userId);
        // console.log("after"  , userId)
        const user = await UserTable.findOne({ _id: userId })
        const isCommunity = await BatchCommunity.findOne({ _id: batchCommunityId })
        let isBatchCommunityLike = await BatchCommunityLike.findOne({ batchCommunity: batchCommunityId });
        let isLiked = false;
        if (!isBatchCommunityLike) {
            isBatchCommunityLike = await BatchCommunityLike.create({ batchCommunity: batchCommunityId, users: [] })
        }
        if (!isBatchCommunityLike?.users?.includes(userId)) {
            await BatchCommunityLike.updateOne({ _id: isBatchCommunityLike?._id }, { $push: { users: userId } });
            const data = {
                title: `${user?.FullName} liked your post`,
                message: "",
                fileUrl: "",
                route: "batchCommunity",
                rootId: "",
                childId: ""
            };
            await sendCustomNotification([isCommunity?.user], data)
            isLiked = true;
        } else {
            await BatchCommunityLike.updateOne({ _id: isBatchCommunityLike?._id }, { $pull: { users: userId } });
        }
        return res.json({
            status: true,
            data: null,
            msg: isLiked ? '' : ''
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/createBatchCommunityComment", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    try {
        const { batchCommunityId, msg } = req.body;
        const user = await UserTable.findOne({ _id: req.userId }).select('_id FullName profilePhoto isVerified')
        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isCommunity = await BatchCommunity.findOne({ _id: batchCommunityId });
        if (!isCommunity) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch community not exist.'
            })
        }

        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchCommunity/comments/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        const newComment = await BatchCommunityComment.create({
            batchCommunity: batchCommunityId, msg: msg, user: req.userId, image: fileLoc,
            isActive: user?.isVerified == true ? true : fileLoc != "" ? false : true

        });
        if (newComment && newComment?.isActive) {
            const data = {
                title: `${user?.FullName} Added comment on your post`,
                message: `${msg}`,
                fileUrl: newComment?.image || "",
                route: "batchCommunityById",
                rootId: `${isCommunity.batch}`,
                childId: batchCommunityId
            };
            await sendCustomNotification([isCommunity?.user], data)
        }
        return res.json({
            status: true,
            data: newComment?.isActive == true ? {
                "commentId": newComment?._id,
                "isMyComment": true,
                "user": {
                    "name": user?.FullName ?? "",
                    "profilePhoto": user?.profilePhoto ?? "",
                    isVerified: user?.isVerified ?? false,

                },
                "cmntsMsg": msg,
                "image": fileLoc,
                "createdAt": moment(newComment.createdAt).fromNow(),
                replies: [],
            } : {},
            msg: 'Batch Community Comment'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getBatchCommunities", ValidateTokenForUser, async (req, res) => {
    try {
        let { batchId, page, pageSize } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        const isMyBatch = await MybatchTable.findOne({ user: req.userId, batch_id: batchId });
        if (!isMyBatch) {
        return res.json({
            status: false,
            data: null,
            msg: "not authorized to access"
        })
        }
        const communities = await BatchCommunity.aggregate([
            {
                $facet: {
                    communities: [
                        {
                            $match: { batch: mongoose.Types.ObjectId(batchId), createdAt: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $skip: (page - 1) * pageSize
                        },
                        {
                            $limit: pageSize
                        },
                        {
                            $lookup: {
                                from: 'userstables',
                                foreignField: '_id',
                                localField: 'user',
                                as: 'userDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$userDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },


                        {
                            $lookup: {
                                from: 'batchcommunitylikes',
                                foreignField: 'batchCommunity',
                                localField: '_id',
                                as: 'communityLikes'
                            }
                        },
                        {
                            $unwind: {
                                path: '$communityLikes',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'batchcommunityviews',
                                foreignField: 'batchCommunity',
                                localField: '_id',
                                as: 'communityViews'
                            }
                        },
                        {
                            $unwind: {
                                path: '$communityViews',
                                preserveNullAndEmptyArrays: true
                            }
                        },

                        {
                            $lookup: {
                                from: 'batchcommunitycomments',
                                let: { communityId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$batchCommunity', "$$communityId"] }, isActive: true } },
                                ],
                                as: 'comments'
                            }
                        },
                        {
                            $project: {
                                id: '$_id',
                                _id: 0,
                                desc: 1,
                                problemImage: 1,
                                createdAt: 1,
                                user: { _id: "$userDetails._id", name: '$userDetails.FullName', profilePhoto: '$userDetails.profilePhoto', isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } } },
                                isLiked: { $in: [req.userId, { $ifNull: ["$communityLikes.users", []] }] },
                                // comments : { $cond : { if : { $isArray :'$comments' } , then : '$comments' , else : []}} , 
                                commentCounts: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } },
                                likes: { $cond: { if: { $isArray: '$communityLikes.users' }, then: { $size: '$communityLikes.users' }, else: 0 } },
                                views: { $cond: { if: { $isArray: '$communityViews.users' }, then: { $size: '$communityViews.users' }, else: 0 } }
                            }
                        }
                    ],
                    totalCounts: [
                        { $match: { isActive: true, batch: mongoose.Types.ObjectId(batchId) } },
                        { $group: { _id: null, count: { $sum: 1 } } },
                        { $replaceWith: { count: "$count" } },
                        { $project: { _id: 0, count: 1 } }
                    ]
                }
            },
            {
                $project: {
                    communities: 1,
                    totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
                }
            }

        ])

        return res.json({
            status: true,
            data: {
                totalCounts: communities[0]?.totalCounts ?? 0,
                communities: communities[0]?.communities?.map((item) => {
                    return {
                        ...item,
                        createdAt: moment(item?.createdAt).fromNow(),
                        "isMyCommunity": req.userId.equals(item?.user?._id),
                    }
                })
            } ?? { communities: [], totalCounts: 0 },
            msg: `Communities fetch successfully`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getBatchMyCommunities", ValidateTokenForUser, async (req, res) => {
    try {
        let { batchId, page, pageSize } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        const communities = await BatchCommunity.aggregate([
            {
                $facet: {
                    communities: [
                        {
                            $match: { batch: mongoose.Types.ObjectId(batchId), isActive: true, user: mongoose.Types.ObjectId(req.userId) }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $skip: (page - 1) * pageSize
                        },
                        {
                            $limit: pageSize
                        },
                        {
                            $lookup: {
                                from: 'userstables',
                                foreignField: '_id',
                                localField: 'user',
                                as: 'userDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$userDetails',
                                preserveNullAndEmptyArrays: true
                            }
                        },


                        {
                            $lookup: {
                                from: 'batchcommunitylikes',
                                foreignField: 'batchCommunity',
                                localField: '_id',
                                as: 'communityLikes'
                            }
                        },
                        {
                            $unwind: {
                                path: '$communityLikes',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'batchcommunityviews',
                                foreignField: 'batchCommunity',
                                localField: '_id',
                                as: 'communityViews'
                            }
                        },
                        {
                            $unwind: {
                                path: '$communityViews',
                                preserveNullAndEmptyArrays: true
                            }
                        },

                        {
                            $lookup: {
                                from: 'batchcommunitycomments',
                                let: { communityId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$batchCommunity', "$$communityId"] }, isActive: true } },
                                ],
                                as: 'comments'
                            }
                        },
                        {
                            $project: {
                                id: '$_id',
                                _id: 0,
                                desc: 1,
                                problemImage: 1,
                                createdAt: 1,
                                user: { _id: "$userDetails._id", name: '$userDetails.FullName', profilePhoto: '$userDetails.profilePhoto', isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } } },
                                isLiked: { $in: [req.userId, { $ifNull: ["$communityLikes.users", []] }] },
                                // comments : { $cond : { if : { $isArray :'$comments' } , then : '$comments' , else : []}} , 
                                commentCounts: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } },
                                likes: { $cond: { if: { $isArray: '$communityLikes.users' }, then: { $size: '$communityLikes.users' }, else: 0 } },
                                views: { $cond: { if: { $isArray: '$communityViews.users' }, then: { $size: '$communityViews.users' }, else: 0 } }
                            }
                        }
                    ],
                    totalCounts: [
                        { $match: { isActive: true, batch: mongoose.Types.ObjectId(batchId), user: mongoose.Types.ObjectId(req.userId) } },
                        { $group: { _id: null, count: { $sum: 1 } } },
                        { $replaceWith: { count: "$count" } },
                        { $project: { _id: 0, count: 1 } }
                    ]
                }
            },
            {
                $project: {
                    communities: 1,
                    totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
                }
            }

        ])

        return res.json({
            status: true,
            data: {
                totalCounts: communities[0]?.totalCounts ?? 0,
                communities: communities[0]?.communities?.map((item) => {
                    return {
                        ...item,
                        createdAt: moment(item?.createdAt).fromNow(),
                        "isMyCommunity": req.userId.equals(item?.user?._id),
                    }
                })
            } ?? { communities: [], totalCounts: 0 },
            msg: `Communities fetch successfully`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/reportCommunity", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchCommunityId, reason } = req.body;
        if (['', null, undefined].includes(reason)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required reason'
            })
        }
        const isBatchCommunity = await BatchCommunity.findOne({ _id: batchCommunityId });
        if (!isBatchCommunity) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Doubt not exists`
            })
        }
        let isBatchReport = await BatchCommunityReport.findOne({ batchDoubt: isBatchCommunity?._id, user: req.userId });
        if (isBatchReport) {
            return res.json({
                status: false,
                data: null,
                msg: 'Already reported'
            })
        }
        await BatchCommunityReport.create({ batchCommunity: isBatchCommunity?._id, user: req.userId, reason: reason });
        return res.json({
            status: true,
            data: null,
            msg: 'Community reported successfully'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getCommunity", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchCommunityId } = req.query;
        const userId = mongoose.Types.ObjectId(req.userId);
        let isBatchCommunityView = await BatchCommunityView.findOne({ batchCommunity: batchCommunityId });

        if (!isBatchCommunityView) {
            isBatchCommunityView = await BatchCommunityView.create({ batchCommunity: batchCommunityId, users: [] })
        }
        if (!isBatchCommunityView?.users?.includes(userId)) {
            await BatchCommunityView.updateOne({ _id: isBatchCommunityView?._id }, { $push: { users: userId } });
            //    isLiked = true ;
        }

        const community = await BatchCommunity.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(batchCommunityId), isActive: true }
            },
            {
                $lookup: {
                    from: 'userstables',
                    foreignField: '_id',
                    localField: 'user',
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: '$userDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'batchcommunitylikes',
                    foreignField: 'batchCommunity',
                    localField: '_id',
                    as: 'communityLikes'
                }
            },
            {
                $unwind: {
                    path: '$communityLikes',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'batchcommunityviews',
                    foreignField: 'batchCommunity',
                    localField: '_id',
                    as: 'communityViews'
                }
            },
            {
                $unwind: {
                    path: '$communityViews',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    desc: 1,
                    problemImage: 1,
                    createdAt: 1,
                    isLiked: { $in: [req.userId, { $ifNull: ["$communityLikes.users", []] }] },

                    // comments : { $cond : { if : { $isArray :'$comments' } , then : '$comments' , else : []}} , 
                    user: { _id: "$userDetails._id", name: '$userDetails.FullName', profilePhoto: '$userDetails.profilePhoto', isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } } },
                    likes: { $cond: { if: { $isArray: '$communityLikes.users' }, then: { $size: '$communityLikes.users' }, else: 0 } },
                    views: { $cond: { if: { $isArray: '$communityViews.users' }, then: { $size: '$communityViews.users' }, else: 0 } }
                }
            },
        ])

        return res.json({
            status: true,
            data: { ...community[0], createdAt: moment(community[0]?.createdAt).fromNow(), 'isMyCommunity': req.userId.equals(community[0]?.user?._id), },
            msg: 'community details fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getCommunityComments", ValidateTokenForUser, async (req, res) => {
    try {
        let { batchCommunityId, page, pageSize } = req.query;
        if (!batchCommunityId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Community Id required'
            })
        }
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 15;
        const commentsWithReplies = await BatchCommunityComment.aggregate([
            {
                $facet: {
                    comments: [
                        {
                            $match: { batchCommunity: mongoose.Types.ObjectId(batchCommunityId), isActive: true } // Assuming 'blog' is an ObjectId
                        },
                        { $skip: (page - 1) * pageSize },
                        { $limit: pageSize },
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
                                from: 'batchcommunitycommentreplies',
                                let: { commentId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ['$commentId', '$$commentId']
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
                                            //   _id: 1,
                                            id: '$_id',
                                            cmntsMsg: '$msg',
                                            createdAt: 1,
                                            user: {
                                                _id: '$replyUserDetails._id',
                                                name: '$replyUserDetails.FullName',
                                                profilePhoto: '$replyUserDetails.profilePhoto',
                                                isVerified: { $cond: { if: { $ifNull: ['$replyUserDetails.isVerified', false] }, then: '$replyUserDetails.isVerified', else: false } }
                                            },
                                        }
                                    },
                                ],
                                as: 'replies'
                            }
                        },
                        {
                            $project: {
                                id: '$_id',
                                cmntsMsg: '$msg',
                                isPin: 1,
                                createdAt: 1,
                                image: 1,
                                user: {
                                    _id: '$userDetails._id',
                                    name: '$userDetails.FullName',
                                    profilePhoto: '$userDetails.profilePhoto',
                                    isVerified: { $cond: { if: { $ifNull: ['$userDetails.isVerified', false] }, then: '$userDetails.isVerified', else: false } }
                                },
                                replies: 1
                            }
                        },
                        { $sort: { createdAt: -1 } }
                    ],
                    totalCounts: [
                        { $match: { batchCommunity: mongoose.Types.ObjectId(batchCommunityId), isActive: true } },
                        { $group: { _id: null, count: { $sum: 1 } } },
                    ]
                }
            },
            {
                $project: {
                    comments: 1,
                    totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

                }
            }

        ]);
        const response = {
            batchCommunityId: batchCommunityId ?? "",
            comments: {
                count: `${commentsWithReplies[0]?.totalCounts?.count ?? 0}`,
                commentList: commentsWithReplies[0].comments.map((item) => {
                    return {
                        commentId: item?._id ?? "",
                        isMyComment: req.userId.equals(item?.user?._id),
                        user: { name: item?.user?.name ?? "", profilePhoto: item?.user?.profilePhoto ?? "", isVerified: item?.user?.isVerified ?? false },
                        cmntsMsg: item?.cmntsMsg ?? "",
                        image: item?.image ?? "",
                        createdAt: moment(item?.createdAt).fromNow() ?? "",
                        replies: item?.replies?.map((item2) => {
                            return {
                                replyId: item2?._id ?? "",
                                isMyReplyComment: req.userId.equals(item2?.user?._id),
                                user: { name: item2?.user?.name ?? "", profilePhoto: item2?.user?.profilePhoto ?? "", isVerified: item2?.user?.isVerified ?? false },
                                cmntsMsg: item2?.cmntsMsg ?? "",
                                createdAt: moment(item2?.createdAt).fromNow() ?? "",
                            }
                        })
                    }
                })
            },
        }
        return res.json({
            status: true,
            data: { batchCommunityId: batchCommunityId, comments: response?.comments?.commentList, totalCounts: commentsWithReplies[0]?.totalCounts?.count ?? 0 },
            msg: "blog fetched",
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.post("/replyToComments", ValidateTokenForUser, async (req, res) => {
    const { commentId, msg, } = req.body;
    if (!commentId || !msg) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId & msg & replyTo`
        })
    }
    try {
        const user = await UserTable.findOne({ _id: req.userId }).select('_id FullName profilePhoto isVerified')
        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isComment = await BatchCommunityComment.findOne({ _id: commentId });
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'comment not exists'
            })
        }
        const newReply = new BatchCommunityCommentReply({
            commentId: commentId,
            user: req.userId,
            msg: msg,
        })
        const saveReply = await newReply.save();
        return res.json({
            status: true,
            data: {
                "replyId": saveReply?._id,
                "user": {
                    "name": user?.FullName ?? "",
                    "profilePhoto": user?.profilePhoto ?? "",
                    isVerified: user?.isVerified ?? false,
                },
                "cmntsMsg": msg,
                "createdAt": moment(saveReply?.createdAt).fromNow(),
                "isMyReplyComment": true
            },
            msg: "New reply added to comment"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

// delete comments
userRoutes.delete("/deleteComment", ValidateTokenForUser, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {
        const user = await UserTable.findOne({ _id: req.userId });
        if (user?.email.includes('@sdempire.co.in')) {
            await BatchCommunityComment.findByIdAndDelete(commentId);
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })
        } else {
            const comment = await BatchCommunityComment.findOneAndDelete({ user: user?._id, _id: commentId });
            await BatchCommunityCommentReply.deleteMany({ commentId: commentId })
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
            msg: error.message,
        })
    }
})
// delete Reply
userRoutes.delete("/deleteReplyComment", ValidateTokenForUser, async (req, res) => {
    const { replyCommentId } = req.query;
    if (!replyCommentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required replyCommentId`
        })
    }
    try {
        const user = await UserTable.findOne({ _id: req.userId })
        if (user?.email.includes('@sdempire.co.in')) {
            // console.log('admin');
            await BatchCommunityCommentReply.findByIdAndDelete(replyCommentId);
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })
        } else {
            const reply = await BatchCommunityCommentReply.findOneAndDelete({ _id: replyCommentId, user: user?._id });
            if (reply) {
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
            msg: error.message,
        })
    }
})


userRoutes.put("/editCommunity", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    try {
        const { desc, batchCommunityId, problemImage } = req.body;
        if (!desc) {
            return res.json({
                status: false,
                data: null,
                msg: 'Message required'
            })
        }
        let isBadMsg = await badWordCheck(desc);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const user = await UserTable.findOne({ _id: req.userId }).select('FullName profilePhoto isVerified');

        const isBatchCommunity = await BatchCommunity.findOne({ _id: batchCommunityId, user: user?._id }).populate('batch', 'batch_name');
        if (!isBatchCommunity) {
            return res.json({
                status: false,
                data: null,
                msg: 'This community not exist.'
            })
        }


        let fileLoc = problemImage;
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchCommunity/${isBatchCommunity?.batch_name?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        let isActive = isBatchCommunity?.problemImage == fileLoc ? isBatchCommunity?.isActive : user?.isVerified == true ? true : fileLoc == "" ? true : false;

        const community = await BatchCommunity.findOneAndUpdate(
            { _id: isBatchCommunity?._id },
            {
                desc,
                problemImage: fileLoc,
                isActive: isActive,
                // isActive: user?.isVerified == true ? true : fileLoc === isBatchCommunity?.problemImage ? isBatchCommunity?.isActive : fileLoc != "" ? false : true
            }, { new: true, lean: true })

        const isLiked = await BatchCommunityLike.findOne({ batchCommunity: isBatchCommunity?._id, users: { $in: user?._id } });
        const views = await BatchCommunityView.findOne({ batchCommunity: batchCommunityId });


        return res.json({
            status: true,
            data: community?.isActive == true ? {
                "user": {
                    "name": user?.FullName ?? "",
                    "profilePhoto": user?.profilePhoto ?? "",
                    isVerified: user?.isVerified ?? false,

                },
                desc,
                "problemImage": community?.problemImage,
                "createdAt": moment(community.createdAt).fromNow(),
                "id": community?._id,
                "isLiked": isLiked ? true : false,
                // "comments": [],
                "likes": 0,
                "views": views?.users?.length ?? 0,
                "isMyCommunity": true,
            } : {},
            msg: 'Community created successfully'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.put("/editReplyComment", ValidateTokenForUser, async (req, res) => {
    const { replyCommentId, msg, } = req.body;
    if (!replyCommentId || !msg) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Reply CommentId & msg`
        })
    }
    try {

        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }
        const isReplyComment = await BatchCommunityCommentReply.findOne({ _id: replyCommentId }).populate('user', '_id FullName profilePhoto isVerified');
        if (!isReplyComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        if (!req.userId.equals(isReplyComment?.user?._id)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not authorized to edit'
            })
        }
        const newReply = await BatchCommunityCommentReply.findOneAndUpdate({ _id: replyCommentId }, { msg: msg }, { new: true, lean: true })

        return res.json({
            status: true,
            data: {
                "replyId": newReply?._id,
                "user": {
                    "name": isReplyComment?.user?.FullName ?? "",
                    "profilePhoto": isReplyComment?.user?.profilePhoto ?? "",
                    isVerified: isReplyComment?.user?.isVerified ?? false,

                },
                "cmntsMsg": newReply?.msg ?? "",
                "isMyReplyComment": true,
                "createdAt": moment(newReply?.createdAt).fromNow()
            },
            msg: "Reply comment edited"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

userRoutes.put("/editComment", upload.single('file'), ValidateTokenForUser, async (req, res) => {
    const { commentId, msg, image } = req.body;
    if (!commentId || !msg) {
        return res.json({
            status: false,
            data: null,
            msg: `Required CommentId & msg`
        })
    }
    try {

        let isBadMsg = await badWordCheck(msg);
        if (isBadMsg) {
            return res.json({
                status: false,
                data: null,
                msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
            })
        }

        const isComment = await BatchCommunityComment.findOne({ _id: commentId }).populate('user', '_id FullName profilePhoto isVerified');
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        let fileLoc = image ?? "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batchCommunity/comments/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        if (!req.userId.equals(isComment?.user?._id)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not authorized to edit'
            })
        }
        let isActive = isComment?.image == fileLoc ? isComment?.isActive : isComment?.user?.isVerified == true ? true : fileLoc == "" ? true : false;
        const newComment = await BatchCommunityComment.findOneAndUpdate({ _id: commentId }, { msg: msg, image: fileLoc, isActive: isActive }, { new: true, lean: true })
        return res.json({
            status: true,
            data: newComment?.isActive == true ? {
                "commentId": newComment?._id,
                "user": {
                    "name": isComment?.user?.FullName ?? "",
                    "profilePhoto": isComment?.user?.profilePhoto ?? "",
                    isVerified: isComment?.user?.isVerified ?? false,

                },
                image: fileLoc ?? "",
                "isMyComment": true,
                "cmntsMsg": newComment?.msg ?? "",
                "createdAt": moment(newComment?.createdAt).fromNow()
            } : {},
            msg: "Comment edited"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

userRoutes.post("/reportComment", ValidateTokenForUser, async (req, res) => {
    const { commentId, reason } = req.body;
    if (!commentId || !reason) {
        return res.json({
            status: false,
            data: null,
            msg: `Required CommentId & reason`
        })
    }
    try {
        const isComment = await BatchCommunityComment.findOne({ _id: commentId }).select('_id');
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        const isReported = await BatchCommunityCommentReport.findOne({ batchCommunityComment: commentId, user: req.userId });
        if (isReported) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment already reported'
            })
        }

        await BatchCommunityCommentReport.create({ batchCommunityComment: commentId, reason: reason, user: req.userId })
        return res.json({
            status: true,
            data: null,
            msg: "Comment reported"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})
userRoutes.post("/reportReplyComment", ValidateTokenForUser, async (req, res) => {
    const { replyCommentId, reason } = req.body;
    if (!replyCommentId || !reason) {
        return res.json({
            status: false,
            data: null,
            msg: `Required replyCommentId & reason`
        })
    }
    try {


        const isReplyComment = await BatchCommunityCommentReply.findOne({ _id: replyCommentId }).select('_id');
        if (!isReplyComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        const isReported = await BatchCommunityCommentReplyReport.findOne({ batchCommunityCommentReply: replyCommentId, user: req.userId });
        if (isReported) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment already reported'
            })
        }

        await BatchCommunityCommentReplyReport.create({ batchCommunityCommentReply: replyCommentId, reason: reason, user: req.userId })
        return res.json({
            status: true,
            data: null,
            msg: "Comment reported"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

// delete Community 
userRoutes.delete("/deleteCommunity", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchCommunityId } = req.query;
        if (!batchCommunityId) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Community Id required`
            })
        }
        const community = await BatchCommunity.findOneAndDelete({ _id: batchCommunityId, user: req.userId });
        if (!community) {
            return res.json({
                status: false,
                data: null,
                msg: 'Community not found'
            })
        }
        const comments = await BatchCommunityComment.find({ batchCommunity: community?._id }).select("_id");
        let commentIds = comments.map((item) => { return item?._id });
        await BatchCommunityComment.deleteMany({ _id: { $in: commentIds } });
        await BatchCommunityCommentReply.deleteMany({ commentId: { $in: commentIds } });
        return res.json({
            status: true,
            data: null,
            msg: 'Community deleted successfully'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


userRoutes.post("/reportDoubtComment", ValidateTokenForUser, async (req, res) => {
    const { commentId, reason } = req.body;
    if (!commentId || !reason) {
        return res.json({
            status: false,
            data: null,
            msg: `Required CommentId & reason`
        })
    }
    try {
        const isComment = await BatchDoubtComment.findOne({ _id: commentId }).select('_id');
        if (!isComment) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment not exists'
            })
        }
        const isReported = await BatchDoubtCommentReport.findOne({ batchDoubtComment: commentId, user: req.userId });
        if (isReported) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment already reported'
            })
        }

        await BatchDoubtCommentReport.create({ batchDoubtComment: commentId, reason: reason, user: req.userId })
        return res.json({
            status: true,
            data: null,
            msg: "Comment reported"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

userRoutes.get("/getPlanner", ValidateTokenForUser, async (req, res) => {
    try {
        const { batchId } = req.query;
        const batch = await BatchesTable.findOne({ _id: batchId }).select('_id planner')
        if (!batch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch not found'
            })
        }
        return res.json({
            status: true,
            data: { planner: batch?.planner },
            message: 'Planer fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getBatchPlan", async (req, res) => {
    const { batchId, batchSlug } = req.query;
    try {
        let query = { is_active: true };
        if (batchId) {
            query._id = batchId;
        } else {
            query.slug = batchSlug;
        }

        const isBatch = await BatchesTable.findOne({ ...query }).select('_id');
        if (!isBatch) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch not found'
            })
        }
        const batchValidities = await ValidityTable.find({ batch: isBatch?._id, isActive: true }).sort({ month: 1 });
        const allFeatures = await ValidityFeatureTable.find({ batch: isBatch?._id, isActive: true });
        let response = [];
        for (let validity of batchValidities) {
            let obj = {
                validityId: validity?._id ?? "",
                name: validity?.name ?? "",
                isRecommended: validity?.isRecommended ?? false,
                month: validity?.month,
                salePrice: validity?.salePrice,
                regularPrice: validity?.regularPrice,
            }
            // if( validity?.isActive == true ){
            let features = [];
            for (let feature of allFeatures) {
                let featureObj = {
                    // featureId : feature?._id , 
                    featureName: feature?.name,
                    info: feature?.info,
                    isEnable: false
                }
                // console.log(validity?.features);
                // console.log(typeof validity?.features[0]); 
                // console.log( feature?._id ); 
                // console.log(typeof feature?._id );
                // console.log(validity?.features.includes(feature?._id));

                // console.log(validity?.features.some(item => item?._id?.toString() === feature?._id?.toString()));
                if (validity?.features.includes(feature?._id)) {
                    featureObj.isEnable = true;
                }
                features.push(featureObj);
                // }
                obj.features = features;

            }
            response.push(obj);

        }
        // console.log( response.length);
        return res.json({
            status: true,
            data: response,
            msg: 'All plan fetch successfully.'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})



userRoutes.post("/verifyCoupon", ValidateTokenForUser, async (req, res) => {
    try {
        const { couponCode, link, linkWith, from } = req.body;
        if (!linkWith || !couponCode || !['batch', 'product', 'testSeries'].includes(link)) {
            return res.json({
                status: false,
                data: null,
                msg: "Provide required parameters"
            });
        }
        const current = moment().add(5, 'hours').add(30, 'minutes').toDate();
        // console.log(current);
        const coupon = await couponTable.findOne({ couponCode, is_active: true, expirationDate: { $gt: current } });
        if (!coupon) {
            return res.json({
                status: false,
                data: null,
                msg: "Invalid Coupon Code"
            })
        }
        // for specfic user --> pending 
        if (req.userId.equals(coupon?.student) && coupon.count > 0) {
            // console.log(true);
            // console.log(coupon);
            return res.json({
                status: true,
                data: {
                    id: coupon._id,
                    couponCode: coupon.couponCode,
                    couponType: coupon.couponType,
                    couponValue: coupon.couponValue,
                    is_active: coupon.is_active,
                },
                msg: "Coupon Applied",
            });
        }
        if (link === 'product') {
            const verifyCpn = await couponTable.findOne({ couponCode: coupon.couponCode, link: 'product' })
            if ((coupon?.linkWith == 'all' || coupon?.linkWiths[0] == 'all') && verifyCpn != null) {
                if (couponCode != "" && ["OFFER5", "OFFER10", "OFFER15"]?.includes(couponCode)) {
                    const carts = await storeCartTable.findOne({ user: req.userId }).populate({
                        path: 'products.productId',
                        select: "_id regularPrice salePrice"
                    })
                    let productsAmount = carts?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);
                    productsAmount = parseFloat(productsAmount)
                    // console.log(productsAmount);
                    if (productsAmount < 700 && couponCode == "OFFER15" && coupon?.couponType == "percentage") {
                        return res.json({
                            status: false,
                            data: null,
                            msg: `Invalid Coupon Code`
                        })
                    }
                    if (productsAmount < 400 && ["OFFER10", "OFFER15"]?.includes(couponCode) && coupon?.couponType == "percentage") {
                        return res.json({
                            status: false,
                            data: null,
                            msg: `Invalid Coupon Code`
                        })
                    }
                    // console.log(couponCode);
                    if (productsAmount < 200 && ["OFFER5", "OFFER10", "OFFER15"]?.includes(couponCode) && coupon?.couponType == "percentage") {
                        return res.json({
                            status: false,
                            data: null,
                            msg: `Invalid Coupon Code`
                        })
                    }

                }

                else {
                    return res.json({
                        status: true,
                        data: {
                            id: coupon._id,
                            couponCode: coupon.couponCode,
                            couponType: coupon.couponType,
                            couponValue: coupon.couponValue,
                            is_active: coupon.is_active,
                        },
                        msg: "Coupon Applied",
                    });
                }
                return res.json({
                    status: true,
                    data: {
                        id: coupon._id,
                        couponCode: coupon.couponCode,
                        couponType: coupon.couponType,
                        couponValue: coupon.couponValue,
                        is_active: coupon.is_active,
                    },
                    msg: "Coupon Applied",
                });
            }

            if (coupon?.link == 'productCategory') {
                const findProduct = await storeProductTable.find({
                    categories: { $in: coupon?.linkWiths }
                })
                const productIds = findProduct?.map((item) => item._id.toString())
                if (isSubSet(productIds, linkWith)) {
                    return res.json({
                        status: true,
                        data: {
                            id: coupon._id,
                            couponCode: coupon.couponCode,
                            couponType: coupon.couponType,
                            couponValue: coupon.couponValue,
                            is_active: coupon.is_active,
                        },
                        msg: "Coupon Applied",
                    });
                }

            }
            if (linkWith.length == 1 && coupon?.linkWiths[0]?.toString() == linkWith[0]?.toString()) {
                // if ( linkWith.length == 1 && coupon?.linkWith == linkWith[0] ){
                return res.json({
                    status: true,
                    data: {
                        id: coupon._id,
                        couponCode: coupon.couponCode,
                        couponType: coupon.couponType,
                        couponValue: coupon.couponValue,
                        is_active: coupon.is_active,
                    },
                    msg: "Coupon Applied",
                });
                // }
            }
            return res.json({
                status: false,
                data: null,
                msg: "Invalid coupon"
            })
        }
        if (link === 'batch') {
            if (coupon?.linkWiths[0] == 'all') {
                return res.json({
                    status: true,
                    data: {
                        id: coupon._id,
                        couponCode: coupon.couponCode,
                        couponType: coupon.couponType,
                        couponValue: coupon.couponValue,
                        is_active: coupon.is_active,
                    },
                    msg: "Coupon Applied",
                });
            }

            if (coupon?.linkWiths?.includes(linkWith)) {
                const batch = await BatchesTable.findOne({ _id: linkWith, is_active: true });
                if (!batch) {
                    return res.json({
                        status: false,
                        data: null,
                        msg: "Invalid Coupon Code"
                    })
                }
                return res.json({
                    status: true,
                    data: {
                        id: coupon._id,
                        couponCode: coupon.couponCode,
                        couponType: coupon.couponType,
                        couponValue: coupon.couponValue,
                        is_active: coupon.is_active,
                    },
                    msg: "Coupon Applied",
                });
            }
            if (coupon?.link === 'category') {
                // find category 
                // console.log('category coupon')
                // if multiple array exist with coupon Code 

                const category = await categoryTable.findOne({ _id: { $in: coupon?.linkWiths } });
                if (category.length == 0) {
                    return res.json({
                        status: false,
                        data: null,
                        msg: "Invalid Coupon Code"
                    })
                }
                // console.log(category);
                //  find Batch 
                const batchByCategory = await BatchesTable.findOne({ _id: linkWith, category: { $in: coupon?.linkWiths } });
                if (!batchByCategory) {
                    return res.json({
                        status: false,
                        data: null,
                        msg: "Invalid Coupon Code"
                    })
                }
                // console.log(batchByCategory)
                let condition = typeof linkWith === 'object' ? batchByCategory?._id?.toString() == linkWith[0] : batchByCategory?._id?.toString() == linkWith
                if (condition) {
                    return res.json({
                        status: true,
                        data: {
                            id: coupon._id,
                            couponCode: coupon.couponCode,
                            couponType: coupon.couponType,
                            couponValue: coupon.couponValue,
                            is_active: coupon.is_active,
                        },
                        msg: "Coupon Applied",
                    });

                }
                return res.json({
                    status: false,
                    data: null,
                    msg: "Invalid Coupon Code"
                })
            }
            return res.json({
                status: false,
                data: null,
                msg: "Invalid Coupon Code"
            })

        }
        // for test teseries
        if (link === 'testSeries') {
            if (coupon?.linkWiths?.includes(linkWith)) {
                return res.json({
                    status: true,
                    data: {
                        id: coupon._id,
                        couponCode: coupon.couponCode,
                        couponType: coupon.couponType,
                        couponValue: coupon.couponValue,
                        is_active: coupon.is_active,
                    },
                    msg: "Coupon Applied",
                });
            } else {
                return res.json({
                    status: false,
                    data: null,
                    msg: "Invalid Coupon Code"
                })
            }
        }
        return res.json({
            status: false,
            data: null,
            msg: "Invalid Coupon Code"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
});

userRoutes.get("/needHelp", ValidateTokenForUser, async (req, res) => {
    try {
        // console.log(helps);
        return res.json({
            status: true,
            data: { needHelp: helps, videos },
            msg: `Need help data fetched.`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/getResultBanner", async (req, res) => {
    try {
        const { category, year } = req.query;
        let query = {
            isActive: true
        }
        if (category) {
            const isCategory = await categoryTable.findOne({ _id: category });
            if (isCategory) {
                query.category = category;
            }

        }
        if (year) {
            query.year = parseInt(year) || parseInt(moment().year())
        }
        const banners = await resultBannerTable.find({ ...query }).sort({ createdAt: -1 });
        return res.json({
            status: true,
            data: banners?.map((item) => {
                return {
                    title: item?.title,
                    banner: item?.banner
                }
            }),

            msg: 'All result banner fetched.'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

userRoutes.get("/successStories", async (req, res) => {
    try {
        const { category, year } = req.query;
        let query = {
            isActive: true
        }
        if (category) {
            const isCategory = await categoryTable.findOne({ _id: category });
            if (isCategory) {
                query.category = category;
            }

        }
        if (year) {
            query.year = parseInt(year) || parseInt(moment().year())
        }
        const stories = await SuccessStoryTable.find({ ...query }).sort({ createdAt: -1 }).populate('category', '_id title').populate('user', '_id FullName profilePhoto');
        return res.json({
            status: true,
            data: stories?.map((item) => {
                return {
                    desc: item?.desc,
                    resultInfo: item?.resultInfo,
                    url: item?.url ?? "",
                    user: { name: item?.user?.FullName ?? "", profile: item?.user?.profilePhoto ?? "" },
                    category: item?.category?.title ?? "",

                }
            }),

            msg: 'All result story fetched.'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})
module.exports = userRoutes