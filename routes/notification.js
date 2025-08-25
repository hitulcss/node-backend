const express = require('express');
const { pushNotificationTable } = require('../models/pushNotification');
const jwt = require("jsonwebtoken");
const multer = require('multer');
const moment = require('moment');
// const schedule = require('node-schedule');
const { uploadFile } = require("../aws/UploadFile");
const { admin } = require("../routes/pushNotification");
const { sendBulkPushNotifications, sendPushNotification } = require("../firebaseService/fcmService");
const { getFcmTokenArrByUserIdArr } = require("../HelperFunctions/userFunctions");
const { isAdmin, ValidateToken } = require("../middleware/authenticateToken");
const { findAdminTeacherUsingUserId } = require('../HelperFunctions/adminTeacherFunctions');
const { BatchesTable } = require("../models/BatchesSchema");
const { UserTable } = require('../models/userModel');
const { categoryTable } = require("../models/category");
const { currentCategory } = require('../models/currentCateggory');
const { NewsClipsTable } = require('../models/News_clips');
const { cmsPostTable } = require('../models/CmsPost');
const { YouTube_Url } = require('../models/YouTubeSchema');
const { QuizTable } = require('../models/Quiz');

const upload = multer({ dest: "uploads/notification" });
const NotificationRoute = express.Router();


const sendBulkPushNotificationsAtScheduleTime = async (tokenArr, data, id, publishDate) => {
  if (tokenArr.length === 0) {
    return Promise.resolve([]);
  }
  // console.log("ReqData", data)
  const batchSize = 100; // Adjust the batch size as per your needs
  const numBatches = Math.ceil(tokenArr.length / batchSize);

  const successes = [];
  const failures = [];
  // console.log("Root ID:", rootIdString);
  // console.log("Child ID:", childIdString);

  const data1 = {
    rootId: data?.rootId.toString() || "",
    childId: data?.childId.toString() || ""
  };

  const sendBatch = async (tokens) => {
    const payload = {
      notification: {
        title: data?.title || "",
        body: data?.message || "",
        image:
          data?.fileUrl ||
          "",
        icon: "",
      },
      data: {
        route: data?.route || "",
        rootId: data?.rootId || "",
        childId: data?.childId || "",
        linkUrl: data?.linkUrl || "",

        // data: JSON.stringify(data1)
      },
    };
    // console.log("Payload", payload)

    try {
      const response = await admin.messaging().sendToDevice(tokens, payload);
      successes.push(
        ...response.results.map((result, index) => ({
          index: tokens[index],
          response: result,
        }))
      );
    } catch (error) {
      failures.push(...tokens.map((token) => ({ index: token, error })));
    }


  };

  const sendPromises = [];
  for (let i = 0; i < numBatches; i++) {
    const startIdx = i * batchSize;
    const endIdx = startIdx + batchSize;
    const batchTokens = tokenArr.slice(startIdx, endIdx);
    sendPromises.push(sendBatch(batchTokens));
  }

  await Promise.all(sendPromises);

  if (failures.length > 0) {
    const error = new Error("Error sending push notifications");
    error.failures = failures;
    throw error;
  }

  return successes;
};

const sendCustomNotification = async (userIdArr, data) => {
  let tokenArr = [];
  if (userIdArr === "all") {
    // console.log("All users");
    const users = await UserTable.find({});
    tokenArr = users.filter((e) => e?.fcmToken).map((e) => e.fcmToken);
  } else if (userIdArr.length > 0) {
    tokenArr = await getFcmTokenArrByUserIdArr(userIdArr);
  } else {
    const users = await UserTable.find({ email: "govind.s@sdempire.co.in" })
      .sort({ createdAt: -1 })
      .limit(1);
    tokenArr = users.filter((e) => e?.fcmToken != "").map((e) => e.fcmToken);
    // tokenArr = users.filter((e) => e?.fcmToken != "").map((e) => e.fcmToken);
  }
  // const data = { title: data?.title, message: data?.message, image: data?.file };
  // console.log(tokenArr);
  return sendBulkPushNotifications(tokenArr, data);
  // return sendBulkPushNotificationsAtScheduleTime(tokenArr, data);
};

