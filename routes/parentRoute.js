const express = require("express");
const { UserTable } = require("../models/userModel");
const { SendOtpSms } = require("../ContactUser/SendMessage");
const { ParentTable } = require("../models/parent");
const { isParent } = require("../middleware/authenticateToken");
const jwt = require("jsonwebtoken");
const { MybatchTable } = require("../models/MyBatches");
const { announcementTable } = require("../models/announcements");
const ParentIssueTable = require('../models/parentIssue');
const moment = require('moment-timezone');
const { LectureTable } = require("../models/addLecture");
const { currentCategory } = require("../models/currentCateggory");
const { timeSpendOnLecture } = require("../models/timeSpendOnLecture");
const { QuizResponseTable } = require("../models/QuizResponse");
const { convertSecondsToTime } = require("../HelperFunctions/secondsToTime");
const { QuizTable } = require("../models/Quiz");
const { QuizQuestionsTable } = require("../models/Quiz_question");
const { leaderBoardTable } = require("../models/leaderboard");
const { LectureResourceTable } = require("../models/lectureResources");
const { ParentNotificationTable } = require("../models/parentNotification");
const { ParentMeetingTable } = require("../models/ParentMeeting");
const mongoose = require('mongoose');
const { quizResult } = require("../HelperFunctions/getQuizResult");
const { BatchesTable } = require("../models/BatchesSchema");
const { getBatchDetailsByBatchName } = require("../HelperFunctions/getBatchDetails");
const { courseOrdesTable } = require("../models/courseOrder");
const { paymentTransactionTable } = require("../models/paymentTransaction");
const { emiTxnTable } = require("../models/emiTransaction");
const { saleEmiTable } = require("../models/saleEmi");


const parentRoute = express.Router();

