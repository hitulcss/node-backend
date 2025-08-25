const express = require('express');
const { isAdmin } = require('../middleware/authenticateToken');
const jwt = require('jsonwebtoken');
const path = require('path')
const XLSX = require('xlsx');
const xlsjs = require("xlsjs");
const { findAdminTeacherUsingUserId } = require('../HelperFunctions/adminTeacherFunctions');
const { ValidityTable } = require('../models/Validity');
const { BatchesTable } = require('../models/BatchesSchema');
const { categoryTable } = require('../models/category');
const { ParentNotificationTable } = require('../models/parentNotification');
const { ParentMeetingTable } = require('../models/ParentMeeting');
const { LectureTable } = require('../models/addLecture');
const multer = require('multer');
const { LectureResourceTable } = require('../models/lectureResources');
const { uploadFile } = require('../aws/UploadFile');
const adminRoute = express.Router();
const moment = require('moment');
const { adminTeacherTable } = require('../models/adminTeacherModel');
const { genrateDeepLink } = require('../HelperFunctions/genrateDeepLink');
const { sendBulkPushNotifications } = require('../firebaseService/fcmService');
const { QuizTable } = require('../models/Quiz');
const { UserTable } = require('../models/userModel');
const { roomCreation } = require('../HelperFunctions/roomCreation');
const { SubjectTable } = require('../models/Subject');
const { generateSlugForCommonName } = require('../HelperFunctions/genrateSlugForCommonName');
const { getFcmTokenArrByUserIdArr } = require('../HelperFunctions/userFunctions');
const { QuizQuestionsTable } = require('../models/Quiz_question');
const { QuizResponseTable } = require('../models/QuizResponse');
const { leaderBoardTable } = require('../models/leaderboard');
const { BatchCommunity } = require('../models/BatchCommunity');
const { BatchFeature } = require('../models/BatchFeature');
const { BatchCommunityComment } = require('../models/BatchCommunityComment');
const { BatchCommunityCommentReply } = require('../models/BatchCommunityCommentReply');
const { BatchDoubtComment } = require('../models/BatchDoubtComment');
const { BatchDoubt } = require('../models/BatchDoubt');
const { sendCustomNotification } = require('../HelperFunctions/sendCustomNotification');
const { subCategoryTable } = require('../models/subCategory');
const { ValidityFeatureTable } = require('../models/ValidityFeature');
const { NotesTable } = require('../models/Notes');
const { SuccessStoryTable } = require('../models/SuccessStory');
const { resultBannerTable } = require('../models/ResultBanner');
const { courseOrdesTable } = require('../models/courseOrder');
const { ctaTable } = require('../models/CTA');
const { ctaBannerTable } = require('../models/ctaBanner');
const { QuizQuestionSection } = require('../models/QuizQuestionSection');
const momentTimeZone = require("moment-timezone");



const upload = multer({ dest: 'uploads/adminSection' })

const fileDetails = (file, fileLoc) => {
    const filename = (file.originalname.split(".")[0]).replace(/\s+/g, '_');
    return {
        fileLoc: fileLoc,
        fileName: filename,
        fileSize: `${(file.size / 1000000).toFixed(2)} MB`,
    };
};