NotificationRoute.post("/createNotification" , upload.single('file') , isAdmin ,  async(req,res) => {
    // const { userType , linkWith , publishDate , data , isActive } = req.body ;
    let { userType , linkWith , title , message , route , rootId , childId , linkUrl , publishDate , isActive } = req.body ;
    try{
        const decode = jwt.verify(req.token , process.env.ADMIN_SECRET_KEY);
        const admin = await findAdminTeacherUsingUserId(decode?.studentId);
        if(!admin){
            return res.json({
                status : false ,
                data : null ,
                msg : "Not an admin"
            })
        }
        // console.log( typeof(linkWith))
        if( userType != "all" && (!linkWith || linkWith?.length < 0)  ){
          return res.json({
            status : false ,
            data : null ,
            msg : `Please Select linkWith`
          })
        }
        linkWith = linkWith?.filter((item) => item != "");

        if( (route == "ytvideosbyid" || route == "feedById" || route == 'mybatchbyid' || route == "batchbyid" || route == "dailyQuizbyid" ) && ["" , "undefined" , undefined , null ,"null"].includes(rootId)){
          return res.json({
            status : false ,
            data : null ,
            msg : "Please Select Specfic YTVideo Or Feed Or Batch Or quiz"
          })

        }
        let data = {
          title : title ?? "",
          message : message ?? "",
          route : route ?? "",
          rootId : rootId ??  "",
          childId : childId ?? "",
          linkUrl :  linkUrl
        }
        let fileLoc = "";
      if (req.file) {
        size = req.file.size / (1024);
        if (size > 100) {
          return res.json({
            status: false,
            data: null,
            msg: 'icon size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = req.file.originalname.split(".")[0].replace(/\s+/g , '_');
        const extension = "." + req.file.originalname.split(".").pop();
        FileUploadLocation = `notification/${title.replace(/\s+/g , '_')}/${filename}_${helperString}${extension}`;
        let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        fileLoc = helperfileLoc ;
        data.fileUrl = fileLoc
      }else{
        data.fileUrl = ""
      }
        const newNotification = new pushNotificationTable({
            admin : admin?._id,
            userType ,
            linkWith ,
            publishDate,
            data ,
            isActive
        })
        const saveNotification = await newNotification.save();
        return res.json({
            status : true ,
            data : saveNotification,
            msg : `New Notification Saved`
        })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.put("/sendNotification/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id'
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an admin'
      })
    }
    const isNotification = await pushNotificationTable.findOne({ _id: id })
    let users = [];
    //  extract user 
    // case 1 --> all user ,
    // console.log(isNotification?.linkWith);
    switch (isNotification?.userType) {
      case "all": {
        // 
        users = 'all'
        break;
      }
      case 'batch': {
        // 
        // console.log('batch condition')
        for (let i = 0; i < isNotification?.linkWith.length; i++) {
          let batch = await BatchesTable.findOne({ _id: isNotification?.linkWith[i] });
          users = users.concat(batch?.student);
        }

        break;
      }
      case 'category': {

        // linkWith is catgeory id 
        for (let i = 0; i < isNotification?.linkWith?.length; i++) {
          let category = await categoryTable.findOne({ _id: isNotification?.linkWith[i] });
          // console.log(category?.title);
          let allUsers = await UserTable.find({ Stream: { $in: category?.title } })
          let categoryUser = allUsers.map((user) => { return user?._id });
          users = users.concat(categoryUser);
        }

        break;

      }
      case 'currentCategory': {
        // 
        for (let i = 0; i < isNotification?.linkWith?.length; i++) {
          let currentCats = await currentCategory.find({ categoryId: isNotification?.linkWith[i] });
          let categoryUser = currentCats.map((item) => { return item?.user });
          users = users.concat(categoryUser);
        }

        break;

      }

    }

    // console.log(users);
    // users = ["6588a16c9d5618633c7cdea2"] // sir
    // users  = ["659e8202488565db021488aa"]
    //  remove user duplicate 
    // console.log(users)
    // users  = [ ...new Set(users)]
    await sendCustomNotification(users, isNotification.data);
    return res.json({
      status: true,
      data: null,
      msg: 'Notificition Send'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.get("/getAllNotification", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an Admin'
      })
    }

    const notifications = await pushNotificationTable.find({}).populate("admin", 'FullName Role').sort({ createdAt: -1 });
    let responseArr = await Promise.all(notifications.map(async (item, index) => {
      let link = "";
      let linkWith = [];
      switch (item?.userType) {
        case 'all': {
          link = "All";
          linkWith: ['All'];
          break;
        }
        case 'category': {
          for (let i = 0; i < item?.linkWith?.length; i++) {
            let category = await categoryTable.findOne({ _id: item?.linkWith[i] }).select('_id title');
            linkWith.push(category?.title);
          }
          link = "Category";
          break;
        }
        case 'currentCategory': {
          for (let i = 0; i < item?.linkWith?.length; i++) {
            let category = await categoryTable.findOne({ _id: item?.linkWith[i] }).select('_id title');
            linkWith.push(category?.title);
          }
          link = "Current Category";
          break;
        }
        case 'batch': {
          for (let i = 0; i < item?.linkWith?.length; i++) {
            let batch = await BatchesTable.findOne({ _id: item?.linkWith[i] }).select('_id batch_name');
            linkWith.push(batch?.batch_name);
          }
          link = "Batch";
          break;
        }
      }
      return {
        id: item?._id,
        sNo: index + 1,
        // data : item?.data ?? {},
        admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
        title: item?.data?.title,
        message: item?.data?.message,
        route: item?.data?.route,
        link,
        linkWith,
        isActive: item?.isActive,
        createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss')

      }
    }))

    return res.json({
      status: true,
      data: responseArr,
      msg: `All Notification found`
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.delete("/deleteNotification/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id'
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin"
      })
    }
    const notification = await pushNotificationTable.findByIdAndDelete(id);
    if (!notification) {
      return res.json({
        status: false,
        data: null,
        msg: `Notificcation not found`
      })
    }

    return res.json({
      status: true,
      data: null,
      msg: `Notification Deleted Succesfully`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.get("/getNewsClips", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an admin'
      })
    }
    const news = await NewsClipsTable.find({ is_active: true });
    return res.json({
      status: false,
      data: news.map((item) => {
        return {
          ...item?._doc,
          id: item?._id,
          value: item?._id,
          label: item?.title,
        }
      })
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.get("/getFeeds", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an admin'
      })
    }
    const news = await cmsPostTable.find({ isActive: true });
    return res.json({
      status: false,
      data: news.map((item) => {
        return {
          ...item?._doc,
          id: item?._id,
          value: item?._id,
          label: item?.title,
        }
      })
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.get("/getYTVideos", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an admin'
      })
    }
    const ytVideo = await YouTube_Url.find({ is_active: true });
    return res.json({
      status: false,
      data: ytVideo?.map((item) => {
        return {
          ...item?._doc,
          id: item?._id,
          label: item?.title,
          value: item?._id
        }
      }),
      msg: 'All Youtube Video Fetched '
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

NotificationRoute.get("/getDailyQuiz", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an Admin"
      })
    }

    const quizs = await QuizTable.find({ is_active: true })
    return res.json({
      status: true,
      data: quizs.map((item) => {
        return {
          value: item?._id ?? "",
          label: item?.quiz_title ?? "",
          _id: item?._id ?? ""
        }
      })
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


module.exports = NotificationRoute