parentRoute.post("/auth", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Mobile Number`,
    });
  }
  try {
    let phoneRegex = /^\d{10}$/;
    if (!phone?.toString().match(phoneRegex)) {
      return res.json({
        status: false,
        data: null,
        msg: "Please Check Your Phone Number",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
    const isUserExist = await UserTable.findOne({ mobileNumber: phone });
    if (!isUserExist) {
      let isParentExist = await ParentTable.findOne({phone : phone , isActive : true });
      if (!isParentExist) {
        const lastParent = await ParentTable.find({}).sort({ createdAt: -1 }).limit(1);
        let parentId = "SDP1";
        if (lastParent?.length > 0) {
          let lastNumber = parseInt(lastParent[0]?.parentId?.substring(3)) + 1;
          parentId = `SDP${lastNumber}`;
        }
        isParentExist = await ParentTable.create({
          isActive: true,
          phoneOtp: otp,
          parentId,
          phone :  phone , 
          userIds: [],
        });
      }
     
      if (SendOtpSms(otp, phone)) {
        const refreshToken = jwt.sign(
          { studentId: isParentExist.parentId },
          process.env.PARENT_SECRET_KEY,
          { expiresIn: "10m" }
        );
        await ParentTable.updateOne( { _id: isParentExist._id },{ fcmToken: "", phoneOtp: otp });
        return res.json({
          status: true,
          data: { refreshToken, otpLength: "6" },
          msg: `OTP sent to ${phone}`,
        });
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "You have reached max attempted, Please Try again after sometime",
        });
      }
    } else {
        let isParentExist = await ParentTable.findOne({ userIds: { $in: [isUserExist?._id] } , isActive : true  });
          // console.log(isParentExist);
          if (!isParentExist) {
            const lastParent = await ParentTable.find({}).sort({ createdAt: -1 }).limit(1);
            let parentId = "";
            if (lastParent?.length > 0) {
              let lastNumber = parseInt(lastParent[0]?.parentId?.substring(3)) + 1;
              parentId = `SDP${lastNumber}`;
            }
            isParentExist = await ParentTable.create({ 
              isActive: true,
              phoneOtp: otp,
              parentId,
              userIds: [isUserExist?._id],
            });
          }
          if (SendOtpSms(otp, phone)) {
            const refreshToken = jwt.sign(
              { studentId: isParentExist.parentId },
              process.env.PARENT_SECRET_KEY,
              { expiresIn: "10m" }
            );
            await ParentTable.updateOne({ _id: isParentExist._id },{ fcmToken: "", phoneOtp: otp });
            return res.json({
              status: true,
              data: { refreshToken, otpLength: "6" },
              msg: `OTP sent to ${phone}`,
            });
          } else {
            return res.json({
              status: false,
              data: null,
              msg: "You have reached max attempted, Please Try again after sometime",
            });
          }
    }
    
  } catch (error) {
    return res.json({
      status: true,
      data: null,
      msg: error.message,
    });
  }
});

parentRoute.post("/verifyOtp", isParent, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.json({
        status: false,
        data: null,
        msg: "OTP Required",
      });
    }
    if (!(otp?.toString().length === 6)) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid OTP",
      });
    }
    const parent = await ParentTable.findOne({ parentId: req.parentId}).populate("userIds", "_id FullName mobileNumber Stream enrollId email profilePhoto fcmToken");
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: "Parent not found",
      });
    }
    if (parseInt(parent?.phoneOtp) === parseInt(otp)) {
      const accessToken = jwt.sign(
        { studentId: parent.parentId },
        process.env.PARENT_SECRET_KEY,
        { expiresIn: "30d" }
      );
      await ParentTable.findOneAndUpdate(
        { _id: parent._id },
        { token: accessToken, isPhoneVerified: true, phoneOtp: "" }
      );
      return res.json({
        status: true,
        data: {
          token: accessToken,
          parent: {
            id: parent?._id ?? "",
            parentId: parent?.parentId ?? "",
            name: parent.name ?? "",
            email: parent.email ?? "",
            phone: parent.phone ?? "",
            profilePhoto: parent.profilePhoto ?? "",
          },
          isStudent: parent?.userIds?.length === 0 ? false : true,
          student: await Promise.all(
            parent.userIds?.map(async (item) => {
              return {
                name: item?.FullName ?? "",
                stream: item?.Stream[0] ?? "",
                phone: item?.mobileNumber ?? "",
                email: item?.email ?? "",
                id: item?._id ?? "",
                enrollId: item?.enrollId ?? "",
                profile : item?.profilePhoto ?? "" , 
                fcmToken : item?.fcmToken ?? "" , 
              };
            })
          ),
        },
        msg: "OTP Verified",
      });
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid OTP",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Something went wrong",
    });
  }
});

parentRoute.post("/completeProfile", isParent, async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    if (!email || !phone || !name) {
      return res.json({
        status: false,
        data: null,
        msg: `Required phone email name`,
      });
    }
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    }
    let phoneRegex = /^\d{10}$/;
    if (!phone?.toString().match(phoneRegex)) {
      return res.json({
        status: false,
        data: null,
        msg: "Please Check Your Phone Number",
      });
    }
    const newParent =  await ParentTable.findOneAndUpdate(
      { _id: parent?._id },
      { email, phone, name } , 
      { new : true , lean : true }
    );
    return res.json({
      status: true,
      data : newParent , 
      // data: {
      //   name : newParent?.name ?? "",
      //   phone :  newParent?.phone ?? "", 
      //   email : newParent?.email ?? "" ,
         
      //   // parentId :  newParent?.parentId ?? ""

      // },
      msg: "Profile Updated",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

parentRoute.get("/getAnnouncements", isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    }

    // fetching students related to the parent
    // const userIds = parent.userIds;
    // const students = await UserTable.find({ _id: { $in: userIds } });
    // if (!students || !students.length) {
    //   return res.json({
    //     status: false,
    //     data: null,
    //     msg: "You have not added any child",
    //   });
    // }

    // fetching batches related to the students
    const { userId } = req.query ;
    if( !userId){
      return res.json({
        status : false ,
        data : null ,
        msg : `Required UserId`
      })
    }
    // const studentIds = students.map((student) => student._id);
    // const batches = await MybatchTable.find({ user: { $in: studentIds } });
    const batches =  await MybatchTable.find({ user :  userId });

    if (!batches.length) {
      return res.json({
        status: false,
        data: null,
        msg: "Your ward has not enrolled in any batch or test series",
      });
    }
    const batchIds = batches.map((batch) => batch.batch_id);

    // getting annoucements related to the batches
    const announcements = await announcementTable
      .find({
        link: "batch",
        linkWith: { $in: batchIds },
        isActive: true,
      })

    // payload
    const payload = announcements.map((announcement)=>{
      return{
        title: announcement.title,
        description: announcement.description,
        announcementDate : moment(announcement.createdAt).format("Do MMMM YYYY")
      }
    })

    return res.json({
      status: true,
      data: payload,
      msg:
        announcements.length > 0
          ? "Announcements fetched successfully"
          : "No announcements found for the enrolled batches",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

parentRoute.post('/addIssue', isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    }

    // validating req body
    const {userId, title } = req.body;
    if (!userId || !title ) {
      return res.json({
        status: false,
        data: null,
        msg: `Enter required fields`,
      });
    }

    // checking if user exist
    const user = await UserTable.findOne({ _id: userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `User not exist`,
      });
    }

    // checking if user is child
    const isChild = parent.userIds.includes(userId);
    if(!isChild){
      return res.json({
        status: false,
        data: null,
        msg: 'You dont have authority to add issue for this student',
      });
    }

    // creating issue
    const newIssue = await ParentIssueTable.create({
      parentId: parent._id, 
      userId : userId, 
      title : title, 
      // description: description,
      description : "" , 
    });

    return res.json({
      status: true,
      data: {
        id: newIssue._id,
        title: newIssue.title,
        // description: newIssue.description,
        // createdAt: moment(newIssue.createdAt).fromNow(),
        status: newIssue.status , 
        createdAt :  moment(newIssue?.createdAt).fromNow() , 
      },
      msg: "Issue created successfully",
    });
  
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

parentRoute.get('/getAllIssues', isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    }
    
    const {userId} = req.query;
    // console.log( userId , req.query);
    if(!userId){
      return res.json({
        status: false,
        data: null,
        msg: `User Id is required`,
      })
    }

    const isExist = await UserTable.findOne({ _id: userId });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: `User does not exist`,
      });
    }

    const issues = await ParentIssueTable.find({ parentId: parent._id,  userId: userId });

    // adjust the response payload here
    const payload = issues.map((issue) => {
      return {
        id: issue._id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        // createdAt: moment(issue.createdAt).format('h:mm a'),
        createdAt : moment( issue.createdAt).fromNow() , 
      }
    });

    return res.json({
      status : true,
      data: payload,
      msg: "Issues fetched successfully"
    })
  } catch (error) {
    return res.json({
      status: false,
      data : null,
      msg : error.message
    })
  }
});

parentRoute.get("/getBatches", isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    }

    // getting student ids
    const {userId} = req.body;
    if(!userId){
      return res.json({
        status: false,
        data: null,
        msg: `User Id is required`,
      })
    }

    const isExist  = await UserTable.findOne({ _id: userId });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: `User does not exist`,
      });
    }

    const batchIds = await MybatchTable.find({user: userId, is_active: true}).populate("batch_id",);
    // console.log(batchIds);

    const payload = batchIds.map((batch) => {
      return {
        id: batch._id,
        batchName: batch.batch_id.batch_name,
        isActive: batch.is_active,

      }
    });

    return res.json({
      status: true,
      data: payload,
      msg: "Batches fetched successfully",
    })
    
  } catch (error) { 
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

parentRoute.delete('/deleteIssue/:id', isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    const id  = req.params.id;
    // console.log(id);
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: `Issue id is required`,
      });
    }
    const {userId} = req.body;
    if(!userId){
      return res.json({
        status: false,
        data: null,
        msg: `User Id is required`,
      })
    }
    const isExist = await UserTable.findOne({ _id: userId });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: `User does not exist`,
      });
    }
    const issue = await ParentIssueTable.findOne({ _id: id, parentId: parent._id, userId: userId });
    if (!issue) {
      return res.json({
        status: false,
        data: null,
        msg: `Issue does not exist`,
      });
    }
    await issue.remove();
    return res.json({
      status: true,
      data: null,
      msg: `Issue deleted successfully`,
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

parentRoute.post("/addStudent" , isParent , async(req , res) =>{
  try{
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    const { phone } = req.body ;
    let phoneRegex = /^\d{10}$/;
    
    if( !phone || !phone?.toString().match(phoneRegex)){
       return res.json({
        status : false ,
        data : null ,
        msg : `Provide valid mobile number`
       })
    }
    let userExist =  await UserTable.findOne({ mobileNumber : phone });
    if( !userExist){
      return res.json({
        status : false ,
        data : null ,
        msg : `User not found`
      })
    }
    const isUserListed  = await ParentTable.findOne({ _id : parent?._id , userIds :  { $in : userExist?._id }}) ;
    if( isUserListed){
      return res.json({
        status : false ,
        data : null , 
        msg : 'User Already Exist'
      })
    }
    
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);

    if( SendOtpSms(otp , phone)){
      await UserTable.findOneAndUpdate({ _id : userExist?._id } , { parentVerificationOtp :  otp });
      return res.json({
        status : true ,
        data :  { otpLength: "6" } ,
        msg :  `Otp send sucessfully to student phone.`
      })
    }else{
      return res.json({
        status: false,
        data: null,
        msg: "You have reached max attempted, Please Try again after sometime",
      });
    }
    
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message 
    })
  }
})

parentRoute.post("/verifyStudentOtp" , isParent , async(req , res) =>{
  try{
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    const { otp , phone } = req.body ;
    if( !otp || otp?.toString().length != 6 || !phone || phone?.toString().length  != 10){
      return res.json({
        status : false ,
        data : null ,
        msg : `Required valid otp & phone`
      })
    }
    const user =  await UserTable.findOne({ mobileNumber : phone})
    if( !user){
      return res.json({
        status : false ,
        data : null ,
        msg : `User not found`
      })
    }
    if( user?.parentVerificationOtp === otp?.toString()){
      await ParentTable.findOneAndUpdate({ _id : parent?._id } , { $addToSet :  { userIds : { $each : [user?._id]}}})
      await UserTable.findOne({_id :  user?._id} , { parentVerificationOtp : ''});
      return res.json({
        status : true ,
        data : null ,
        msg : `Student added succesfully`
      })
    }else{
      return res.json({
        status : false ,
        data : null ,
        msg : `Otp not correct`
      })
    }
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message
    })
  }
})

parentRoute.post("/resendOtp" , isParent , async(req , res) => {
  try {
    const { phone } =  req.body ;
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    const user =  await UserTable.findOne({ mobileNumber :  phone} );
    if( !user){
      return res.json({
        status : false ,
        data : null ,
        msg :  `User not found`
      })
    }
    if( user?.parentVerificationOtp?.length == 6 && SendOtpSms(user?.parentVerificationOtp)){
      return res.json({
        status : true ,
        data : null ,
        msg : "Otp send successfully"
      })
    }else {
      return res.json({
        status : false ,
        data : null ,
        msg :  'Something went wrong'
      })
    }

  }catch(error){
    return res.json({
      status : false ,
      data : null , 
      msg :  error.message 
    })
  }
})

parentRoute.get("/getTodayClasses", isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
      const { userId } =  req.query ;
      const getMyBatches = await MybatchTable.find({ user: userId }).select('_id batch_id');
      let batchIds = getMyBatches?.map((item) => { return item?.batch_id });
      let date = new Date();
      let end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 28, 89, 59, 59)
      let start = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 5, 30, 0, 0)
      let todayLecture = await LectureTable.find({ batch: batchIds, startingDate: { $gte: start, $lte: end }, isActive: true }).populate({
          path: 'teacher',
          select: '_id FullName qualification profilePhoto demoVideo',
          populate: {
              path: 'subject',
              // select : "title"
          }
      }).populate("batch", '_id batch_name slug banner').populate('subject').sort({ startingDate: 1 })
      return res.json({
          status: true,
          data: await Promise.all(todayLecture?.map(async (lecture) => {
              return {
                  lectureTitle :  lecture?.lecture_title ?? "" , 
                  // batchDetails: { id: lecture?.batch?._id, batchName: lecture?.batch?.batch_name, slug: lecture?.batch?.slug, batchSlug: lecture?.batch?.slug ?? "" } ?? { id: "", batchName: "", slug: "" },
                  batchName : lecture?.batch?.batch_name ?? "" , 
                  teacher: lecture?.teacher[0]?.FullName ?? "",
                  ending_time: moment(lecture?.ending_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
                  starting_time: moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
                  banner: lecture?.banner == "" ? lecture?.batch?.banner[0]?.fileLoc :  lecture?.banner,
              }
          })),
          msg: 'Student today lectures'
      })



  } catch (error) {
      return res.json({
          status: false,
          data: null,
          msg: error.message
      })
  }
})

parentRoute.get("/todayProgress" , isParent ,async( req , res) => {
  try{
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 

      const { userId } =  req.query ;
      const getMyBatches = await MybatchTable.find({ user: userId }).select('_id batch_id').populate('batch_id' , '_id batch_name banner');
      let batchIds = getMyBatches?.map((item) => { return item?.batch_id });
      let date = new Date();
      let end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 28, 89, 59, 59)
      let start = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 5, 30, 0, 0)
      let todayLecture = await LectureTable.find({ batch: batchIds, startingDate: { $gte: start, $lte: end }, isActive: true }).populate({
          path: 'teacher',
          select: '_id FullName qualification profilePhoto demoVideo',
          populate: {
              path: 'subject',
              // select : "title"
          }
      }).populate("batch", '_id batch_name slug banner').populate('subject').sort({ startingDate: 1 })
      // let todayProgress =  {} ;
      // let lectureIds = todayLecture?.
      // let lectureResourceCount = await LectureResourceTable.countDocuments({ lecture : })
      let todayClasses = [] ;
      let totalLearning = 0 ;
      let attainClasses =  0 ; 
      // let myBatches = [] ;
      for( let lecture of todayLecture){
        const timeSpend = await timeSpendOnLecture.findOne({ lecture : lecture?._id , user :  userId});
        if( timeSpend && parseInt(timeSpend?.timeSpend) > 0 ){
          attainClasses++;
          totalLearning += parseInt(timeSpend?.timeSpend);
        }
        let classObj = {
          lectureId : lecture?._id ?? "" , 
          lectureTitle :  lecture?.lecture_title ?? "" , 
          batchName : lecture?.batch?.batch_name ?? "" , 
          teacher: lecture?.teacher[0]?.FullName ?? "",
          ending_time: moment(lecture?.ending_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
          starting_time: moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
          banner: lecture?.banner == "" ? lecture?.batch?.banner[0]?.fileLoc :  lecture?.banner,
          isAttended  :  parseInt(timeSpend?.timeSpend) > 0 ? true : false ,
          timeSpend : parseInt(timeSpend?.timeSpend)  , 
        }
        todayClasses.push(classObj);
      }
      
      return res.json({
          status: true,
          data: { 
            todayClasses ,
             todayProgress : { attainClasses , learning : convertSecondsToTime(totalLearning) ,  totalClasses : todayClasses.length } , 
             myBatches :  getMyBatches?.map((item) => {
              return {
                id : item?.batch_id?._id ?? "" ,
                title : item?.batch_id?.batch_name ?? "" ,
                banner :  item?.batch_id?.banner[0]?.fileLoc ?? "" , 
              }
             }) }, 
          msg: 'Student today lectures'
      })
    

  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message 
    })
  }
})

parentRoute.get("/getAllStudent" , isParent , async(req , res) =>{
  try{
    const parent = await ParentTable.findOne({ parentId: req.parentId }).populate('userIds');
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    return res.json({
      status : true ,
      data : await Promise.all(parent?.userIds?.map( async (item) =>{
        const currCategory = await currentCategory.findOne({ user :  item?._id}).populate('categoryId' , '_id title')
        return {
          id : item?._id ,
          enrollId : item?.enrollId , 
          name : item?.FullName ?? "" , 
          phone : item?.mobileNumber ?? "" ,
          email : item?.email ?? "" , 
          stream : currCategory?.categoryId?.title ?? "" ,
          profile : item?.profilePhoto ?? "" ,
          fcmToken : item?.fcmToken
        }
      })) ,
      msg : 'All Student Profile fetched'
    })
    

  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg :  error.message 
    })
  }
})

parentRoute.get("/getQuizes" , isParent , async(req , res) =>{
  try{
    // console.log(req.parentId);
    const parent = await ParentTable.findOne({ parentId : req.parentId});
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : `Parent not exist`
      })
    }
    const {batchId ,  userId } =  req.query ;
    const isUser = await UserTable.findOne({ _id : userId});
    if( !isUser){
      return res.json({
        status : false ,
        data : null ,
        msg : `User not found`
      })
    }
    // const myBatch = await MybatchTable.findOne({ user: userId , batch_id : batchId }).select('_id batch_id');
    // let batchIds = getMyBatches?.map((item) => { return item?.batch_id });
    const allQuizes =  await QuizTable.find({ is_active :  true , link : 'batch' , linkWith : batchId }).sort({ createdAt : -1});
    let allQuizIds = allQuizes?.map((item) => { return item?._id })
    // console.log( allQuizIds?.length , allQuizes?.length)
    const attemptedQuiz =  await QuizResponseTable.find({quiz_id : { $in : allQuizIds} , user_id : isUser?._id }).populate('quiz_id' , '_id quiz_title quiz_duration eachQueMarks no_ques');
  let attemptedQuizIds = attemptedQuiz.map((item) => { return item?.quiz_id?._id});
    // const quizes =  await QuizTable.find({ _id : { $nin :  attemptedQuizIds}  , is_active :  true , link : 'batch' , linkWith : batchId }).sort({ createdAt : -1});
    const quizes  = allQuizes?.filter((item) => { return !attemptedQuizIds?.includes(item?._id) })
    let attemptedQuizResponse = [] ;
    let notAttemptedQuizResponse = [] ; 
    for( let quiz of quizes){
      let obj = {
        quizId : quiz?._id ,
        quizTitle : quiz.quiz_title , 
        quizDuration : quiz?.quiz_duration,
        noOfQuestion : quiz?.no_ques ,
        totalMarks : parseInt(quiz?.no_ques) * parseInt(quiz?.eachQueMarks),
      }
      if( parseInt(quiz?.no_ques) > 0 ){
        notAttemptedQuizResponse.push(obj) ;
      }
    }
    for( let quiz of attemptedQuiz){
      let obj = {
        quizId : quiz?.quiz_id?._id ,
        quizTitle : quiz?.quiz_id?.quiz_title , 
        quizDuration : quiz?.quiz_id?.quiz_duration  ,
        noOfQuestion : quiz?.quiz_id?.no_ques ,
        totalMarks : parseInt(quiz?.quiz_id?.no_ques) * parseInt(quiz?.quiz_id?.eachQueMarks),
      }
      if( quiz?.quiz_id?._id){
         attemptedQuizResponse.push(obj);
      }
    }
    return res.json({
      status : true ,
      data : { attemptedQuizes :attemptedQuizResponse , notAttemptedQuizes : notAttemptedQuizResponse} ,
      msg : 'Quiz Details fetched for given student'
    })

  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message 
    })
  }
})

async function getTopperScore(quizId) {
  const score = await leaderBoardTable.findOne({
    quizId,
  });
  if (score !== null) return score.leaderBoard[0].myScore;
  else return "0.00";
}

parentRoute.get("/getQuizResult" , isParent , async(req , res) => {
  const { userId , quizId  } = req.query;
  if( !userId ||  !quizId){
    return res.json({
      status : false ,
      data : null ,
      msg : `Required userId , quizId`
    })
  }
  try {
    // console.log(quizId + " " + attemptId + "" + req.userId);
    
    const user = await UserTable.findOne({ _id : userId});
    if ( !user ) {
      return res.json({
        status : false ,
        data : null ,
        msg : 'User not found' 
      })
    }
      const quiz = await QuizTable.findById(quizId);
      // const GetTest = await TestSeriesTestTable.findById(quizId);
      // console.log("Quiz", GetTest)

      if ( !quiz) {
        return res.json({
          status : false ,
          data : null ,
          msg : 'Quiz not found' 
        })
      }
        // let quizResFilter = {};
        let quizResFilter = {
          quiz_id: quizId,
          user_id: user?._id,
        };
        
        let studentRes = [];
        let currectRes = [];
        const quizResponse = await QuizResponseTable.find(quizResFilter);
        // console.log(quizResponse[0]?.ans_res[0] , quizResponse[0]?.ans_res[1] , quizResponse[0]?.ans_res[2]);
        const topperScore = await getTopperScore(quizId);
        if (quizResponse[0]?.is_active) {
          quizResponse.forEach((r) => {
            studentRes.push(r?.ans_res);
          });
          const quizQuestions = await QuizQuestionsTable.find({
            quiz_id: quizId,
          });
          // console.log(quizQuestions);
          quizQuestions.forEach((e) => {
            currectRes.push({
              ans_id: e._id,
              question_title: e.question_title[0],
              que_level: e.que_level[0],
              option1: e.option1[0],
              option2: e.option2[0],
              option3: e.option3[0],
              option4: e.option4[0],
              answer: e.answer[0],
              correctOption: e.correctOption,
            });
          });
          studentRes = studentRes?.[0];
          for (let i = 0; i < quizQuestions.length; i++) {
            currectRes[i]["myAnswer"] = Object.values(
              quizResponse[0].ans_res[0]
            )[i];
            // console.log(Object.values(quizResponse[0].ans_res[0])[i]);
          }
          let correctAns = 0;
          let skipped = 0;
          let wrongAnswers = 0;
          let easy = 0;
          let medium = 0;
          for (let i = 0; i < currectRes.length; i++) {
            if (currectRes[i].myAnswer == "") skipped++;
            if (currectRes[i].correctOption === currectRes[i].myAnswer)
              correctAns++;
            else if (
              currectRes[i].correctOption !== currectRes[i].myAnswer &&
              currectRes[i].myAnswer !== ""
            )
              wrongAnswers++;
            if (currectRes[i]?.que_level?.e === "easy") easy++;
            else if (currectRes[i]?.que_level?.e === "medium") medium++;
          }

          let myScore = 0;
          if (quiz.is_negative) {
            myScore =
              correctAns * parseFloat(quiz.eachQueMarks) -
              wrongAnswers * parseFloat(quiz.negativeMarks);
          } else {
            myScore = correctAns * parseFloat(quiz.eachQueMarks);
          }
          const topperSc =
            typeof topperScore === "number" ? topperScore : 0.0;
          const topperPer =
            (topperSc / (quiz.eachQueMarks * currectRes.length)) * 100;
          const myScorePer =
            (myScore / (quiz.eachQueMarks * currectRes.length)) * 100;
          res.json({
            status: true,
            data: {
              quizId: quizId,
              is_published: true,
              totalMarks: (
                parseFloat(quiz.eachQueMarks) * currectRes.length
              ).toFixed(2),
              is_negative: quiz.is_negative,
              negativeMarks:
                quiz.negativeMarks !== ""
                  ? parseFloat(quiz.negativeMarks).toFixed(2)
                  : "0.00",
              myScore: {
                percentage: (myScorePer / 100).toFixed(2),
                number: myScore.toFixed(2),
              },
              accuracy: {
                percentage: (correctAns / currectRes.length).toFixed(2), // range b/w 0-1
                number: ((correctAns / currectRes.length) * 100).toFixed(2), // range 0-100
              },
              toperScore: {
                percentage: topperPer ? (topperPer / 100).toFixed(2) : "0.00",
                number: topperSc ? topperSc.toFixed(2) : "0.00",
              },
              summary: {
                noOfQues: currectRes.length,
                Attempted: currectRes.length - skipped,
                skipped,
                correctAns,
                wrongAnswers,
              },
              difficulty: {
                easy: {
                  percentage: (easy / currectRes.length).toFixed(2),
                  number: easy.toFixed(2),
                },
                medium: {
                  percentage: (medium / currectRes.length).toFixed(2),
                  number: medium.toFixed(2),
                },
                hard: {
                  percentage: (
                    (currectRes.length - (easy + medium)) /
                    currectRes.length
                  ).toFixed(2),
                  number: (currectRes.length - (easy + medium)).toFixed(2),
                },
              },
              response: currectRes,
            },
            msg: "Quiz result",
          });
        } else {
          quizResponse.forEach((r) => {
            studentRes.push(r.ans_res);
          });
          const quizQuestions = await QuizQuestionsTable.find({
            quiz_id: quizId,
          });
          quizQuestions.forEach((e) => {
            currectRes.push({
              ans_id: e._id,
              question_title: e.question_title[0],
              que_level: e.que_level[0],
              option1: e.option1[0],
              option2: e.option2[0],
              option3: e.option3[0],
              option4: e.option4[0],
              answer: e.answer[0],
              correctOption: e.correctOption,
            });
          });
          studentRes = studentRes?.[0];
          for (let i = 0; i < quizQuestions.length; i++) {
            currectRes[i]["myAnswer"] = Object?.values(
              quizResponse[0]?.ans_res[i]
            )[0];
          }
          let correctAns = 0;
          let skipped = 0;
          let wrongAnswers = 0;
          let easy = 0;
          let medium = 0;
          for (let i = 0; i < currectRes.length; i++) {
            if (currectRes[i].myAnswer == "") skipped++;
            if (currectRes[i].correctOption === currectRes[i].myAnswer)
              correctAns++;
            else if (
              currectRes[i].correctOption !== currectRes[i].myAnswer &&
              currectRes[i].myAnswer !== ""
            )
              wrongAnswers++;
            if (currectRes[i]?.que_level?.e === "easy") easy++;
            else if (currectRes[i]?.que_level?.e === "medium") medium++;
          }
          let myScore = 0;
          if (quiz.is_negative) {
            myScore =
              correctAns * parseFloat(quiz.eachQueMarks) -
              wrongAnswers * parseFloat(quiz.negativeMarks);
          } else {
            myScore = correctAns * parseFloat(quiz.eachQueMarks);
          }
          const topperSc =
            typeof topperScore === "number" ? topperScore : 0.0;
          const topperPer =
            (topperSc / (quiz.eachQueMarks * currectRes.length)) * 100;
          const myScorePer =
            (myScore / (quiz.eachQueMarks * currectRes.length)) * 100;
          res.json({
            status: true,
            data: {
              is_published: false,
              quizId: quizId,
              totalMarks: (
                parseFloat(quiz.eachQueMarks) * currectRes.length
              ).toFixed(2),
              is_negative: quiz.is_negative,
              negativeMarks:
                quiz.negativeMarks !== ""
                  ? parseFloat(quiz.negativeMarks).toFixed(2)
                  : "0.00",
              myScore: {
                percentage: (myScorePer / 100).toFixed(2),
                number: myScore.toFixed(2),
              },
              accuracy: {
                percentage: (correctAns / currectRes.length).toFixed(2), // range b/w 0-1
                number: ((correctAns / currectRes.length) * 100).toFixed(2), // range 0-100
              },
              toperScore: {
                percentage: topperPer ? (topperPer / 100).toFixed(2) : "0.00",
                number: topperSc ? topperSc.toFixed(2) : "0.00",
              },
              summary: {
                noOfQues: currectRes.length,
                Attempted: currectRes.length - skipped,
                skipped,
                correctAns,
                wrongAnswers,
              },
              difficulty: {
                easy: {
                  percentage: (easy / currectRes.length).toFixed(2),
                  number: easy.toFixed(2),
                },
                medium: {
                  percentage: (medium / currectRes.length).toFixed(2),
                  number: medium.toFixed(2),
                },
                hard: {
                  percentage: (
                    (currectRes.length - (easy + medium)) /
                    currectRes.length
                  ).toFixed(2),
                  number: (currectRes.length - (easy + medium)).toFixed(2),
                },
              },
              response: currectRes,
            },
            msg: "Quiz Result Not Published !",
          });
        }
      
    
     
  } catch (error) {
    console.log(error);
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

parentRoute.get("/getNotification" , isParent , async(req , res) => {
  try{
    const parent = await ParentTable.findOne({ parentId : req.parentId});
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : `Parent not exist`
      })
    }
    // const { userId } =  req.query ; 
    // if( !userId){
    //   return res.json({
    //     status : false ,
    //     data : null ,
    //     msg :  `Required User Id`
    //   })
    // }
    const currCategory = await currentCategory.find({ user :  parent?.userIds });
    let categoriesId = currCategory?.map((item) => {return item?.categoryId } ) ;
    let linkWith = [ ...categoriesId , 'all' ];
    
    const myBatches =  await MybatchTable.find({ user : parent?.userIds });
    let batchIds = myBatches?.map((item) => { return item?.batch_id});
    linkWith = linkWith.concat(batchIds) ;
    const notifications = await ParentNotificationTable.find({ linkWith : linkWith , isActive : true }).sort({ createdAt : -1 });
    return res.json({
      status : true ,
      data : notifications?.map((item) => {
        return {
          title : item?.title ?? "" ,
          description : item?.description ?? "" ,
          createdAt : moment(item?.createdAt).fromNow(),
        }
      }) ,
      msg : "All Notification fetched"
    })


  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg :  error.message 
    })
  }
}) 

parentRoute.get("/getMeeting" , isParent , async(req , res) => {
  try{
    const parent = await ParentTable.findOne({ parentId : req.parentId});
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : `Parent not exist`
      })
    }
    // const { userId } =  req.query ; 
    // if( !userId){
    //   return res.json({
    //     status : false ,
    //     data : null ,
    //     msg :  `Required User Id`
    //   })
    // }
    const currCategory = await currentCategory.find({ user :  parent?.userIds });
    let categoriesId = currCategory?.map((item) => {return item?.categoryId } ) ;
    let linkWith = [ ...categoriesId , 'all' ];
    
    const myBatches =  await MybatchTable.find({ user : parent?.userIds });
    let batchIds = myBatches?.map((item) => { return item?.batch_id});
    linkWith = linkWith.concat(batchIds) ;
    let date = new Date();
    let end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 28, 89, 59, 59)
    let start = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 5, 30, 0, 0)
    const meetings = await ParentMeetingTable.find({ startTime :  { $gte: start, $lte: end }, linkWith : linkWith , isActive : true }).sort({ startTime :  -1});
    return res.json({
      status : true ,
      data : meetings?.map((item) => {
        return {
          title : item?.title ?? "" ,
          description : item?.description ?? "" ,
          link : item?.meetingLink ?? "",
          banner :  item?.banner ?? "" , 
          startTime : moment.utc(item?.startTime).format('DD-MM-YYYY HH:mm:ss') , 
          endTime : moment.utc(item?.endTime).format('DD-MM-YYYY HH:mm:ss')  
          // createdAt : moment(item?.createdAt).fromNow(),
        }
      }) ,
      msg : "All Meeting fetched"
    })


  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg :  error.message 
    })
  }
})  

async function getQuizResults(quizId ) {
  const users = await QuizResponseTable.find({ quiz_id: quizId })
      .populate("user_id")
      .lean();
  const usersArr = users.map((item) => ({
      userId: item.user_id._id.toString(),
      FullName: item.user_id.FullName,
      email: item.user_id.email,
      mobileNumber: item.user_id.mobileNumber
  }));
  const quiz = await QuizTable.findById(quizId);
  if (quiz) {
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
      for (const quizResponse of quizResponseArr) {
          const studentId = quizResponse.user_id.toString();
          const studentRes = quizResponse.ans_res[0] || [];
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
          const user = usersArr.find((e) => e.userId === studentId);
          if (user) {
              studentName = user.FullName;
              email = user.email;
              mobileNumber = user.mobileNumber;
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

      return { quizId, studentScores   };
  }
 
}

parentRoute.get("/getLeaderBoard" , isParent , async(req , res) => {
  try{
    const parent =  await ParentTable.findOne({ parentId :  req.parentId });
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : "Not An Parent"
      })
    }
    const { quizId } = req.query ;
    if (!quizId) {
      return res.json({
          status: false,
          data: null,
          msg: "quizId required",
      });
  }
  const quiz = await QuizTable.findById(quizId);
  if (quiz ) {
      const ldrbrd = await leaderBoardTable.find({ quizId });
      if (ldrbrd.length === 0) {
          const usersScore = await getQuizResults(quizId);
          if (usersScore) {
              const saveLederBoard = new leaderBoardTable({
                  quizId: usersScore.quizId,
                  leaderBoard: usersScore.studentScores,
                  publishedAt: new Date(
                      moment().add(5, "hours").add(30, "minutes")
                  ),
              });
              const data = await saveLederBoard.save();
              if (!data) {
                  return res.json({
                      status: false,
                      data: null,
                      msg: "Error while saving LeaderBoard ",
                  });
              }
              return res.json({
                  status: true,
                  data:  data.leaderBoard.map((item , index ) => {
                          return {
                              studentId: item.studentId,
                              studentName: item.studentName,
                              myScore: `${item.myScore}`,
                              totalMarks: item.totalMarks,
                              accuracy: item.accuracy , 
                              rank : index +1  , 
                          }
                      }),
                  msg: "LederBorad",
              });
          } else {
              return res.json({
                  status: false,
                  data: null,
                  msg: "Error while generating LeaderBoard ",
              });
          }
      } else {
          const usersScore = await getQuizResults(quizId);
          if (usersScore) {
              let leaderBoard = usersScore?.studentScores;
              const data = await leaderBoardTable.findByIdAndUpdate(ldrbrd[0]?._id, { leaderBoard: leaderBoard }, { new: true, lean: true });
              return res.json({
                  status: true,
                  data:  data.leaderBoard.map((item , index ) => {
                          return {
                              studentId: item.studentId,
                              studentName: item.studentName,
                              myScore: `${item.myScore}`,
                              totalMarks: item.totalMarks,
                              accuracy: item.accuracy , 
                              rank : index +1  , 

                          }
                      }),
                  msg: "LederBorad",
              });
          } else {
              return res.json({
                  status: false,
                  data: null,
                  msg: "Error while generating LeaderBoard ",
              });
          }
          
      }
  }else{
    return res.json({
      status : false ,
      data : null ,
      msg : 'Quiz not found'
    })
  }
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message
    })
  }
})

parentRoute.get("/recentAttemptedQuiz" , isParent , async(req , res) => {
  try{
    const parent =  await ParentTable.findOne({ parentId :  req.parentId });
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : "Not An Parent"
      })
    }
    const { userId } =  req.query ;
    if( !userId || !parent?.userIds?.includes(mongoose.Types.ObjectId(userId))){
      return res.json({
        status : false ,
        data : null ,
        msg : `Provide correct user`
      })
    }
    let response =await  quizResult(userId);
    // for( let quiz of attemptedQuiz) {
    //   let result = await quizResult(quiz?.quiz_id);
    //   let obj = {
    //     quizTitle : quiz?.quiz_id?.quiz_title ?? "" ,
    //     accuracy : result?.accuracy , 
    //     wrongAnswers : result?.wrongAnswers , 
    //     correctAns : result?.correctAns ,
    //   }
    //   if( result){
    //     response.push(obj);
    //   }

    // };
    return res.json({
      status : true ,
      data : response ,
      msg : `Recent Quiz fetched`
    })
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message 
    })
  }
})



parentRoute.get("/getSubjectOfBatch", isParent, async (req, res) => {
  const { batchId , userId } = req.query;
  if (!batchId || !userId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required batchId , UserId'
    })
  }
  try {
    const parent =  await ParentTable.findOne({ parentId :  req.parentId });
    if( !parent || !parent?.userIds?.includes(mongoose.Types.ObjectId(userId))){
      return res.json({
        status : false ,
        data : null ,
        msg : "Not An Parent"
      })
    }
    const isBatch = await BatchesTable.findOne({ _id : batchId }).populate("subject", "_id title icon");
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Batch not found'
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: userId , batch_id: isBatch?._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "not authorized to access"
      })
    }


    return res.json({
      status: true,
      data: await Promise.all(isBatch?.subject?.map(async (item) => {
        // const lecturesCount = await LectureTable.countDocuments({ batch: isBatch._id, subject: item._id })
        const lectures =  await LectureTable.find({ batch: isBatch._id, subject: item._id}) ;
        let attendedLecture =  0 ;
        for( let lecture of lectures){
          const timeSpend =  await timeSpendOnLecture.findOne({ user : userId , lecture :  lecture?._id} , { timeSpend :  1}) ;
          if( timeSpend && parseInt(timeSpend?.timeSpend) > 0 ){
            attendedLecture++;
          }
        }
        return {
          id: item?._id ?? "",
          title: item?.title ?? "",
          chapter: lectures?.length  ?? 0,
          icon: item?.icon ?? "" ,
          attendedLecture :  attendedLecture , 
        }
      })),
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

let weekArray = ['Sunday' , 'Monday' , 'Tuesday', 'Wednesday' , 'Thursday' , 'Friday' , 'Saturday' ];
parentRoute.get("/getdashboard" , isParent ,async( req , res) => {
  try{
    const { userId } =  req.query ;
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent  || !parent?.userIds.includes(userId)) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 

      // const { userId } =  req.query 
      const getMyBatches = await MybatchTable.find({ user: userId }).select('_id batch_id').populate('batch_id' , '_id batch_name banner');
      let batchIds = getMyBatches?.map((item) => { return item?.batch_id });
      let date = new Date();
      const startOfWeek = new Date(date.setDate(date.getDate() - 7 ));
      // console.log(startOfThisWeek);
      let todayClasses = [] ;
      let learningTimeDayWise = [];
      for( let i = 1 ; i < 8 ; i++){
        let currDate = new Date(startOfWeek) ;
        currDate.setDate(startOfWeek.getDate()+i)
      let end = new Date(currDate.getUTCFullYear(), currDate.getUTCMonth(), currDate.getUTCDate(), 28, 89, 59, 59) 
      let start = new Date(currDate.getUTCFullYear(), currDate.getUTCMonth(), currDate.getUTCDate(), 5, 30, 0, 0)
      let weekClasses = await LectureTable.find({ batch: batchIds, startingDate: { $gte: start, $lte: end }, isActive: true }).populate('teacher' , '_id FullName').sort({ startingDate: 1 })
      let totalLearning = 0 ;
      let attainClasses =  0 ; 
      for( let lecture of weekClasses){
        const timeSpend = await timeSpendOnLecture.findOne({ lecture : lecture?._id , user :  userId});
        if( timeSpend && parseInt(timeSpend?.timeSpend) > 0 ){
          attainClasses++;
          totalLearning += parseInt(timeSpend?.timeSpend);
        }
        
        
        if( i == 7){
          let classObj = {
            lectureId : lecture?._id ?? "" , 
            lectureTitle :  lecture?.lecture_title ?? "" , 
            batchName : lecture?.batch?.batch_name ?? "" , 
            teacher: lecture?.teacher[0]?.FullName ?? "",
            ending_time: moment(lecture?.ending_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
            starting_time: moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
            banner: lecture?.banner == "" ? "https://d1mbj426mo5twu.cloudfront.net/Banner/Lecture%20Banner%20/sd-banner_1711950515.png" :  lecture?.banner,
            isAttended  :  parseInt(timeSpend?.timeSpend) > 0 ? true : false ,
            timeSpend : parseInt(timeSpend?.timeSpend)  , 
          }
         todayClasses.push(classObj);

        }
        // todayClasses.push(classObj);
      }  
      
       let obj =  {date :  moment(currDate).format('DD-MM-YYYY') , day :  weekArray[currDate.getDay()] ,    learning :  parseInt(totalLearning)  , attainClasses:   attainClasses }
       learningTimeDayWise.push(obj);
      }
      return res.json({
          status: true,
          data:  { 
            todayClasses , 
          learningTimeDayWise  , 
          myBatches :  getMyBatches?.map((item) => {
            return {
              id : item?.batch_id?._id ?? "" ,
              title : item?.batch_id?.batch_name ?? "" ,
              banner :  item?.batch_id?.banner[0]?.fileLoc ?? "" , 
            }
           }) }, 
          msg: 'Student today lectures'
      })
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message 
    })
  }
})

parentRoute.get("/purchase", isParent, async (req, res) => {
  try {
    const parent =  await ParentTable.findOne({ parentId :  req.parentId });
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : "Not An Parent"
      })
    }
    const { userId } =  req.query ;
    if( !userId || !parent?.userIds?.includes(mongoose.Types.ObjectId(userId))){
      return res.json({
        status : false ,
        data : null ,
        msg : `Provide correct user`
      })
    }
    const transactionDetails = await paymentTransactionTable.find({
      user: userId,
    }).populate('couponId' , 'couponCode couponType couponValue').sort({ createdAt: -1 });

    const coursesOrder = await courseOrdesTable.find({ user: userId }).populate("courseId", "_id slug batch_name banner stream discount").populate('couponId' , 'couponCode couponType couponValue').sort({ createdAt: -1 })
    let data = [];
    for (let i = 0; i < transactionDetails.length; i++) {
      let batchDetails = await getBatchDetailsByBatchName(transactionDetails[i]?.batch_name);
      let myBatch = await MybatchTable.findOne({user : transactionDetails[i]?.user , batch_id :  batchDetails?._id } , {  is_active : 1 })
      // console.log(transactionDetails[i]?.batch_name);
      let couponDiscount = "0.00" ;
      // let couponCode = "" ; 
      if( transactionDetails[i]?.couponId){
        couponDiscount =  parseFloat(transactionDetails[i]?.couponId?.couponValue).toFixed(2);
        // couponCode = transactionDetails[i]?.couponId?.couponCode 
        if( transactionDetails[i]?.couponId && transactionDetails[i]?.couponId?.couponType == 'percentage'){
          couponDiscount = parseFloat(parseInt(batchDetails?.discount) * parseInt(transactionDetails[i]?.couponId?.couponValue) * 0.01 ).toFixed(2);
        }
      }
      let obj = {
        orderId: transactionDetails[i]?.orderId ?? "",
        userOrderId: transactionDetails[i]?.userOrederId ?? "",
        paymentStatus: transactionDetails[i]?.success == true ? "success" : 'failed' ?? "",
        amount: transactionDetails[i]?.amount ?? "",
        invoice: (transactionDetails[i]?.invoice == "" || (transactionDetails[i]?.invoice?.length >= 1 && transactionDetails[i]?.invoice[0] == "")) ? [{
          "installmentNumber": "",
          "fileUrl": ""
        }] : transactionDetails[i]?.invoice ?? [{
          "installmentNumber": "",
          "fileUrl": ""
        }] ,
        batchDetails: { id: batchDetails?._id ?? "",batchName: batchDetails?.batch_name ?? "" , amount :  batchDetails?.discount },
        platform: 'androidApp',
        courseOrderId: "", 
        purchaseDate : moment( transactionDetails[i].createdAt).format('DD-MM-YYYY') ?? "" , 
        couponDiscount : couponDiscount , 
        isActive : myBatch?.is_active ?? false,
      }
      data.push(obj);
    }
    for (let i = 0; i < coursesOrder.length; i++) {
      let myBatch = await MybatchTable.findOne({user : coursesOrder[i]?.user , batch_id :  coursesOrder[i]?.courseId } , {  is_active : 1 })
      let emiArray = [];
      if (coursesOrder[i]?.isEmi) {
        let emis = await emiTxnTable.find({ courseOrderId: coursesOrder[i]?._id, user: userId }).select("_id installmentNumber amount isPaid paidDate dueDate courseOrderId").sort({ installmentNumber: 1 }).collation({ locale: "en_US", numericOrdering: true });
        let payDate = coursesOrder[i]?.nextInstallmentDate;
        let minIndexOfFalse = 40;
        emis?.map((item, index) => {
          let next = false;
          if (item?.isPaid == false && (minIndexOfFalse > index)) {
            next = true;
            minIndexOfFalse = index;
          }
          let emiObj = {
            emiId: item?._id,
            paidDate: item?.paidDate == "" ? "NA" : item?.paidDate,
            dueDate: item?.dueDate ?? "",
            amount: item?.amount,
            paid: item?.isPaid,
            courseOrderId: item?.courseOrderId, 
            next,
            installmentNumber: item?.installmentNumber
          }
          emiArray.push(emiObj)
          if (item?.isPaid == false) {
            payDate = moment(payDate).add(31, 'days');
          }
        })
      }
      let couponDiscount = "0.00" ;
      // let couponCode = "" ; 
      if( coursesOrder[i]?.couponId){
        // couponCode = transactionDetails[i]?.couponId?.couponCode 
        couponDiscount =  parseFloat(coursesOrder[i]?.couponId?.couponValue).toFixed(2);
        if( coursesOrder[i]?.couponId && coursesOrder[i]?.couponId?.couponType == 'percentage'){
          couponDiscount = parseFloat(parseInt(coursesOrder[i]?.courseId?.discount) * parseInt(coursesOrder[i]?.couponId?.couponValue) * 0.01 ).toFixed(2);
        }
      }
      let obj = {
        courseOrderId: coursesOrder[i]?._id ?? "",
        orderId: coursesOrder[i]?.orderId ?? "",
        userOrderId: coursesOrder[i]?.txnId ?? "",
        paymentStatus: coursesOrder[i]?.paymentStatus ?? "",
        amount: coursesOrder[i]?.totalAmount ?? "",
        batchDetails: { id: coursesOrder[i]?.courseId?._id, batchName: coursesOrder[i]?.courseId?.batch_name ?? "" , amount : coursesOrder[i]?.courseId?.discount },
        invoice: (coursesOrder[i]?.invoice == "" || (coursesOrder[i]?.invoice?.length >= 1 && coursesOrder[i]?.invoice[0] == "")) ? [{
          "installmentNumber": "",
          "fileUrl": ""
        }] : coursesOrder[i]?.invoice ?? [{
          "installmentNumber": "",
          "fileUrl": ""
        }],
        platform: 'website',
        isEmi: coursesOrder[i]?.isEmi ?? "",
        nextInstallmentDate: coursesOrder[i]?.nextInstallmentDate ?? "",
        eachInstallmentAmount: coursesOrder[i]?.eachInstallmentAmount ?? "",
        pendingAmount: coursesOrder[i]?.pendingAmount ?? "",
        pendingInstallment: coursesOrder[i]?.pendingInstallment ?? "",
        noOfInstallments: coursesOrder[i]?.noOfInstallments ?? "",
        emiArray,
        purchaseDate : moment(coursesOrder[i].createdAt).format('DD-MM-YYYY') ?? "" ,
        isActive: myBatch?.is_active ?? false,  
        couponDiscount : couponDiscount,
      }
      data.push(obj);
    }
    return res.json({
      status: true,
      data: data,
      msg: `My purchased fetched`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

parentRoute.get('/duePayments' , isParent , async(req , res) => {
  try{
    const parent =  await ParentTable.findOne({ parentId :  req.parentId });
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : "Not An Parent"
      })
    }
    const { userId } =  req.query ;
    if( !userId || !parent?.userIds?.includes(mongoose.Types.ObjectId(userId))){
      return res.json({
        status : false ,
        data : null ,
        msg : `Provide correct user`
      })
    }
    const getMyBatches = await MybatchTable.find({ user: userId }).select('_id batch_id').populate('batch_id' , '_id batch_name banner');
    let mybatchIds = getMyBatches?.map((item) => { return item?._id });
    const emis = await saleEmiTable.find({ myBatchId: {  $in :  mybatchIds}, user: userId , isPaid : false }).sort({ createdAt: 1 }).populate('batch' ,'_id batch_name');
    let response =  [];
    for( let emi of emis){
      let obj =  {
        batchName : emi?.batch?.batch_name ?? "" , 
        expectedDate: moment(emi?.installmentDate).format("DD-MM-YYYY"),
        txnAmount: emi?.amount ?? "",
      }
      if( !response.find( (item) => item?.batchName == obj.batchName)){
        response.push(obj);
      }
    }
    return res.json({
      status: true,
      data: response,
      msg: 'details fetched'
    })

  }catch(error){
    return res.json({
      status : false ,
      data :  null ,
      msg :  error.message 
    })
  }
})


parentRoute.get('/deleteAccount' , isParent , async(req , res) => {
  try{
    const parent =  await ParentTable.findOne({ parentId :  req.parentId });
    if( !parent){
      return res.json({
        status : false ,
        data : null ,
        msg : "Not An Parent"
      })
    }
    await ParentTable.updateOne({ _id : parent?._id } , { isActive : false } )
    return res.json({
      status: true,
      data: null,
      msg: 'Account deleted sucessfully'
    })

  }catch(error){
    return res.json({
      status : false ,
      data :  null ,
      msg :  error.message 
    })
  }
})

parentRoute.get("/getDetails", isParent, async (req, res) => {
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
      const { userId , startDate , endDate , type } =  req.query ;
      const getMyBatches = await MybatchTable.find({ user: userId }).select('_id batch_id');
      let batchIds = getMyBatches?.map((item) => { return item?.batch_id });
      let startingDate = new Date(startDate);
      let endingDate = new Date(endDate);
      let end = new Date(endingDate.getUTCFullYear(), endingDate.getUTCMonth(), endingDate.getUTCDate(), 28, 89, 59, 59)
      let start = new Date(startingDate.getUTCFullYear(), startingDate.getUTCMonth(), startingDate.getUTCDate(), 5, 30, 0, 0)
      // console.log(start , end);
      let lectures = await LectureTable.find({ batch: batchIds, startingDate: { $gte: start, $lte: end }, isActive: true }).populate({
          path: 'teacher',
          select: '_id FullName qualification profilePhoto demoVideo',
          populate: {
              path: 'subject',
              // select : "title"
          }
      }).populate("batch", '_id batch_name slug banner').populate('subject').sort({ startingDate: 1 })
      return res.json({
          status: true,
          data: await Promise.all(lectures?.map(async (lecture) => {
            const notes = await LectureResourceTable.find({ lecture: lecture._id, resourceType: { $eq: "DPP" }, is_active: true });
            let allDpps =  notes?.map((item) => {
              return item.upload_file
            });
            let lectureDPP = {
              resource_title: lecture?.dpp?.fileName ?? "", resourceType: "pdf", file: lecture?.dpp ?? {
                fileLoc: "",
                fileName: "",
                fileSize: "",
              }
            }
           if(lectureDPP?.resource_title != "") allDpps.push(lectureDPP);
              return {
                  lectureTitle :  lecture?.lecture_title ?? "" ,  
                  teacher: lecture?.teacher[0]?.FullName ?? "",
                  allDpps :  allDpps , 
              }
          })),
          msg: 'Student today lectures'
      })



  } catch (error) {
      return res.json({
          status: false,
          data: null,
          msg: error.message
      })
  }
})

// getAllDPPs
parentRoute.get("/getDPPs", isParent, async (req, res) => {
  const { batchId } = req.query;
  if (!batchId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required"
    })
  }
  try {
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    const lectures = await LectureTable.find({ batch: batchId });
    let responseArr = [];
    for (let lec of lectures) {
      const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $eq: "DPP" }, is_active: true });
      let lectureDPP = {
        resource_title: lec?.dpp?.fileName ?? "", resourceType: "pdf", file: lec?.dpp ?? {
          fileLoc: "",
          fileName: "",
          fileSize: "",
        }
      }
      let resArr = [];
      if (lectureDPP.file.fileLoc != "") resArr.push(lectureDPP);
      notes.map((item) => {
        let resource = item.upload_file ?? {
          fileLoc: "",
          fileName: "",
          fileSize: "",
        }
        if (resource.fileLoc != "") resArr.push({ resource_title: item.title, resourceType: item.resourceType, file: resource });
      })
      if (resArr.length > 0) responseArr.push({ title: lec.lecture_title, res: resArr });
    }

    return res.json({
      status: true,
      data: responseArr,
      msg: 'All Dpps fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})
// get Materials of study 
parentRoute.delete("/deleteAccount" , isParent , async(req , res) => {
  try{
    const parent = await ParentTable.findOne({ parentId: req.parentId });
    if (!parent) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent not exist`,
      });
    } 
    await ParentTable.updateOne({ _id : parent?._id } , { token : ""  , isActive : false });
    return res.json({
      status : true ,
      data : null ,
      msg : `Account Deleted.`
    })
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message 
    })
  }
})

module.exports = parentRoute;