adminRoute.post("/createValidity", isAdmin, async (req, res) => {
    try {
        const { name, month, batch, salePrice, regularPrice, isActive, features, isRecommended } = req.body;
        // console.log(req.body);
        if ((!name || !month || month < 0) || ![true, false].includes(isActive) || ![true, false].includes(isRecommended) || !batch || !salePrice || !regularPrice || salePrice < 0 || regularPrice < 0 || salePrice > regularPrice || features.length <= 0) {
            return res.json({
                status: false,
                data: null,
                msg: `Provide information is not valid`
            })
        }
        const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Admin not found`
            })
        }
        // first check this validity not exist for this month and same batch
        const isExist = await ValidityTable.findOne({ batch: batch, month: month });
        if (isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `This Validity for batch already exist`
            })
        }
        const isRecommendedExist = await ValidityTable.find({ isRecommended: true, batch: batch });
        if (isRecommended == true && isRecommendedExist?.length == 1) {
            return res.json({
                status: false,
                data: null,
                msg: `Already recommended validity exist.`
            })
        }
        await ValidityTable.create({ admin: admin?._id, name: name, month, batch: batch, salePrice, regularPrice, isActive, features: features, isRecommended: isRecommended });
        return res.json({
            status: true,
            data: null,
            msg: `Validity Created`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getValidityOfBatch/:batchId", isAdmin, async (req, res) => {
    try {
        const { batchId } = req.params;
        if (!batchId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required batchId'
            })
        }
        const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Admin not found`
            })
        }
        const validities = await ValidityTable.find({ batch: batchId }).populate('features', '_id name');
        return res.json({
            status: true,
            data: validities?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    label: item?.month,
                    value: item?._id,
                    month: item?.month,
                    salePrice: item?.salePrice,
                    regularPrice: item?.regularPrice,
                    isActive: item?.isActive,
                    isRecommended: item?.isRecommended ?? false,
                    features: item?.features?.reduce((acc, curr, index) => (index != item?.features.length ? acc + curr?.name + " , " : acc + curr?.name), '')
                }
            }),
            msg: 'Validities fetched for batch'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/updateValidity", isAdmin, async (req, res) => {
    try {
        const { id, month, salePrice, regularPrice, isActive } = req.body;
        const isValidity = await ValidityTable.findOne({ _id: id });
        if (!isValidity) {
            return res.json({
                status: false,
                data: null,
                msg: `Validity not exist`
            })
        }
        if (!month || !salePrice || !regularPrice || ![true, false]?.includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required Month , Sale Price , Regular Price , status`
            })
        }
        if (parseInt(salePrice) > parseInt(regularPrice)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Sale Price should less than Regular Price'
            })
        }
        const isExist = await ValidityTable.findOne({ _id: { $ne: id }, batch: isValidity.batch, month: month });
        if (isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `This Validity already exist`
            })
        }
        await ValidityTable.findOneAndUpdate({ _id: id }, { month, salePrice, regularPrice, isActive });
        return res.json({
            status: true,
            data: null,
            msg: `Validity Update`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createParentNotification", isAdmin, async (req, res) => {
    try {
        const { title, description, link, linkWith, isActive } = req.body;
        if (!title || !description || !['batch', 'category', 'none'].includes(link) || !linkWith, ![true, false].includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required title description link linkWith , status.`
            })
        }
        if (link == 'batch') {
            const isBatch = await BatchesTable.findOne({ _id: linkWith });
            if (!isBatch) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Batch not found with this linkWith'
                })
            }
        } else if (link == 'category') {
            const isCategory = await categoryTable.findOne({ _id: linkWith });
            if (!isCategory) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Category not found with this linkWith'
                })
            }
        } else {
            if (linkWith != 'all') {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Select link With'
                })
            }
        }
        await ParentNotificationTable.create({ title, description, link, linkWith, isActive });
        return res.json({
            status: true,
            data: null,
            msg: 'Notification created'
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createParentMeeting", upload.single('file'), isAdmin, async (req, res) => {
    try {
        const { title, description, meetingLink, startTime, endTime, link, linkWith, isActive } = req.body;
        // console.log(req.body);
        if (!title || !description || !['batch', 'category', 'none'].includes(link) || !linkWith || ![true, false, 'true', 'false'].includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required title description link linkWith , status.`
            })
        }
        if (link == 'batch') {
            const isBatch = await BatchesTable.findOne({ _id: linkWith });
            if (!isBatch) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Batch not found with this linkWith'
                })
            }
        } else if (link == 'category') {
            const isCategory = await categoryTable.findOne({ _id: linkWith });
            if (!isCategory) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Category not found with this linkWith'
                })
            }
        } else {
            if (linkWith != 'all') {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Select link With'
                })
            }
        }
        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `parentMeeting/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        } else {
            return res.json({
                status: false,
                data: null,
                msg: `Required Banner`
            })
        }
        await ParentMeetingTable.create({ title, meetingLink, banner: fileLoc, startTime: startTime, endTime: endTime, description, link, linkWith, isActive });
        return res.json({
            status: true,
            data: null,
            msg: 'Meeting created'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/postLectureResourceForMultipleBatches", upload.single('file'), isAdmin, async (req, res) => {
    try {
        const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Admin not found`
            })
        }
        let { lectures, title, is_active, resurce_type, language, link, is_Verified } = req.body;
        lectures = lectures.filter((item) => item != "");
        // batchIds = batchIds.filter((item) => item != "") ;
        if (resurce_type == "pdf" || resurce_type == "video" || resurce_type == "DPP") {
            if (req.file) {
                const helperString = Math.floor(Date.now() / 1000);
                const filename = (req.file.originalname.split(".")[0]).replace(/\s+/g, '_');
                const extension = "." + req.file.originalname.split(".").pop();
                FileUploadLocation = `lectureResource/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
                let fileLocHelper = await uploadFile(
                    req.file.path,
                    FileUploadLocation
                );
                fileLoc = fileDetails(req.file, fileLocHelper);
            }
        } else {
            fileLoc = {
                fileLoc: link,
                fileName: "",
                fileSize: "",
            };
        }
        let formatedDate = moment().add(5, "hours").add(30, "minutes").format('DD-MM-YYYY HH:mm:ss');


        for (let lectureId of lectures) {
            const lecture = await LectureTable.findOne({ _id: lectureId }).populate('batch', '_id banner student');
            const Lectureresource = new LectureResourceTable({
                user: admin._id,
                batch: lecture?.batch._id,
                lecture: lecture._id,
                title: title,
                created_at: formatedDate,
                language: language,
                is_active: is_active,
                resourceType: resurce_type,
                is_Verified: is_Verified,
                upload_file: fileLoc,
            });
            const saveLectureRes = await Lectureresource.save();
        }
        return res.json({
            status: true,
            data: null,
            msg: 'Resource added in lectures'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put(
    "/updateAllCommonLectureDetails",
    isAdmin,
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'file1', maxCount: 1 },
        { name: 'file3', maxCount: 1 },
    ]),
    async (req, res) => {
        try {

            const {
                lecture_type,
                lecture_title,
                batch_id,
                lectures,
                description,
                is_active,
                starting_date,
                ending_date,
                teacher,
                subject_id,
                link,
                language,
                LiveOrRecorded,
                isActive,
                socketUrl,
            } = req.body;
            // const { id } = req.params;
            const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
            const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
            if (!adminDetails) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Not an Admin'
                })
            }

            if (['', null, undefined, 'null', 'undefined'].includes(teacher) || ['', null, undefined, 'null', 'undefined'].includes(subject_id)) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Please Select Subject & Teacher'
                })

            }
            if (lecture_type == 'TWOWAY' && (['undefined', ''].includes(socketUrl) || LiveOrRecorded != "Live")) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Required Socket Url Or Lecture can not be recorded'
                })
            }
            if (lecture_type != 'TWOWAY' && ['undefined', '']?.includes(link)) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Required Link'
                })
            }
            let startingDate = moment(starting_date, 'DD-MM-YYYY HH:mm:ss').add(5, 'hours').add(30, 'minutes');
            let endingDate = moment(ending_date, 'DD-MM-YYYY HH:mm:ss').add(5, 'hours').add(30, 'minutes');

            const findSubject = await SubjectTable.findOne({
                _id: subject_id,
            });
            const findTeacher = await adminTeacherTable.findOne({
                _id: teacher
            })
            if (!findSubject || !findTeacher) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Subject Or Teacher not found'
                })
            }

            let FileUploadLocation;
            let fileLoc = "";
            if (req.files['file']) {
                const helperString = Math.floor(Date.now() / 1000);
                const filename = (req.files['file'][0].originalname.split(".")[0]).replace(/\s+/g, '_');
                const extension = "." + req.files['file'][0].originalname.split(".").pop();
                FileUploadLocation = `Lecture/${lecture_title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
                let fileLocHelper = await uploadFile(
                    req.files['file'][0].path,
                    FileUploadLocation
                );
                fileLoc = fileDetails(req.files['file'][0], fileLocHelper);
            }
            let fileLoc1 = "";
            if (req?.files['file1']) {
                const helperString = Math.floor(Date.now() / 1000);
                const filename = (req.files['file1'][0].originalname.split(".")[0]).replace(/\s+/g, '_');
                const extension = "." + req.files['file1'][0].originalname.split(".").pop();
                FileUploadLocation = `Lecture/${lecture_title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
                let fileLocHelper = await uploadFile(
                    req.files['file1'][0].path,
                    FileUploadLocation
                );
                fileLoc1 = fileDetails(req.files['file1'][0], fileLocHelper);
            }
            let lectureBanner = '';
            if (req.files['file3']) {
                let size = req.files['file3'].size / (1024);
                if (size > 100) {
                    return res.json({
                        status: false,
                        data: null,
                        msg: 'Maximum banner size 100KB allowed'
                    })
                }
                const helperString = Math.floor(Date.now() / 1000);
                const filename = (req.files['file3'][0].originalname.split(".")[0]).replace(/\s+/g, '_');
                const extension = "." + req.files['file3'][0].originalname.split(".").pop();
                FileUploadLocation = `lectureBanner/${lecture_title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
                let helperfileLoc = await uploadFile(req.files['file3'][0].path, FileUploadLocation);
                lectureBanner = helperfileLoc;
            }

            const allLectures = lectures?.filter((item) => item != "");
            // console.log(allLectures);
            for (let lecture of allLectures) {
                let FindLecture = await LectureTable.findOne({
                    _id: lecture,
                });
                let commonName = await generateSlugForCommonName(lecture_title + starting_date);

                await LectureTable.updateOne(
                    { _id: FindLecture?._id },
                    {
                        user_admin: adminDetails._id,
                        batch: FindLecture.batch,
                        lecture_title: lecture_title,
                        description: description,
                        is_active: is_active,
                        lecture_type: lecture_type,
                        starting_date: starting_date,
                        ending_date: ending_date,
                        startingDate,
                        endingDate,
                        material: fileLoc == "" ? FindLecture?.material : fileLoc,
                        dpp: fileLoc1 === "" ? FindLecture?.dpp : fileLoc1,
                        teacher: [findTeacher?._id],
                        subject: findSubject?._id,
                        link: lecture_type != "TWOWAY" ? link : "",
                        language: language,
                        LiveOrRecorded: LiveOrRecorded,
                        isActive,
                        socketUrl: socketUrl,
                        banner: lectureBanner != '' ? lectureBanner : FindLecture?.banner,
                        commonName,
                    }
                );
                // console.log(newLecture);
                if (lecture_type === 'TWOWAY') {
                    roomCreation(lecture?.batch, lecture?._id, lecture?.teacher[0], "old")
                }
            }
            res.json({
                status: true,
                data: null,
                msg: "updated the lecture  successfully",
            });
        } catch (error) {
            return res.json({
                status: false,
                data: null,
                msg: error.message
            })
        }
    }

);

adminRoute.post(
    "/addQuizForMultipleBatches",
    isAdmin,
    upload.single("file"),
    async (req, res) => {
        const {
            title,
            description,
            duration,
            language,
            no_ques,
            isNegative,
            negativeMarks,
            eachQueMarks,
            link,
            linkWith,
            isActive,
            created_at,
            resultType,
        } = req.body;
        try {
            const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
            const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
            if (created_at == 'null') {
                return res.json({
                    status: false,
                    data: null,
                    msg: `Required Starting Date & Time`
                })
            }
            if (link != "" && ['undefined', ""].includes(linkWith)) {
                return res.json({
                    status: false,
                    data: null,
                    msg: "Please Select link With also"
                })
            }

            let fileLoc = [];
            if (req.file) {
                const helperString = Math.floor(Date.now() / 1000);
                const filename = (req.file.originalname.split(".")[0]).replace(/\s+/g, '_');
                const extension = "." + req.file.originalname.split(".").pop();
                FileUploadLocation = `Quiz/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
                let helperfileLoc = await uploadFile(
                    req.file.path,
                    FileUploadLocation
                );
                fileLoc.push(helperfileLoc);
            }
            let batchIds = linkWith.filter((item) => item != "");
            for (let batchId of batchIds) {
                const quiz = new QuizTable({
                    user: adminDetails._id,
                    quiz_title: title,
                    quiz_banner: fileLoc,
                    quiz_desc: description,
                    quiz_duration: duration,
                    language: language,
                    no_ques: no_ques,
                    is_negative: isNegative,
                    link,
                    linkWith: batchId,
                    negativeMarks: negativeMarks,
                    eachQueMarks: eachQueMarks,
                    is_active: isActive,
                    result_type: resultType,
                    is_manual: resultType,
                    created_at

                });
                const result = await quiz.save();
                let link2 = `https://www.sdcampus.com?route=${`dailyQuizbyid`}&rootId=${result?._id}&childId=null`
                let details = {
                    "link": link2 ?? "",
                    "utmSource": "sdcampus_app",
                    "utmMedium": "refer",
                    "utmCampaign": "share_quiz",
                    "utmTerm": "",
                    "utmContent": "",
                    "socialTitle": title ?? "",
                    "socialDescription": "",
                    "socialImageLink": fileLoc[0] ?? ""
                }
                let data1 = await genrateDeepLink(details);
                await QuizTable.findByIdAndUpdate(result?._id, { shareLink: { link: data1.shortLink, text: title } })
                // if (isActive) {
                //     const data = {
                //         title: title,
                //         message: `New Test ${title} added`,
                //         fileUrl: result?.quiz_banner[0],
                //         route: "dailyQuizbyid",
                //         rootId: `${result?._id}`,
                //         childId: ""
                //     };
                //     await sendCustomNotification('all', data);
                // }
            }
            return res.json({
                status: true,
                data: null,
                msg: 'Quizes added successfully in batches.'
            })
        } catch (error) {
            return res.json({
                status: false,
                data: null,
                msg: error.message
            })
        }

    }

);

adminRoute.get("/fetchLectures", isAdmin, async (req, res) => {
    try {
        const { text } = req.query;
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!adminDetails) {
            return res.json({
                status: false,
                data: null,
                msg: `Not An Admin`
            })
        }
        // const lectures = await LectureTable.find({ lecture_title : { $regex : text }}).populate({
        //      path : 'batch' ,
        //      select : 'batchId subject teacher' ,
        //      populate : {
        //         path : 'subject',
        //         select : '_id title'
        //      } , 
        //     //  populate : {
        //     //     path : 'teacher' ,
        //     //     select : '_id FullName'
        //     //  }

        // });
        const lectures = await LectureTable.aggregate([
            { $match: { lecture_title: { $regex: text } } },
            {
                $lookup: {
                    from: 'batchestables',
                    localField: 'batch',
                    foreignField: '_id',
                    as: 'batchDetails',
                }
            },
            {
                $unwind: {
                    path: "$batchDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $lookup: {
                    from: 'subjecttables',
                    localField: 'batchDetails.subject',
                    foreignField: '_id',
                    as: 'subjectDetails'
                }
            },
            {
                $lookup: {
                    from: 'adminteachertables',
                    localField: 'batchDetails.teacher',
                    foreignField: '_id',
                    as: 'teacherDetails'
                }
            },
            {
                $project: {
                    _id: 0,
                    value: '$_id',
                    label: { $concat: ['$lecture_title', '-', '$batchDetails.batchId'] },
                    batch: '$batchDetails._id',
                    subjects: {
                        $map: {
                            input: '$subjectDetails',
                            as: 'subject',
                            in: { value: '$$subject._id', label: '$$subject.title' }
                        }
                    },
                    teachers: {
                        $map: {
                            input: '$teacherDetails',
                            as: 'teacher',
                            in: { value: '$$teacher._id', label: '$$teacher.FullName' }
                        }
                    }
                }
            },

        ])
        const fetchLectures = [];
        let subjects = [];
        let teachers = [];
        for (let lecture of lectures) {
            let lecObj = {
                value: lecture?.value,
                label: lecture?.label,
                batch: lecture?.batch,
            }
            if (lecture?.batch) {
                fetchLectures.push(lecObj);
            }
            // console.log(lecture?.batch?.subject);
            for (let item of lecture?.subjects) {
                let obj = {
                    value: item?.value?.toString() ?? "",
                    label: item?.label ?? "",
                }
                if (subjects.findIndex(x => x.value == obj.value) == -1) {
                    subjects.push(obj);
                }
            }
            for (let item of lecture?.teachers) {
                let obj = {
                    value: item?.value?.toString() ?? "",
                    label: item?.label ?? "",
                }
                if (teachers.findIndex(x => x.value == obj.value) == -1) {
                    teachers.push(obj);
                }
            }

            // subjects = subjects.concat(subjectArray);
            // let teacherArray  = lecture?.batch?.teacher?.map((item) => {
            //     return {
            //         value : item?._id?.toString() ?? "" ,
            //         label : item?.FullName ?? "" , 
            //     }
            // })
            // teachers = teachers.concat(teacherArray);
        }
        return res.json({
            status: true,
            data: {
                lectures: fetchLectures,
                //  { lectures : lectures?.map((item) => {
                //     return {
                //         value : item?._id ,
                //         label : `${item?.lecture_title} - ${item?.batch?.batchId}` ,
                //     }
                //    }) ,
                //    subjects : [ ... new Set(subjects)] ,
                //    teachers : [ ... new Set(teachers)] , 
                subjects,
                teachers,
            }
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/updateProfilePhoto", upload.single('file'), isAdmin, async (req, res) => {
    const { teacher } = req.body;
    if (['', null, undefined].includes(teacher)) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Teacher Id`
        })
    }
    try {
        const isTeacher = await adminTeacherTable.findOne({ _id: teacher });
        if (!isTeacher) {
            return res.json({
                status: false,
                data: null,
                msg: `Teacher not exist`
            })
        }
        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `teacher/${isTeacher?.FullName.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        } else {
            return res.json({
                status: false,
                data: null,
                msg: `Required Profile Photo`
            })
        }
        await adminTeacherTable.updateOne({ _id: teacher }, { profilePhoto: fileLoc })
        return res.json({
            status: true,
            data: null,
            msg: `Profile Photo Updated`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post(
    "/uploadQuizQuestion",
    isAdmin,
    upload.single("file"),
    async (req, res) => {
        try {
            let { quizIds } = req.body;
            quizIds = quizIds.filter((item) => item != "");
            const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
            const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
            if (!adminDetails) {
                return res.json({
                    status: false,
                    data: null,
                    msg: `Not An Admin`
                })
            }
            const file = req.file;
            if (!file) {
                return res.json({
                    status: false,
                    data: null,
                    message: "No file uploaded",
                });
            }
            let extName = path.extname(file.originalname);
            if (!['.xlsx', '.xls'].includes(extName)) {
                return res.json({
                    status: false,
                    data: null,
                    msg: 'Only Excel file(.xlsx or .xls) Allowed'
                })
            }
            const workbook = xlsjs.readFile(file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsjs.utils.sheet_to_json(worksheet, { header: 1 });
            const actualColumns = Object.values(data[0]);
            const expectedColumns = [
                "question_title_english",
                "question_title_hindi",
                "que_level_english",
                "que_level_hindi",
                "option1_english",
                "option1_hindi",
                "option2_english",
                "option2_hindi",
                "option3_english",
                "option3_hindi",
                "option4_english",
                "option4_hindi",
                "answer_english",
                "answer_hindi",
                "correctOption",
                "is_active",
            ];
            const missingColumns = expectedColumns.filter(
                (column) => !actualColumns.includes(column)
            );

            if (missingColumns.length > 0) {
                return res.json({
                    status: false,
                    data: null,
                    message: `Missing columns in the Excel file: ${missingColumns.join(
                        ", "
                    )}`,
                });
            }
            const date = moment().add(5, "hours").add(30, "minutes").toDate();
            const formattedDate = moment(date).format('DD-MM-YYYY');
            const questions = [];
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row.filter((cell) => cell !== "").length === 0) {
                    continue;
                }
                for (let quizId of quizIds) {
                    const question = {
                        quiz_id: quizId.toString(),
                        question_title: {
                            e: row[0],
                            h: row[1],
                        },
                        que_level: {
                            e: row[2],
                            h: row[3],
                        },
                        option1: {
                            e: row[4],
                            h: row[5],
                        },
                        option2: {
                            e: row[6],
                            h: row[7],
                        },
                        option3: {
                            e: row[8],
                            h: row[9],
                        },
                        option4: {
                            e: row[10],
                            h: row[11],
                        },
                        answer: {
                            e: row[12],
                            h: row[13],
                        },
                        correctOption: row[14]?.toString(),
                        is_active: Boolean(row[15]),
                        created_at: formattedDate,
                        updated_at: formattedDate,
                    };
                    questions.push(question);
                }
            }


            // Save questions to the database
            const savedQuestions = await QuizQuestionsTable.create(questions);
            for (let quizId of quizIds) {
                const questionCount = await QuizQuestionsTable.countDocuments({
                    quiz_id: quizId,
                });
                await QuizTable.updateOne(
                    { _id: quizId },
                    { no_ques: questionCount }
                );

            }

            res.json({
                status: true,
                data: savedQuestions,
                no_ques: questionCount,
                msg: "Quiz questions added successfully",
            });

        } catch (error) {
            return res.json({
                status: false,
                data: null,
                msg: error.message
            })
        }
    }
);

adminRoute.post("/addQuestionInMultiQuizes", isAdmin, async (req, res) => {
    try {
        let {
            que_level,
            question_title,
            option1,
            option2,
            option3,
            option4,
            answer,
            correctAns,
            quizIds,
        } = req.body;
        quizIds = quizIds.filter((item) => item != "");
        const decode = jwt.decode(req.token, process.env.ADMIN_SECRET_KEY)
        const adminDetails = await findAdminTeacherUsingUserId(decode.studentId);
        if (!adminDetails) {
            return res.json({
                status: false,
                data: null,
                msg: 'Not an admin'
            })
        }
        const date = new Date(moment().add(5, "hours").add(30, "minutes"));
        let formatedDate = moment(date).format('DD-MM-YYYY');
        let questions = []
        for (let quizId of quizIds) {
            let ques = {
                quiz_id: quizId,
                que_level: que_level,
                question_title: question_title,
                option1: option1,
                option2: option2,
                option3: option3,
                option4: option4,
                answer: answer,
                correctOption: correctAns,
                created_at: formatedDate,
            }
            questions.push(ques);
        }
        await QuizQuestionsTable.create(questions);
        return res.json({
            status: false,
            data: null,
            msg: 'Question created in given quizes'
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// async function getQuizResults(quizId) {
//     const users = await QuizResponseTable.find({ quiz_id: quizId })
//         .populate("user_id")
//         .lean();
//     const filterUsers = users.filter((item) => ![null, undefined].includes(item.user_id?._id));
//     const usersArr = filterUsers.map((item) => ({
//         userId: item.user_id?._id.toString(),
//         FullName: item.user_id?.FullName,
//         email: item.user_id?.email,
//         mobileNumber: item.user_id?.mobileNumber
//     }));
//     const quiz = await QuizTable.findById(quizId);
//     if (quiz) {
//         const quizResponseArr = await QuizResponseTable.find({
//             quiz_id: quizId,
//             user_id: { $in: usersArr.map((user) => user.userId) },
//         });
//         if (!quizResponseArr.length) {
//             return null;
//         }
//         const quizQuestions = await QuizQuestionsTable.find({ quiz_id: quizId });
//         // console.log(quizQuestions)
//         const correctRes = quizQuestions.map((e) => ({
//             ans_id: e._id,
//             question_title: e.question_title[0],
//             que_level: e.que_level[0],
//             option1: e.option1[0],
//             option2: e.option2[0],
//             option3: e.option3[0],
//             option4: e.option4[0],
//             answer: e.answer[0],
//             correctOption: e.correctOption,
//         }));

//         const studentScores = [];
//         for (const quizResponse of quizResponseArr) {
//             const studentId = quizResponse.user_id.toString();
//             const studentRes = quizResponse.ans_res[0] || [];
//             correctRes.forEach((e, i) => {
//                 e.myAnswer = Object.values(studentRes)[i] || "";
//             });
//             let correctAns = 0;
//             let wrongAnswers = 0;
//             correctRes.forEach((e) => {
//                 if (e.correctOption === e.myAnswer) {
//                     correctAns++;
//                 } else if (e.myAnswer !== "") {
//                     wrongAnswers++;
//                 }
//             });
//             let myScore = 0;
//             if (quiz.is_negative) {
//                 myScore =
//                     correctAns * parseFloat(quiz.eachQueMarks) -
//                     wrongAnswers * parseFloat(quiz.negativeMarks);
//             } else {
//                 myScore = correctAns * parseFloat(quiz.eachQueMarks);
//             }
//             let studentName = "";
//             let email = "";
//             let mobileNumber = ""
//             const user = usersArr.find((e) => e.userId === studentId);
//             if (user) {
//                 studentName = user.FullName;
//                 email = user.email;
//                 mobileNumber = user.mobileNumber;
//             }
//             studentScores.push({
//                 studentId,
//                 studentName,
//                 email,
//                 mobileNumber,
//                 myScore,
//                 totalMarks: (parseFloat(quiz.eachQueMarks) * correctRes.length).toFixed(
//                     2
//                 ),
//                 accuracy: ((correctAns / correctRes.length) * 100).toFixed(2),
//             });
//         }
//         studentScores.sort((a, b) => {
//             if (b.myScore === a.myScore) {
//                 return b.accuracy - a.accuracy;
//             } else {
//                 return b.myScore - a.myScore;
//             }
//         });

//         return { quizId, studentScores };
//     }

// }

async function getQuizResults(quizId) {

    var users = await QuizResponseTable.find({ quiz_id: quizId })
        .populate("user_id")
        .lean();
    var usersArr = users.map((item) => ({
        userId: item?.user_id?._id?.toString(),
        FullName: item?.user_id?.FullName,
        email: item?.user_id?.email,
        mobileNumber: item?.user_id?.mobileNumber
    }));
    const quiz = await QuizTable.findById(quizId);
    if (quiz?.link == "batch") {
      const batch = await BatchesTable.findById(quiz?.linkWith);
      // console.log("====================================1", usersArr.length);
      users = await UserTable.find(
        { _id: { $in: batch?.student } },
        { _id: 1, FullName: 1, email: 1, mobileNumber: 1 }
      );
      usersArr = users.map((item) => ({
        userId: item?._id?.toString(),
        FullName: item?.FullName,
        email: item?.email,
        mobileNumber: item?.mobileNumber
      }));
      
    }
    const GetTest = await TestSeriesTestTable.findById(quizId);
    if (quiz) {
        // console.log("====================================2", usersArr.length);
        const quizResponseArr = await QuizResponseTable.find({
            quiz_id: quizId,
            user_id: { $in: usersArr.map((user) => user.userId) },
        });
        // console.log("====================================3", quizResponseArr[0]);
        if (!quizResponseArr.length) {
            return null;
        }
        const quizQuestions = await QuizQuestionsTable.find({ quiz_id: quizId });
        const correctRes = quizQuestions.map((e) => ({
            ans_id: e._id,
            question_title: e.question_title[0],
            que_level: e.que_level[0],
            option1: e.option1[0],
            option2: e.option2[0],
            option3: e.option3[0],
            option4: e.option4[0],
            answer: e.answer[0],
            correctOption: e.correctOption,
        }));

        const studentScores = [];
        for (const userLoop of usersArr) {
            const studentId = userLoop.userId;
            const studentRes = quizResponseArr.find(response => response.user_id.toString() === studentId)?.ans_res[0] || [];
            // console.log("====================================4", studentRes);
            correctRes.forEach((e, i) => {
                e.myAnswer = Object.values(studentRes)[i] || "";
            });
            let correctAns = 0;
            let wrongAnswers = 0;
            correctRes.forEach((e) => {
                if (e.correctOption === e.myAnswer) {
                    correctAns++;
                } else if (e.myAnswer !== "") {
                    wrongAnswers++;
                }
            });
            let myScore = 0;
            if (quiz.is_negative) {
                myScore =
                    correctAns * parseFloat(quiz.eachQueMarks) -
                    wrongAnswers * parseFloat(quiz.negativeMarks);
            } else {
                myScore = correctAns * parseFloat(quiz.eachQueMarks);
            }
            let studentName = "";
            let email = "";
            let mobileNumber = ""
            // const user = usersArr.find((e) => e.userId === studentId);
            if (userLoop) {
                studentName = userLoop.FullName;
                email = userLoop.email;
                mobileNumber = userLoop.mobileNumber;
            }
            studentScores.push({
                studentId,
                studentName,
                email,
                mobileNumber,
                myScore,
                totalMarks: (parseFloat(quiz.eachQueMarks) * correctRes.length).toFixed(
                    2
                ),
                accuracy: ((correctAns / correctRes.length) * 100).toFixed(2),
            });
        }
        studentScores.sort((a, b) => {
            if (b.myScore === a.myScore) {
                return b.accuracy - a.accuracy;
            } else {
                return b.myScore - a.myScore;
            }
        });

        return { quizId, studentScores };
    }
    if (GetTest) {
        const quizResponseArr = await QuizResponseTable.find({
            quiz_id: quizId,
            user_id: { $in: usersArr.map((user) => user.userId) },
        });
        if (!quizResponseArr.length) {
            return null;
        }
        const quizQuestions = await QuizQuestionsTable.find({ quiz_id: quizId });
        const correctRes = quizQuestions.map((e) => ({
            ans_id: e._id,
            question_title: e.question_title[0],
            que_level: e.que_level[0],
            option1: e.option1[0],
            option2: e.option2[0],
            option3: e.option3[0],
            option4: e.option4[0],
            answer: e.answer[0],
            correctOption: e.correctOption,
        }));

        const studentScores = [];
        for (const userLoop of usersArr) {
          const studentId = userLoop.userId;
          const studentRes = quizResponseArr.find(response => response.user_id.toString() === studentId)?.ans_res[0] || [];
          // console.log("====================================4", studentRes);
            correctRes.forEach((e, i) => {
                e.myAnswer = Object.values(studentRes)[i] || "";
            });
            let correctAns = 0;
            let wrongAnswers = 0;
            correctRes.forEach((e) => {
                if (e.correctOption === e.myAnswer) {
                    correctAns++;
                } else if (e.myAnswer !== "") {
                    wrongAnswers++;
                }
            });
            let myScore = 0;
            if (GetTest.negativemarking) {
                myScore =
                    correctAns * parseFloat(GetTest.eachQueMarks) -
                    wrongAnswers * parseFloat(GetTest.negativeMarks);
            } else {
                myScore = correctAns * parseFloat(GetTest.eachQueMarks);
            }
            let studentName = "";
            let email = "";
            // const user = usersArr.find((e) => e.userId === studentId);
            if (userLoop) {
              studentName = userLoop.FullName;
              email = userLoop.email;
              mobileNumber = userLoop.mobileNumber;
            }
            studentScores.push({
                studentId,
                studentName,
                email,
                myScore,
                totalMarks: (
                    parseFloat(GetTest.eachQueMarks) * correctRes.length
                ).toFixed(2),
                accuracy: ((correctAns / correctRes.length) * 100).toFixed(2),
            });
        }
        studentScores.sort((a, b) => {
            if (b.myScore === a.myScore) {
                return b.accuracy - a.accuracy;
            } else {
                return b.myScore - a.myScore;
            }
        });

        return { quizId, studentScores };
    }

}

adminRoute.get("/getBatchQuizLeaderBoard", isAdmin, async (req, res) => {
    try {

        const { batchId } = req.query;
        if (!batchId) {
            return res.json({
                status: false,
                data: null,
                msg: "BatchId required",
            });
        }
        let quizs = await QuizTable.find({ link: 'batch', linkWith: batchId }).select('_id quiz_title');
        //   console.log(quizs);
        let response = [];
        for (let quiz of quizs) {
            const isQuizAttempted = await QuizResponseTable.find({ quiz_id: quiz?._id });
            if (isQuizAttempted.length > 0) {
                const ldrbrd = await leaderBoardTable.find({ quizId: quiz?._id });
                //   console.log(ldrbrd);
                if (ldrbrd.length === 0) {
                    const usersScore = await getQuizResults(quiz?._id);
                    if (usersScore) {
                        const saveLederBoard = new leaderBoardTable({
                            quizId: usersScore.quizId,
                            leaderBoard: usersScore.studentScores,
                            publishedAt: new Date(
                                moment().add(5, "hours").add(30, "minutes")
                            ),
                        });
                        const data = await saveLederBoard.save();
                        response.push({
                            title: quiz?.quiz_title,
                            leaderBoard: data?.leaderBoard.map((item, index) => {
                                return {
                                    // studentId: item.studentId,
                                    phone: item?.mobileNumber,
                                    studentName: item.studentName,
                                    myScore: `${item.myScore}`,
                                    totalMarks: item.totalMarks,
                                    accuracy: item.accuracy,
                                    rank: index + 1,
                                }
                            }),
                        })

                    }
                } else {
                    const usersScore = await getQuizResults(quiz?._id);
                    if (usersScore) {
                        let leaderBoard = usersScore?.studentScores;
                        const data = await leaderBoardTable.findByIdAndUpdate(ldrbrd[0]?._id, { leaderBoard: leaderBoard }, { new: true, lean: true });
                        response.push({
                            title: quiz?.quiz_title,
                            leaderBoard: data.leaderBoard.map((item, index) => {
                                return {
                                    // studentId: item.studentId,/\
                                    phone: item?.mobileNumber,
                                    studentName: item.studentName,
                                    myScore: `${item.myScore}`,
                                    totalMarks: item.totalMarks,
                                    accuracy: item.accuracy,
                                    rank: index + 1,
                                }
                            }),
                        })
                    }

                }
            }

        }
        return res.json({
            status: true,
            data: response,
            msg: 'Batch quizes leader  board genrated '
        })
    } catch (error) {
        console.log(error);
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeVerifiedAndUnVerifiedUser/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await UserTable.findOne({ _id: id }).select('FullName _id isVerified');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `User Not Found`
            })
        }
        let isVerified = isExist?.isVerified == true ? false : true;
        const newUser = await UserTable.findByIdAndUpdate(isExist?._id, { isVerified: isVerified }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `${newUser?.FullName} verification status changes into ${isVerified == true ? 'Verified' : 'UnVerified'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getBatchCommunities/:batchId", isAdmin, async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required batchId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }

        const communities = await BatchCommunity.find({ batch: batchId }).populate('user', '_id FullName profilePhoto mobileNumber isVerified').sort({ createdAt: -1 })

        return res.json({
            status: true,
            data: communities.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    desc: item?.desc,
                    image: item?.problemImage ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY hh:mm:ss'),
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" },
                    phone: item?.user?.mobileNumber ?? "",
                    isActive: item?.isActive
                }
            }),
            msg: 'Communities fetched '
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeActiveAndInActive/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchCommunity.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Community Not Found`
            })
        }
        let isActive = isExist?.isActive == true ? false : true;
        await BatchCommunity.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `Batch Community  status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/addFeature", isAdmin, upload.single('file'), async (req, res) => {
    try {
        const { feature, order, isActive } = req.body;
        if (!['lecture', 'note', 'dpp', 'quiz', 'announcement', 'doubt', 'community', 'planner'].includes(feature)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required feature & batch `
            })
        }
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isFeature = await BatchFeature.findOne({ $or: [{ feature: feature }, { order: order }] }).select('_id ');
        if (isFeature) {
            return res.json({
                status: false,
                data: null,
                msg: `Feature Name Or Order Already Exists`
            })
        }
        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batch/feature/${feature?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        } else {
            return res.json({
                status: false,
                data: null,
                msg: `Required Feature Image`
            })
        }
        await BatchFeature.create({ admin: admin?._id, feature, icon: fileLoc, isActive: isActive, order });
        return res.json({
            status: true,
            data: null,
            msg: `${feature} feature added in batch`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


// add Feature into batch

adminRoute.get("/getCommunityComments", isAdmin, async (req, res) => {
    try {
        const { batchCommunityId } = req.query;
        if (!batchCommunityId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch Community Id Required'
            })
        }
        const comments = await BatchCommunityComment.find({ batchCommunity: batchCommunityId }).populate('user', '_id FullName mobileNumber profilePhoto').sort({ createdAt: -1 });
        return res.json({
            status: true,
            data: comments?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto },
                    msg: item?.msg ?? "",
                    phone: item?.user?.mobileNumber ?? "",
                    image: item?.image ?? "",
                    isActive: item?.isActive ?? false,
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                }
            }),
            msg: 'comment fetched'
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getCommunityReplyComments", isAdmin, async (req, res) => {
    try {
        const { commentId } = req.query;
        if (!commentId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Comment Id Required'
            })
        }

        const replies = await BatchCommunityCommentReply.find({ commentId: commentId }).populate('user', '_id FullName mobileNumber profilePhoto');
        return res.json({
            status: true,
            data: replies?.map((item, index) => {
                return {
                    id: item?._id,
                    sno: index + 1,
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto },
                    phone: item?.user?.mobileNumber ?? "",
                    msg: item?.msg ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                }
            }),
            msg: 'Reply fetched'
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.delete("/deleteComment", isAdmin, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {

        const comment = await BatchCommunityComment.findOneAndDelete({ _id: commentId });
        await BatchCommunityCommentReply.deleteMany({ commentId: commentId })
        if (comment) {
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })

        }
        return res.json({
            status: false,
            data: null,
            msg: "Comment not found"
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

// delete Reply
adminRoute.delete("/deleteReplyComment", isAdmin, async (req, res) => {
    const { replyCommentId } = req.query;
    if (!replyCommentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required replyCommentId`
        })
    }
    try {
        const reply = await BatchCommunityCommentReply.findOneAndDelete({ _id: replyCommentId });
        if (reply) {
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })
        }

        return res.json({
            status: false,
            data: null,
            msg: "Reply Comment not found"
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

adminRoute.get("/getAllBatchFeature", isAdmin, async (req, res) => {
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const features = await BatchFeature.find({}).populate('admin', 'FullName Role profilePhoto');
        return res.json({
            status: true,
            data: features?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id ?? "",
                    admin: { name: item?.admin?.FullName ?? "NA", profilePhoto: item?.admin?.profilePhoto ?? "NA" },
                    feature: item?.feature ?? "",
                    icon: item?.icon ?? "",
                    isActive: item?.isActive ?? false,
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                    order: item?.order ?? 0,
                    value: item?._id,
                    label: item.feature,
                }
            }),
            msg: `Batch Feature Fetched`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


adminRoute.put("/makeActiveAndInActiveBatchFeature/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchFeature.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Feature Not Found`
            })
        }
        let isActive = isExist?.isActive == true ? false : true;
        await BatchFeature.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `Batch Feature  status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getFeatureById/:id", isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required Feature Id'
            })
        }
        const feature = await BatchFeature.findOne({ _id: id });
        return res.json({
            status: true,
            data: {
                id: feature?._id,
                feature: feature?.feature ?? "",
                order: feature?.order ?? 0,
                isActive: feature?.isActive ?? false,
                icon: feature?.icon
            },
            msg: 'Feature details fetched'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/updateFeature", upload.single('file'), isAdmin, async (req, res) => {
    try {
        const { id, feature, order, isActive } = req.body;
        if (!id || parseInt(order) == NaN || !['true', 'false']?.includes(isActive) || !['lecture', 'note', 'dpp', 'quiz', 'announcement', 'doubt', 'community', 'planner'].includes(feature)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required id feature order status'
            })
        }
        const isOrderExist = await BatchFeature.findOne({ _id: { $ne: id }, order: order });
        if (isOrderExist) {
            return res.json({
                status: false,
                data: null,
                msg: 'This Order exists already'
            })
        }
        const isExist = await BatchFeature.find({ _id: id, order: order });
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: 'Feature not found'
            })
        }
        let fileLoc = isExist?.icon;
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `batch/feature/${feature?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        const newFeature = await BatchFeature.updateOne({ _id: id }, { feature, isActive, icon: fileLoc, order });
        return res.json({
            status: true,
            data: null,
            msg: 'Feature Updated'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeActiveAndInActiveBatch/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchesTable.findOne({ _id: id }).select('_id is_active');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Not Found`
            })
        }
        let isActive = isExist?.is_active == true ? false : true;
        await BatchesTable.updateOne({ _id: isExist?._id }, { is_active: isActive }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `Batch  status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


adminRoute.post("/addOrRemoveBatchFeature", isAdmin, async (req, res) => {
    try {

        const { batchId, features } = req.body;
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        await BatchesTable.updateOne({ _id: batchId }, { features: features });
        return res.json({
            status: true,
            data: null,
            msg: 'Batch features Updated '
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getBatchDoubts/:batchId", isAdmin, async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required batchId`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }

        const doubts = await BatchDoubt.find({ batch: batchId }).populate('subject', 'title').populate({
            path: 'lecture',
            select: "lecture_title",
            populate: {
                path: 'teacher',
                select: 'FullName'
            }
        }).populate('user', '_id FullName profilePhoto mobileNumber isVerified').sort({ createdAt: -1 })

        return res.json({
            status: true,
            data: doubts.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    desc: item?.desc,
                    image: item?.problemImage ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY hh:mm:ss'),
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" },
                    phone: item?.user?.mobileNumber ?? "",
                    isActive: item?.isActive,
                    lecture: item?.lecture?.lecture_title ?? "",
                    subject: item?.subject?.title ?? "",
                    teacher: item?.lecture?.teacher[0]?.FullName ?? "",
                    isResolved: item?.isResolved ?? false,
                }
            }),
            msg: 'Doubts fetched '
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeActiveAndInActiveDoubt/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchDoubt.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Doubt Not Found`
            })
        }
        let isActive = isExist?.isActive == true ? false : true;
        await BatchDoubt.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `Batch Doubt  status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeSolvedAndUnSolvedDoubt/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchDoubt.findOne({ _id: id });
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Doubt Not Found`
            })
        }
        let isResolved = isExist?.isResolved == true ? false : true;
        await BatchDoubt.updateOne({ _id: isExist?._id }, { isResolved: isResolved });
        // console.log(isExist);
        if (isExist?.isActive && isResolved) {
            const data = {
                title: `Your doubt is resolved`,
                message: `${isExist?.desc}`,
                fileUrl: isExist?.problemImage || "",
                route: "batchDoubtById",
                rootId: `${isExist?.batch}`,
                childId: `${isExist?._id}`
            };
            // console.log(data);

            await sendCustomNotification([isExist?.user], data)
        }
        return res.json({
            status: true,
            data: null,
            msg: `Batch Doubt  resolve status changes into ${isResolved == true ? 'Resolved' : 'Pending'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createBatchDoubtComment", isAdmin, async (req, res) => {
    try {
        const { batchDoubtId, msg } = req.body;
        // let isBadMsg = await badWordCheck(msg);
        // if (isBadMsg) {
        //     return res.json({
        //         status: false,
        //         data: null,
        //         msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
        //     })
        // }
        const isDoubt = await BatchDoubt.findOne({ _id: batchDoubtId });
        if (!isDoubt) {
            return res.json({
                status: false,
                data: null,
                msg: 'Doubt not exist.'
            })
        }
        const user = await UserTable.findOne({ _id: "659cf5baafa06a11ae156545" }).select("_id FullName profilePhoto isVerified")
        let fileLoc = "";
        // if (req.file) {
        //     const helperString = Math.floor(Date.now() / 1000);
        //     const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        //     const extension = "." + req.file.originalname.split(".").pop();
        //     FileUploadLocation = `batchDoubt/comment/${filename}_${helperString}${extension}`;
        //     let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        //     fileLoc = helperfileLoc;
        // }
        const newComment = await BatchDoubtComment.create({
            batchDoubt: batchDoubtId,
            msg: msg,
            user: "659cf5baafa06a11ae156545",
            image: fileLoc,
            isActive: true
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

adminRoute.get("/getDoubtComments", isAdmin, async (req, res) => {
    try {
        const { batchDoubtId } = req.query;
        if (!batchDoubtId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Batch Doubt Id Required'
            })
        }
        const comments = await BatchDoubtComment.find({ batchDoubt: batchDoubtId }).populate('user', '_id FullName mobileNumber profilePhoto').sort({ createdAt: -1 });
        return res.json({
            status: true,
            data: comments?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto },
                    msg: item?.msg ?? "",
                    phone: item?.user?.mobileNumber ?? "",
                    image: item?.image ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                    isActive: item?.isActive ?? false
                }
            }),
            msg: 'comment fetched'
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.delete("/deleteDoubtComment", isAdmin, async (req, res) => {
    const { commentId } = req.query;
    if (!commentId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required commentId`
        })
    }
    try {

        const comment = await BatchDoubtComment.findOneAndDelete({ _id: commentId });
        if (comment) {
            return res.json({
                status: true,
                data: null,
                msg: "Comment deleted"
            })

        }
        return res.json({
            status: false,
            data: null,
            msg: "Comment not found"
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})

// communties comment active and inActive
adminRoute.put("/makeActiveAndInActiveCommunityComment/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchCommunityComment.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Doubt Not Found`
            })
        }
        let isActive = isExist?.isActive == true ? false : true;
        await BatchCommunityComment.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `Commment status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

// batch doubt comment Active and inActive
adminRoute.put("/makeActiveAndInActiveDoubtComment/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await BatchDoubtComment.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Comment Not Found`
            })
        }
        // console.log(isActive);
        let isActive = isExist?.isActive == true ? false : true;
        // console.log(isActive);
        await BatchDoubtComment.updateOne({ _id: isExist?._id }, { isActive: isActive });
        return res.json({
            status: true,
            data: null,
            msg: `Comment status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/uploadQuestionInMultipleQuizes", isAdmin, upload.single("file"), async (req, res) => {
    try {
        let { quizIds } = req.body;
        // let quizIds = ['6805eac2db11eade50340954'];
        if (!req.file || !quizIds) {
            return res.json({
                status: false,
                data: null,
                msg: "File & Quizes required",
            });
        }
        quizIds = quizIds.filter((item) => item != "");
        if (quizIds.length <= 0) {
            return res.json({
                status: false,
                data: null,
                msg: 'Please provide quizes'
            })
        }
        const file = req.file;
        const allowedFileTypes = [".xls", ".xlsx"];
        const fileExtension = path.extname(file.originalname);
        if (!allowedFileTypes.includes(fileExtension)) {
            return res.json({
                status: false,
                data: null,
                msg: "Invalid file type. Only Excel files (.xls, .xlsx) are allowed.",
            });
        }
        const workbook = xlsjs.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsjs.utils.sheet_to_json(worksheet, { header: 1 });
        const actualColumns = Object.values(data[0]);
        const expectedColumns = [
            "question_title_english",
            "question_title_hindi",
            "que_level_english",
            "que_level_hindi",
            "option1_english",
            "option1_hindi",
            "option2_english",
            "option2_hindi",
            "option3_english",
            "option3_hindi",
            "option4_english",
            "option4_hindi",
            "answer_english",
            "answer_hindi",
            "correctOption",
            "is_active",
            "sectionId"
        ];
        const missingColumns = expectedColumns.filter(
            (column) => !actualColumns.includes(column)
        );

        if (missingColumns.length > 0) {
            return res.json({
                status: false,
                data: null,
                msg: `Missing columns in the Excel file: ${missingColumns.join(
                    ", "
                )}`,
            });
        }
        const formattedDate = moment().format('DD-MM-YYYY HH:mm:ss');
        const questions = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            // console.log(row[16]);
            if (row.filter((cell) => cell !== "").length === 0) {
                continue;
            }
            for (let quizId of quizIds) {
                let question = {
                    quiz_id: quizId.toString(),
                    question_title: {
                        e: row[0],
                        h: row[1],
                    },
                    que_level: {
                        e: row[2],
                        h: row[3],
                    },
                    option1: {
                        e: row[4],
                        h: row[5],
                    },
                    option2: {
                        e: row[6],
                        h: row[7],
                    },
                    option3: {
                        e: row[8],
                        h: row[9],
                    },
                    option4: {
                        e: row[10],
                        h: row[11],
                    },
                    answer: {
                        e: row[12],
                        h: row[13],
                    },
                    correctOption: row[14]?.toString(),
                    is_active: Boolean(row[15]),
                    sectionId: row[16],
                    created_at: formattedDate,
                    updated_at: formattedDate,
                };
                console.log("Sections", question.sectionId)
                questions.push(question);
            }
        }
        const savedQuestions = await QuizQuestionsTable.create(questions);

        for (let quizId of quizIds) {
            const questionCount = await QuizQuestionsTable.countDocuments({ quiz_id: quizId });
            await QuizTable.updateOne({ _id: quizId }, { no_ques: questionCount });
        }
        res.json({
            status: true,
            data: questions,
            msg: "Quiz questions added successfully in multiple batches",
        });
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
});

adminRoute.post("/addQuizQuestionInQuizes", isAdmin, async (req, res) => {
    try {
        const {
            que_level,
            question_title,
            option1,
            option2,
            option3,
            option4,
            answer,
            correctAns,
            quizIds,
            sectionId
        } = req.body;
        // quizIds = quizIds?.filter((item) => item != "");
        if (quizIds.length <= 0) {
            return res.json({
                status: false,
                data: null,
                msg: 'Please provide quizes'
            })
        }
        let formatedDate = moment().format('DD-MM-YYYY HH:mm:ss');
        let quesArr = [];
        for (let quizId of quizIds) {
            const ques = {
                quiz_id: quizId,
                que_level: que_level,
                question_title: question_title,
                option1: option1,
                option2: option2,
                option3: option3,
                option4: option4,
                answer: answer,
                correctOption: correctAns,
                created_at: formatedDate,
                sectionId
            };
            quesArr.push(ques);

        }
        await QuizQuestionsTable.create(quesArr);

        for (let quizId of quizIds) {

            const getQueCount = await QuizQuestionsTable.countDocuments({
                quiz_id: quizId,
            });
            await QuizTable.updateOne(
                { _id: quizId },
                { no_ques: getQueCount }
            );
        }
        res.json({
            status: true,
            data: null,
            msg: "Quiz Question Added in multiple quizes ",
        });

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
});
adminRoute.get("/getSubCategoryByCategory", isAdmin, async (req, res) => {
    try {
        const { categoryId } = req.query;
        if (!categoryId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required category id'
            })
        }
        const subCategories = await subCategoryTable.find({ category: categoryId });
        return res.json({
            status: false,
            data: subCategories?.map((item) => {
                return {
                    id: item?._id ?? "",
                    title: item?.title ?? "",
                    value: item?._id ?? "",
                    label: item?.title ?? "",
                }
            }),
            msg: `Sub Category fetched successfully.`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createValidityFeature", isAdmin, async (req, res) => {
    try {
        const { name, info, isActive, batchId } = req.body;
        if (!name || ![true, false].includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required name isActive'
            })
        }
        await ValidityFeatureTable.create({ name, info, isActive, admin: req.adminId, batch: batchId });
        return res.json({
            status: true,
            data: null,
            msg: 'Validity Feature Created'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getValidityFeatures", isAdmin, async (req, res) => {
    try {
        const { batchId } = req.query;
        if (!batchId) {
            return res.json({
                status: false,
                data: null,
                msg: 'Required Batch Id'
            })
        }
        const allFeatures = await ValidityFeatureTable.find({ batch: batchId }).populate('admin', 'FullName Role profilePhoto');
        return res.json({
            status: true,
            data: allFeatures?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id ?? "",
                    value: item?._id ?? "",
                    label: item?.name ?? "",
                    name: item?.name ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                    isActive: item?.isActive,
                    info: item?.info,
                    admin: { name: item?.admin?.FullName ?? "", profilePhoto: item?.admin?.profilePhoto ?? "", Role: item?.admin?.Role }
                }
            }),
            msg: 'Validity Feature Created'
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeActiveAndInActiveValidityFeature/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }
        const isExist = await ValidityFeatureTable.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Feature Not Found`
            })
        }
        let isActive = isExist?.isActive == true ? false : true;
        await ValidityFeatureTable.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
        return res.json({
            status: true,
            data: null,
            msg: `Validity Feature  status changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getAllBatchCommunities", isAdmin, async (req, res) => {
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }

        const communities = await BatchCommunity.find({}).populate('batch', '_id batch_name batchId').populate('user', '_id FullName profilePhoto mobileNumber isVerified').sort({ createdAt: -1 });
        return res.json({
            status: true,
            data: communities.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    desc: item?.desc,
                    image: item?.problemImage ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY hh:mm:ss'),
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" },
                    batch: { batchName: item?.batch?.batch_name ?? "", batchId: item?.batch?.batchId ?? "" },
                    phone: item?.user?.mobileNumber ?? "",
                    isActive: item?.isActive
                }
            }),
            msg: 'Communities fetched '
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})


adminRoute.get("/getAllBatchDoubts", isAdmin, async (req, res) => {
    try {
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decoded.studentId);
        if (!admin) {
            return res.json({
                status: false,
                data: null,
                msg: `Not an admin`
            })
        }

        const doubts = await BatchDoubt.find({createdAt: { $exists: true, $gte: new Date("2025-07-15T00:00:00.000Z") }}).populate("batch", '_id batch_name batchId').populate('subject', 'title').populate({
            path: 'lecture',
            select: "lecture_title",
            populate: {
                path: 'teacher',
                select: 'FullName'
            }
        }).populate('user', '_id FullName profilePhoto mobileNumber isVerified').sort({ isResolved: 1, createdAt: -1 });

        return res.json({
            status: true,
            data: doubts.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    desc: item?.desc,
                    image: item?.problemImage ?? "",
                    createdAt: momentTimeZone(item?.createdAt).tz("Asia/Kolkata").format('DD-MM-YYYY HH:mm:ss'),
                    user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" },
                    batch: { batchName: item?.batch?.batch_name ?? "", batchId: item?.batch?.batchId ?? "" },
                    phone: item?.user?.mobileNumber ?? "",
                    isActive: item?.isActive,
                    lecture: item?.lecture?.lecture_title ?? "",
                    subject: item?.subject?.title ?? "",
                    teacher: item?.lecture?.teacher[0]?.FullName ?? "",
                    isResolved: item?.isResolved ?? false,
                }
            }),
            msg: 'Doubts fetched '
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.delete("/deleteBatchDoubt", isAdmin, async (req, res) => {
    try {
        const { doubtId } = req.query;
        if (!doubtId) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Doubt Id required`
            })
        }
        const doubt = await BatchDoubt.findOneAndDelete({ _id: doubtId, });
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

adminRoute.delete("/deleteBatchCommunity", isAdmin, async (req, res) => {
    try {
        const { batchCommunityId } = req.query;
        if (!batchCommunityId) {
            return res.json({
                status: false,
                data: null,
                msg: `Batch Community Id required`
            })
        }
        const community = await BatchCommunity.findOneAndDelete({ _id: batchCommunityId, });
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

adminRoute.get("/getNotesDetails", isAdmin, async (req, res) => {
    try {
        const notes = await NotesTable.find({}).sort({ createdAt: -1 }).populate('subCategory', '_id title').populate('category', '_id title');
        return res.json({
            status: true,
            data: notes?.map((item, index) => {
                // console.log(item?.subCategory)
                // subCategory
                return {
                    sno: index + 1,
                    id: item?._id ?? "",
                    title: item?.title ?? "",
                    fileUrl: item?.file_url?.fileLoc ?? "",
                    category: item?.category?.title ?? "",
                    subCategory: item?.subCategory?.title ?? "",
                    is_active: item?.is_active ?? false,
                    language: item?.language ?? 'en',
                    resource_type: item?.resource_type ?? "",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss')
                }
            }),
            msg: `Notes fetched succesfully`
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createResultBanner", upload.single('file'), isAdmin, async (req, res) => {
    try {
        const { title, category, year, isActive } = req.body;
        if (!title || !category || !year || ![true, false, 'true', 'false'].includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required title description link linkWith , Year  , status.`
            })
        }

        let fileLoc = "";
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `resultBanner/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        } else {
            return res.json({
                status: false,
                data: null,
                msg: `Required Banner`
            })
        }
        await resultBannerTable.create({ admin: req?.adminId, title, year, banner: fileLoc, category, isActive });
        return res.json({
            status: true,
            data: null,
            msg: 'Result banner created'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createSuccessStory", isAdmin, async (req, res) => {
    try {
        const { desc, category, resultInfo, user, url, year, isActive } = req.body;
        if (!desc || !category || !user || !year || !resultInfo || ![true, false]?.includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required category description resultInfo , year ,  user ,  status.`
            })
        }


        await SuccessStoryTable.create({ admin: req.adminId, url, desc, user, year, category, isActive, resultInfo });
        return res.json({
            status: true,
            data: null,
            msg: 'Success story created'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/allResultBanner", isAdmin, async (req, res) => {
    try {

        const banners = await resultBannerTable.find({}).populate('category', '_id title').populate('admin', 'FullName Role');
        return res.json({
            status: true,
            data: banners?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    title: item?.title,
                    banner: item?.banner,
                    category: item?.category?.title,
                    isActive: item?.isActive,
                    year: item?.year ?? "NA",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                    admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role },
                }
            }),
            msg: "Fetch banner"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/allResultStory", isAdmin, async (req, res) => {
    try {

        const stories = await SuccessStoryTable.find({}).populate('category', '_id title').populate('user', 'FullName mobileNumber').populate('admin', 'FullName Role');
        return res.json({
            status: true,
            data: stories?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    url: item?.url,
                    desc: item?.desc,
                    resultInfo: item?.resultInfo,
                    user: `${item?.user?.FullName} - ${item?.user?.mobileNumber}`,
                    isActive: item?.isActive,
                    category: item?.category?.title,
                    year: item?.year ?? "NA",
                    createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
                    admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role },
                }
            }),
            msg: "Story fetched Sucessfully"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.delete("/deleteResultBanner", isAdmin, async (req, res) => {
    const { bannerId } = req.query;
    if (!bannerId) {
        return res.json({
            status: false,
            data: null,
            msg: `Required banner`
        })
    }
    try {

        const result = await resultBannerTable.findOneAndDelete({ _id: bannerId });
        if (result) {
            return res.json({
                status: true,
                data: null,
                msg: "Banner deleted"
            })
        }

        return res.json({
            status: false,
            data: null,
            msg: "Banner not found"
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message,
        })
    }
})
adminRoute.delete("/deleteResultStory", isAdmin, async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {

        const result = await SuccessStoryTable.findOneAndDelete({ _id: id });
        if (result) {
            return res.json({
                status: true,
                data: null,
                msg: "Story deleted"
            })
        }

        return res.json({
            status: false,
            data: null,
            msg: "Story not found"
        })


    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/courseOrders", isAdmin, async (req, res) => {
    try {
        let { page, pageSize } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 25;

        const orders = await courseOrdesTable.aggregate([
            {
                $facet: {
                    orders: [
                        { $sort: { createdAt: -1 } },
                        {
                            $lookup: {
                                from: "userstables",
                                localField: "user",
                                foreignField: "_id",
                                as: "user",
                            },
                        },
                        {
                            $unwind: {
                                path: "$user",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: "coupontables",
                                localField: "couponId",
                                foreignField: "_id",
                                as: "coupon",
                            },
                        },
                        {
                            $unwind: {
                                path: "$coupon",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: "validitytables",
                                localField: "validity",
                                foreignField: "_id",
                                as: "validity",
                            },
                        },
                        {
                            $unwind: {
                                path: "$validity",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: "batchestables",
                                localField: "courseId",
                                foreignField: "_id",
                                as: "courseId",
                            },
                        },
                        {
                            $unwind: {
                                path: "$courseId",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        { $skip: (page - 1) * pageSize },
                        { $limit: pageSize },
                    ],
                    count: [
                        { $match: {} },
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ]
                }
            },
            {
                $project: {
                    orders: 1,
                    count: { $arrayElemAt: ['$count', 0] }
                }
            }
        ])
        return res.json({
            status: true,
            data: {
                orders: orders[0].orders.map((item, index) => {
                    return {
                        id: item?._id,
                        sno: index + 1,
                        user: `${item?.user?.mobileNumber}- ${item?.user?.FullName}`,
                        validity: item?.validity?.month ?? 0,
                        isPaid: item?.isPaid ?? false,
                        orderId: item?.orderId,
                        amount: item?.totalAmount,
                        coupon: item?.coupon?.couponCode ?? "NA",
                        platform: item?.platform,
                        paymentStatus: item?.paymentStatus,
                        batch: item?.courseId?.batch_name ?? "",
                        purchaseDate: item?.purchaseDate ?? "",
                    }
                }), count: orders[0].count?.count
            },
            msg: `Order fetched `
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/makeActiveAndInActiveCTABanner/:id", isAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({
            status: false,
            data: null,
            msg: `Required Id`
        })
    }
    try {
        const isExist = await ctaBannerTable.findOne({ _id: id }).select('_id isActive');
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: `CTA Banner Not Found`
            })
        }
        // console.log(isActive);
        let isActive = isExist?.isActive == true ? false : true;
        // console.log(isActive);
        await ctaBannerTable.updateOne({ _id: isExist?._id }, { isActive: isActive });
        return res.json({
            status: true,
            data: null,
            msg: `CTA Banner changes into ${isActive == true ? 'Active' : 'In Active'}`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/resultBanner/:id", isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const resultBanner = await resultBannerTable.findOne({ _id: id }).populate('category', '_id title');
        return res.json({
            status: true,
            data: resultBanner,
            msg: "Result Banner"
        })

    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})
adminRoute.get("/resultStory/:id", isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const story = await SuccessStoryTable.findOne({ _id: id }).populate('user', '_id FullName email mobileNumber').populate('category', '_id title');
        return res.json({
            status: true,
            data: {
                ...story?._doc, user: {
                    value: story?.user?._id ?? "",
                    label: `${story?.user?.FullName} ${story?.user?.email} ${story?.user?.mobileNumber}`
                }
            },
            msg: "Result Story"
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})
adminRoute.put("/updateResultBanner", upload.single('file'), isAdmin, async (req, res) => {
    try {
        const { id, title, category, year, isActive } = req.body;
        if (!title || !category || !year || ![true, false, 'true', 'false'].includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required title description link linkWith , Year  , status.`
            })
        }
        const isExist = await resultBannerTable.findOne({ _id: id });
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: "Result Banner not exists"
            })
        }

        let fileLoc = isExist?.banner;
        if (req.file) {
            const helperString = Math.floor(Date.now() / 1000);
            const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
            const extension = "." + req.file.originalname.split(".").pop();
            FileUploadLocation = `resultBanner/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
            let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
            fileLoc = helperfileLoc;
        }
        await resultBannerTable.updateOne({ _id: id }, { admin: req?.adminId, title, year, banner: fileLoc, category, isActive });
        return res.json({
            status: true,
            data: null,
            msg: 'Result banner updated'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/updateSuccessStory", isAdmin, async (req, res) => {
    try {
        const { id, desc, category, resultInfo, user, url, year, isActive } = req.body;
        if (!desc || !category || !user || !year || !resultInfo || ![true, false]?.includes(isActive)) {
            return res.json({
                status: false,
                data: null,
                msg: `Required category description resultInfo , year ,  user ,  status.`
            })
        }

        const isExist = await SuccessStoryTable.findOne({ _id: id });
        if (!isExist) {
            return res.json({
                status: false,
                data: null,
                msg: "Success Story not exist."
            })
        }
        await SuccessStoryTable.updateOne({ _id: id }, { admin: req.adminId, url, desc, user, year, category, isActive, resultInfo });
        return res.json({
            status: true,
            data: null,
            msg: 'Success story updated'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.post("/createQuizQuestionSection", isAdmin, async (req, res) => {
    try {
        const { title, isActive } = req.body;
        // console.log("3174" , req.body);
        const questionSection = new QuizQuestionSection({
            admin: req.adminId,
            title,
            isActive,
        })
        await questionSection.save();
        return res.json({
            status: true,
            data: null,
            msg: `Quiz Section Created.`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.get("/getQuizQuestionSections", isAdmin, async (req, res) => {
    try {
        const questionSections = await QuizQuestionSection.find({}).populate('admin', '_id FullName Role').sort({ createdAt: -1 });
        return res.json({
            status: true,
            data: questionSections?.map((item, index) => {
                return {
                    sno: index + 1,
                    id: item?._id,
                    title: item?.title,
                    admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role },
                    createdAt: moment(item?.createdAt).format("DD-MM-YYYY HH:mm:ss"),
                    isActive: item?.isActive
                }
            }),
            msg: `Quiz Section fetch successfully`
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

adminRoute.put("/updateQuizSection/:id", isAdmin, async (req, res) => {
    try {
        const { title, isActive } = req.body;
        await QuizQuestionSection.findOneAndUpdate({ _id: req.params.id }, { title, isActive });
        return res.json({
            status: true,
            data: null,
            msg: "Quiz Section Updated"
        })



    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})
module.exports = adminRoute;