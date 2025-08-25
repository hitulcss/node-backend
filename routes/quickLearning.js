const express = require('express');
const mongoose = require('mongoose');
const { ValidateToken, isAdmin, ValidateTokenForUser } = require('../middleware/authenticateToken');
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../aws/UploadFile");
const multer = require("multer");
const {
  findAdminTeacherUsingUserId,
} = require("../HelperFunctions/adminTeacherFunctions");
const moment = require("moment");
const { savePanelEventLogs } = require("../HelperFunctions/storeLogs");
const { channelTable } = require('../models/Channel');
const uploadVideo = require('../aws/uploadVideo');
const { shortTable } = require('../models/Short');
const { genrateDeepLink } = require('../HelperFunctions/genrateDeepLink');
const { shortLikeTable } = require('../models/ShortLike');
const { UserTable } = require('../models/userModel');
const { shortCommentReplyTable } = require('../models/ShortCommentReply');
const { shortCommentTable } = require('../models/ShortComment');
const { shortSavedTable } = require('../models/ShortSaved');
const { shortViewTable } = require('../models/ShortView');

const getSignUrlForLearning = require('../aws/getSignedUrlForLearning');
const { badWordCheck } = require('../HelperFunctions/BadWordCheck');
const { channelSubscribeTable } = require('../models/ChannelSubscribe');
const { shortReportTable } = require('../models/ShortReport');
const { shortCommentReportTable } = require('../models/ShortCommentReport');
const { shortCommentReplyReportTable } = require('../models/ShortCommentReplyReport');
const uploadCheck = require('../aws/uploadCheck');
const { uploadVideoFile } = require('../aws/uploadVideoFile');
require("dotenv").config();
const learningRoute = express.Router();
const upload = multer({ dest: "uploads/quickLearning" });

learningRoute.post("/createChannel", upload.single('file'), isAdmin, async (req, res) => {
  try {
    const { name, description, isActive, categories } = req.body;
    let categoryIds = categories?.filter((item) => item != "");
    if (!name || !description || categoryIds.length <= 0 || ![true, false, 'true', 'false'].includes(isActive)) {
      return res.json({
        status: false,
        data: null,
        msg: `Required name description category and status.`
      })
    }

    let fileLoc = "https://static.sdcampus.com/AIR/sdcampus_logo_1715583423.png";
    if (req.file) {
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `Channels/${name}/${filename}_${helperString}${extension}`;
      let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
      fileLoc = helperfileLoc;
    }

    //   shareLink creation 

    const channel = await channelTable.create({ admin: req.adminId, name, profile: fileLoc, description, category: categoryIds, isActive });
    // let link = `https://www.sdcampus.com?route=${`channelbyid`}&rootId=${channel?._id}&childId=null`
    let link = `https://www.sdcampus.com?route=${`quicklearningChannel`}&rootId=${channel?._id}&childId=null`

    let details = {
      "link": link ?? "",
      "utmSource": "web_app",
      "utmMedium": "refer",
      "utmCampaign": "share_channel",
      "utmTerm": "",
      "utmContent": "",
      "socialTitle": name ?? "",
      "socialDescription": "",
      "socialImageLink": fileLoc ?? ""
    }
    let data1 = await genrateDeepLink(details);
    await channelTable.findByIdAndUpdate(channel?._id, { shareLink: { link: data1.shortLink, text: name } })
    return res.json({
      status: true,
      data: null,
      msg: 'Channel created'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


learningRoute.post("/uploadShortVideo", upload.single('file'), isAdmin, async (req, res) => {
  try {
    const { title, channel, description, isActive } = req.body;
    if (!title || !description || !channel || ![true, false, 'true', 'false'].includes(isActive)) {
      return res.json({
        status: false,
        data: null,
        msg: `Required Title Description Channel and status!`
      })
    }

    let fileLoc = [];
    if (req.file) {
      let size = req.file.size / (1024 * 1024);
      if (size > 10) {
        return res.json({
          status: false,
          data: null,
          msg: 'Maximum Video size 10 MB allowed'
        })
      }
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `Channels/Video/${title}/${filename}_${helperString}${extension}`;
      let helperfileLoc = await uploadVideoFile(req.file.path, FileUploadLocation, req.file.mimetype);
      fileLoc = helperfileLoc;
    } else {
      return res.json({
        status: false,
        data: null,
        msg: 'Required Video file'
      })
    }

    //   shareLink creation 

    const short = await shortTable.create({ admin: req.adminId, channel, title, urls: fileLoc, description, isActive });
    // let link = `https://www.sdcampus.com?route=${`shortLearningbyid`}&rootId=${short?._id}&childId=null`
    let link = `https://www.sdcampus.com?route=${`quicklearningById`}&rootId=${short?._id}&childId=null`

    let details = {
      "link": link ?? "",
      "utmSource": "web_app",
      "utmMedium": "refer",
      "utmCampaign": "share_short",
      "utmTerm": "",
      "utmContent": "",
      "socialTitle": title ?? "",
      "socialDescription": "",
      "socialImageLink": ""
    }
    let data1 = await genrateDeepLink(details);
    await shortTable.findByIdAndUpdate(short?._id, { shareLink: { link: data1.shortLink, text: title } })
    return res.json({
      status: true,
      data: null,
      msg: 'Short created'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

learningRoute.post("/likeOrRemoveLikeOfShort", ValidateTokenForUser, async (req, res) => {
  const { shortId } = req.body;
  if (!shortId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required videotId`
    })
  }
  try {
    const isShortExist = await shortTable.findOne({ _id: shortId });
    if (!isShortExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'Video not exists'
      })
    }

    const isLiked = await shortLikeTable.findOne({ user: req.userId, short: shortId });
    if (isLiked) {
      await shortLikeTable.findByIdAndDelete(isLiked?._id);
      return res.json({
        status: true,
        data: null,
        msg: `Like removed`,
      })
    } else {
      const newLike = new shortLikeTable({
        short: shortId,
        user: req.userId,
      })
      await newLike.save();
      return res.json({
        status: true,
        data: null,
        msg: `Liked`,
      })
    }

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})
// post comment by user 
learningRoute.post("/addCommentToShort", ValidateTokenForUser, async (req, res) => {
  const { shortId, msg } = req.body;
  if (!shortId || !msg) {
    return res.json({
      status: false,
      data: null,
      msg: `Required shortId & msg`
    })
  }
  try {
    const user = await UserTable.findOne({ _id: req.userId }).select('FullName profilePhoto email mobileNumber isVerified');
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    if (await badWordCheck(msg)) {
      return res.json({
        status: false,
        data: null,
        msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
      })
    }
    const isShortExist = await shortTable.findOne({ _id: shortId });
    if (!isShortExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'Video not exists'
      })
    }
    const newComment = new shortCommentTable({
      short: shortId,
      user: req.userId,
      msg: msg
    })
    const saveComment = await newComment.save();
    return res.json({
      status: true,
      data: {
        id: saveComment?._id ?? "",
        msg: saveComment?.msg,
        user: { id: user?._id, name: user?.FullName ?? "", profilePhoto: user?.profilePhoto ?? "", isVerified: user?.isVerified ?? false },
        createdAt: moment(saveComment?.createdAt).fromNow(),
        replies: [],
        isMyComment: true,
      },
      msg: "New comment added"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

// reply to a comments by user
learningRoute.post("/replyToComments", ValidateTokenForUser, async (req, res) => {
  const { commentId, msg, replyTo } = req.body;
  if (!commentId || !msg) {
    return res.json({
      status: false,
      data: null,
      msg: `Required commentId & msg & replyTo`
    })
  }
  try {
    if (await badWordCheck(msg)) {
      return res.json({
        status: false,
        data: null,
        msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
      })
    }
    const user = await UserTable.findOne({ _id: req.userId }).select('FullName profilePhoto email mobileNumber isVerified');
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isComment = await shortCommentTable.findOne({ _id: commentId, user: replyTo }).populate('user', 'FullName profilePhoto email mobileNumber isVerified');
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: 'Comment not exists.'
      })
    }
    const newReply = new shortCommentReplyTable({
      comment: commentId,
      user: req.userId,
      msg: msg,
      replyTo,
    })
    const saveReply = await newReply.save();
    return res.json({
      status: true,
      data: {
        id: saveReply?._id ?? "",
        msg: saveReply?.msg,
        isMyReply: true,
        user: { id: user?._id, name: user?.FullName ?? "", profilePhoto: user?.profilePhoto ?? "", isVerified: user?.isVerified ?? false },
        createdAt: moment(saveReply?.createdAt).fromNow(),
        replyTo: { id: isComment?.user?._id, name: isComment?.user?.FullName ?? "", profilePhoto: isComment?.user?.profilePhoto ?? "", isVerified: isComment?.user?.isVerified ?? false }
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
learningRoute.delete("/deleteComment", ValidateTokenForUser, async (req, res) => {
  const { commentId } = req.query;
  if (!commentId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required commentId`
    })
  }
  try {

    const isDelete = await shortCommentTable.findOneAndDelete({ _id: commentId, user: req.userId });
    if (isDelete) {
      // console.log(isDelete);
      await shortCommentReplyTable.deleteMany({ comment: isDelete?._id });
      return res.json({
        status: true,
        data: null,
        msg: 'Comment delete successfully.'
      })
    } else {
      return res.json({
        status: false,
        data: null,
        msg: 'Comment not found'
      })
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
learningRoute.delete("/deleteReplyComment", ValidateTokenForUser, async (req, res) => {
  const { replyCommentId } = req.query;
  if (!replyCommentId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required replyCommentId`
    })
  }
  try {
    const isDelete = await shortCommentReplyTable.findOneAndDelete({ _id: replyCommentId, user: req.userId });
    // console.log(isDelete);
    if (isDelete) {
      return res.json({
        status: true,
        data: null,
        msg: 'Reply comment delete successfully.'
      })
    } else {
      return res.json({
        status: false,
        data: null,
        msg: 'Reply comment not found'
      })
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

// increases the share count 
learningRoute.put("/shareCount", ValidateTokenForUser, async (req, res) => {
  const { shortId } = req.query;
  if (!shortId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required shortId`
    })
  }
  try {
    const isShort = await shortTable.findOne({ _id: shortId }).select('_id shareCount');
    if (!isShort) {
      return res.json({
        status: true,
        data: null,
        msg: 'Short not exist'
      })
    }
    let newShareCount = isShort?.shareCount + 1;
    await shortTable.findOneAndUpdate({ _id: isShort?._id, shareCount: newShareCount });
    return res.json({
      status: true,
      data: null,
      msg: ''
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})
// getShortsVideoes
learningRoute.get("/getShortVideos", ValidateTokenForUser, async (req, res) => {
  try {
    let { page, pageSize } = req.query;
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    const shorts = await shortTable.aggregate([
      {
        $facet: {
          shorts: [
            {
              $match: { isActive: true }
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
                from: 'channels',
                foreignField: '_id',
                localField: 'channel',
                as: 'channelDetails'
              }
            },
            {
              $unwind: {
                path: '$channelDetails',
                preserveNullAndEmptyArrays: true
              }
            },


            {
              $lookup: {
                from: 'shortlikes',
                foreignField: 'short',
                localField: '_id',
                as: 'shortLikes'
              }
            },

            {
              $lookup: {
                from: 'shortviews',
                foreignField: 'short',
                localField: '_id',
                as: 'shortViews'
              }
            },


            {
              $lookup: {
                from: 'shortcomments',
                let: { shortId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$short', "$$shortId"] } } },
                ],
                as: 'comments'
              }
            },
            {
              $project: {
                id: '$_id',
                _id: 0,
                description: 1,
                title: 1,
                urls: 1,
                createdAt: 1,
                shareLink: 1,
                shareCount: 1,
                channel: { id: "$channelDetails._id", name: '$channelDetails.name', profile: '$channelDetails.profile' },
                commentCounts: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } },
                likes: { $cond: { if: { $isArray: '$shortLikes' }, then: { $size: '$shortLikes' }, else: 0 } },
                views: { $cond: { if: { $isArray: '$shortViews' }, then: { $size: '$shortViews' }, else: 0 } }
              }
            }
          ],
          totalCounts: [
            { $match: { isActive: true } },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $replaceWith: { count: "$count" } },
            { $project: { _id: 0, count: 1 } }
          ]
        }
      },
      {
        $project: {
          shorts: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
        }
      }

    ]);
    // console.log(shorts);
    return res.json({
      status: true,
      data: {
        totalCounts: shorts[0]?.totalCounts ?? 0,
        shorts: await Promise.all(shorts[0]?.shorts?.map(async (item) => {
          const isLiked = await shortLikeTable.findOne({ short: item?.id, user: req?.userId });
          const isSaved = await shortSavedTable.findOne({ short: item?.id, user: req?.userId });
          return {
            ...item,
            isLiked: isLiked ? true : false,
            isSaved: isSaved ? true : false,
            urls: await Promise.all(item?.urls?.map(async (item2) => {
              // console.log(item2);
              return {
                label: item2?.label ?? "",
                url: await getSignUrlForLearning(item2?.url ?? "")
              }
            })),
            createdAt: moment(item?.createdAt).fromNow(),
          }
        })) ?? { short: [], totalCounts: 0 }
      },
      msg: `Shorts fetch successfully`,
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
// getShortDetails
learningRoute.get("/getShortVideoDetails", ValidateTokenForUser, async (req, res) => {
  try {
    let { shortId } = req.query;
    const isView = await shortViewTable.findOne({ short: shortId, user: req.userId });
    if (!isView) {
      await shortViewTable.create({ short: shortId, user: req.userId });
    }
    const short = await shortTable.aggregate([
      {
        $match: { isActive: true, _id: mongoose.Types.ObjectId(shortId) }
      },

      {
        $lookup: {
          from: 'channels',
          foreignField: '_id',
          localField: 'channel',
          as: 'channelDetails'
        }
      },
      {
        $unwind: {
          path: '$channelDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'shortlikes',
          foreignField: 'short',
          localField: '_id',
          as: 'shortLikes'
        }
      },

      {
        $lookup: {
          from: 'shortviews',
          foreignField: 'short',
          localField: '_id',
          as: 'shortViews'
        }
      },


      {
        $lookup: {
          from: 'shortcomments',
          let: { shortId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$short', "$$shortId"] } } },
          ],
          as: 'comments'
        }
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          description: 1,
          title: 1,
          urls: 1,
          createdAt: 1,
          shareLink: 1,
          shareCount: 1,
          channel: { _id: "$channelDetails._id", name: '$channelDetails.name', profile: '$channelDetails.profile' },
          commentCounts: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } },
          likes: { $cond: { if: { $isArray: '$shortLikes' }, then: { $size: '$shortLikes' }, else: 0 } },
          views: { $cond: { if: { $isArray: '$shortViews' }, then: { $size: '$shortViews' }, else: 0 } }
        }
      }

    ]);
    const isLiked = await shortLikeTable.findOne({ short: short[0]?.id, user: req?.userId });
    const isSaved = await shortSavedTable.findOne({ short: short[0]?.id, user: req?.userId });
    let resObj = {
      ...short[0],
      isLiked: isLiked ? true : false,
      isSaved: isSaved ? true : false,
      urls: await Promise.all(short[0]?.urls?.map(async (item2) => {
        return {
          label: item2?.label ?? "",
          url: await getSignUrlForLearning(item2?.url)
        }
      })),
      createdAt: moment(short[0]?.createdAt).fromNow(),
    }
    return res.json({
      status: true,
      data: resObj,
      msg: `Short fetch successfully`,
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
// getShortsComments 


// channel subscribe
learningRoute.post("/channelSubscribeOrUnSubscribe", ValidateTokenForUser, async (req, res) => {
  const { channelId } = req.body;
  try {
    if (!channelId) {
      return res.json({
        status: false,
        data: null,
        msg: 'Required channel details'
      })
    }
    const isSubscribed = await channelSubscribeTable.findOne({ channel: channelId, user: req.userId });
    if (isSubscribed) {
      await channelSubscribeTable.findOneAndDelete({ _id: isSubscribed?._id });
      return res.json({
        status: false,
        data: null,
        msg: 'Removed following'
      })
    } else {
      await channelSubscribeTable.create({ channel: channelId, user: req.userId });
      return res.json({
        status: true,
        data: null,
        msg: 'Started following'
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
// channel profile
learningRoute.get("/channelProfile", ValidateTokenForUser, async (req, res) => {
  const { channelId } = req.query;
  try {
    if (!channelId) {
      return res.json({
        status: false,
        data: null,
        msg: 'Required channel details'
      })
    }
    const channel = await channelTable.findOne({ _id: channelId }).populate('category', '_id title');
    const subscribes = await channelSubscribeTable.countDocuments({ channel: channelId });
    const shorts = await shortTable.find({ channel: channel?._id }).select('_id');
    let shortIds = shorts?.map((item) => { return item?._id });
    const views = await shortViewTable.countDocuments({ short: { $in: shortIds } });
    const likes = await shortLikeTable.countDocuments({ short: { $in: shortIds } });
    const isSubscribed = await channelSubscribeTable.findOne({ channel: channel?._id, user: req.userId });

    return res.json({
      status: true,
      data: {
        id: channel?._id ?? "",
        name: channel?.name ?? "",
        description: channel?.description ?? "",
        shareLink: channel?.shareLink ?? {},
        profile: channel?.profile ?? "https://static.sdcampus.com/AIR/sdcampus_logo_1715583423.png",
        category: channel?.category?.map((item) => { return item?.title }),
        likeCount: likes ?? 0,
        viewCount: views ?? 0,
        subscriberCount: subscribes ?? 0,
        shortCount: shorts?.length ?? 0,
        isSubscribe: isSubscribed?._id ? true : false,
      },
      msg: 'Channel profile fetch successfully'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

// report the short 
learningRoute.post("/reportShort", ValidateTokenForUser, async (req, res) => {
  const { shortId, reason } = req.body;
  if (!shortId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required short details`
    })
  }
  try {
    const isReport = await shortReportTable.findOne({ short: shortId, user: req.userId }).select('_id');
    if (!isReport) {
      await shortReportTable.create({ short: shortId, user: req.userId, reason });
      return res.json({
        status: true,
        data: null,
        msg: 'Reported successfully.'
      })
    } else {
      return res.json({
        status: false,
        data: null,
        msg: 'Already reported.'
      })
    }


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

// getMySaved
learningRoute.get("/mySaved", ValidateTokenForUser, async (req, res) => {
  try {
    let { page, pageSize } = req.query;
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    const myShorts = await shortSavedTable.find({ user: req.userId }).select('short');
    let shortIds = myShorts?.map((item) => { return item?.short });

    const shorts = await shortTable.aggregate([
      {
        $facet: {
          shorts: [
            {
              $match: { _id: { $in: shortIds }, isActive: true }
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
                from: 'channels',
                foreignField: '_id',
                localField: 'channel',
                as: 'channelDetails'
              }
            },
            {
              $unwind: {
                path: '$channelDetails',
                preserveNullAndEmptyArrays: true
              }
            },


            {
              $lookup: {
                from: 'shortlikes',
                foreignField: 'short',
                localField: '_id',
                as: 'shortLikes'
              }
            },

            {
              $lookup: {
                from: 'shortviews',
                foreignField: 'short',
                localField: '_id',
                as: 'shortViews'
              }
            },


            {
              $lookup: {
                from: 'shortcomments',
                let: { shortId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$short', "$$shortId"] } } },
                ],
                as: 'comments'
              }
            },
            {
              $project: {
                id: '$_id',
                _id: 0,
                description: 1,
                title: 1,
                urls: 1,
                createdAt: 1,
                shareLink: 1,
                shareCount: 1,
                channel: { id: "$channelDetails._id", name: '$channelDetails.name', profile: '$channelDetails.profile' },
                commentCounts: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } },
                likes: { $cond: { if: { $isArray: '$shortLikes' }, then: { $size: '$shortLikes' }, else: 0 } },
                views: { $cond: { if: { $isArray: '$shortViews' }, then: { $size: '$shortViews' }, else: 0 } }
              }
            }
          ],
          totalCounts: [
            { $match: { _id: { $in: shortIds }, isActive: true } },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $replaceWith: { count: "$count" } },
            { $project: { _id: 0, count: 1 } }
          ]
        }
      },
      {
        $project: {
          shorts: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
        }
      }

    ]);
    return res.json({
      status: true,
      data: {
        totalCounts: shorts[0]?.totalCounts ?? 0,
        shorts: await Promise.all(shorts[0]?.shorts?.map(async (item) => {
          const isLiked = await shortLikeTable.findOne({ short: item?.id, user: req?.userId });
          const isSaved = await shortSavedTable.findOne({ short: item?.id, user: req?.userId });
          return {
            ...item,
            isLiked: isLiked ? true : false,
            isSaved: isSaved ? true : false,
            urls: await Promise.all(item?.urls?.map(async (item2) => {
              return {
                label: item2?.label ?? "",
                url: await getSignUrlForLearning(item2?.url)
              }
            })),
            createdAt: moment(item?.createdAt).fromNow(),
          }
        })) ?? { short: [], totalCounts: 0 }
      },
      msg: `Shorts fetch successfully`,
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

// getComments 
learningRoute.get("/getComments", ValidateTokenForUser, async (req, res) => {
  let { shortId, page, pageSize } = req.query;
  if (!shortId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Short details required.'
    })
  }
  try {
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    const comments = await shortCommentTable.aggregate([
      {
        $facet: {
          comments: [
            { $match: { short: mongoose.Types.ObjectId(shortId) } },
            { $sort: { createdAt: -1 } },
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
                from: 'shortcommentreplies',
                let: { 'commentId': '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$comment', '$$commentId'] } } },
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
                      from: 'userstables',
                      localField: 'replyTo',
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
                      msg: '$msg',
                      createdAt: 1,
                      _id: 0,
                      user: {
                        id: '$userDetails._id',
                        name: '$userDetails.FullName',
                        profilePhoto: '$userDetails.profilePhoto',
                        isVerified: '$userDetails.isVerified'
                      },
                      replyTo: {
                        id: '$replyUserDetails._id',
                        name: '$replyUserDetails.FullName',
                        profilePhoto: '$replyUserDetails.profilePhoto',
                        isVerified: '$replyUserDetails.isVerified'
                      },
                    }
                  },
                ],
                as: 'replies'
              },

            },
            {
              $project: {
                id: '$_id',
                msg: '$msg',
                _id: 0,
                createdAt: 1,
                replies: 1,
                user: {
                  id: '$userDetails._id',
                  name: '$userDetails.FullName',
                  profilePhoto: '$userDetails.profilePhoto',
                  isVerified: '$userDetails.isVerified'
                },
              }
            },

          ],
          totalCounts: [
            { $match: { short: mongoose.Types.ObjectId(shortId) } },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $replaceWith: { count: "$count" } },
            { $project: { _id: 0, count: 1 } }
          ],
        }

      },
      {
        $project: {
          comments: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
        }
      }
    ])
    // const userId = mongoose.Types.ObjectId(req.userId);
    return res.json({
      status: true,
      data: {
        totalCounts: comments[0]?.totalCounts ?? 0,
        comments: comments[0]?.comments?.map((item) => {
          return {
            ...item,
            isMyComment: req.userId.equals(item?.user?.id) ?? false,
            createdAt: moment(item?.createdAt).fromNow(),
            replies: item?.replies?.map((item2) => {
              return {
                ...item2,
                isMyReply: req.userId.equals(item2?.user?.id) ?? false,
                createdAt: moment(item2?.createdAt).fromNow(),
              }
            })
          }
        }) ?? { comments: [], totalCounts: 0 }
      },
      msg: 'Comment fetch successfully'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

// viewed
learningRoute.post("/viewed", ValidateTokenForUser, async (req, res) => {
  const { shortId } = req.body;
  if (!shortId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required short details`
    })
  }
  try {
    const isView = await shortViewTable.findOne({ short: shortId, user: req.userId }).select('_id');
    if (!isView) {
      await shortViewTable.create({ short: shortId, user: req.userId });
    }
    return res.json({
      status: true,
      data: null,
      msg: 'Viewed'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})
// marke saved or unsaved
learningRoute.post("/makeSaveOrUnsave", ValidateTokenForUser, async (req, res) => {
  const { shortId } = req.body;
  if (!shortId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required short details`
    })
  }
  try {
    const isSaved = await shortSavedTable.findOne({ short: shortId, user: req.userId }).select('_id');
    // console.log(isSaved);
    if (!isSaved) {
      await shortSavedTable.create({ short: shortId, user: req.userId });
      return res.json({
        status: true,
        data: null,
        msg: 'Video Saved Successfully.'
      })
    } else {
      await shortSavedTable.deleteOne({ short: shortId, user: req.userId });
      return res.json({
        status: true,
        data: null,
        msg: 'Video removed from saved'
      })
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

// getShortByChannel Id 
learningRoute.get("/getShortVideosByChannel", ValidateTokenForUser, async (req, res) => {
  try {
    let { channelId, page, pageSize } = req.query;
    if (!channelId) {
      return res.json({
        status: false,
        data: null,
        msg: 'Required channel detail'
      })
    }
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    const shorts = await shortTable.aggregate([
      {
        $facet: {
          shorts: [
            {
              $match: { channel: mongoose.Types.ObjectId(channelId), isActive: true }
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
                from: 'channels',
                foreignField: '_id',
                localField: 'channel',
                as: 'channelDetails'
              }
            },
            {
              $unwind: {
                path: '$channelDetails',
                preserveNullAndEmptyArrays: true
              }
            },


            {
              $lookup: {
                from: 'shortlikes',
                foreignField: 'short',
                localField: '_id',
                as: 'shortLikes'
              }
            },

            {
              $lookup: {
                from: 'shortviews',
                foreignField: 'short',
                localField: '_id',
                as: 'shortViews'
              }
            },


            {
              $lookup: {
                from: 'shortcomments',
                let: { shortId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$short', "$$shortId"] } } },
                ],
                as: 'comments'
              }
            },
            {
              $project: {
                id: '$_id',
                _id: 0,
                description: 1,
                title: 1,
                urls: 1,
                createdAt: 1,
                shareLink: 1,
                shareCount: 1,
                channel: { id: "$channelDetails._id", name: '$channelDetails.name', profile: '$channelDetails.profile' },
                commentCounts: { $cond: { if: { $isArray: '$comments' }, then: { $size: '$comments' }, else: 0 } },
                likes: { $cond: { if: { $isArray: '$shortLikes' }, then: { $size: '$shortLikes' }, else: 0 } },
                views: { $cond: { if: { $isArray: '$shortViews' }, then: { $size: '$shortViews' }, else: 0 } }
              }
            }
          ],
          totalCounts: [
            { $match: { channel: mongoose.Types.ObjectId(channelId), isActive: true } },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $replaceWith: { count: "$count" } },
            { $project: { _id: 0, count: 1 } }
          ]
        }
      },
      {
        $project: {
          shorts: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
        }
      }

    ]);
    return res.json({
      status: true,
      data: {
        totalCounts: shorts[0]?.totalCounts ?? 0,
        shorts: await Promise.all(shorts[0]?.shorts?.map(async (item) => {
          const isLiked = await shortLikeTable.findOne({ short: item?.id, user: req?.userId });
          const isSaved = await shortSavedTable.findOne({ short: item?.id, user: req?.userId });
          return {
            ...item,
            isLiked: isLiked ? true : false,
            isSaved: isSaved ? true : false,
            urls: await Promise.all(item?.urls?.map(async (item2) => {
              return {
                label: item2?.label ?? "",
                url: await getSignUrlForLearning(item2?.url)
              }
            })),
            createdAt: moment(item?.createdAt).fromNow(),
          }
        })) ?? { short: [], totalCounts: 0 }
      },
      msg: `Shorts fetch successfully`,
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

// edit comment by user 
learningRoute.post("/editComment", ValidateTokenForUser, async (req, res) => {
  const { commentId, msg } = req.body;
  if (!commentId || !msg) {
    return res.json({
      status: false,
      data: null,
      msg: `Required commentId & msg`
    })
  }
  try {
    if (await badWordCheck(msg)) {
      return res.json({
        status: false,
        data: null,
        msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
      })
    }
    const isComment = await shortCommentTable.findOne({ _id: commentId, user: req.userId }).populate('user', '_id FullName profilePhoto isVerified');
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: 'Comment not exists'
      })
    }
    const newComment = await shortCommentTable.findOneAndUpdate({ _id: commentId }, {
      msg: msg
    }, { new: true, lean: true });
    const replies = await shortCommentReplyTable.find({ comment: commentId }).populate('user', 'FullName profilePhoto email mobileNumber isVerified').populate('replyTo', 'FullName profilePhoto email mobileNumber isVerified')
    return res.json({
      status: true,
      data: {
        id: newComment?._id ?? "",
        msg: newComment?.msg,
        isMyComment: true,
        user: { id: isComment?.user?._id, name: isComment?.user?.FullName ?? "", profilePhoto: isComment?.user?.profilePhoto ?? "", isVerified: isComment?.user?.isVerified ?? false },
        createdAt: moment(newComment?.createdAt).fromNow(),
        replies: replies?.map((item) => {
          return {
            "user": {
              "id": item?.user?._id,
              "name": item?.user?.FullName ?? "",
              "profilePhoto": item?.user?.profilePhoto ?? "",
              "isVerified": item?.user?.isVerified ?? false,
            },
            "replyTo": {
              "id": item?.replyTo?._id ?? "",
              "name": item?.replyTo?.FullName ?? "",
              "profilePhoto": item?.replyTo?.profilePhoto ?? "",
              "isVerified": item?.replyTo?.isVerified ?? false
            },
            "createdAt": moment(item.createdAt).fromNow(),
            "id": item?._id,
            "msg": item?.msg,
            "isMyReply": req.userId.equals(item?.user?.id) ?? false,
          }
        }),
      },
      msg: "Comment edited successfully"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

// edit reply comment
learningRoute.post("/editReplyComment", ValidateTokenForUser, async (req, res) => {
  const { replyCommentId, msg } = req.body;
  if (!replyCommentId || !msg) {
    return res.json({
      status: false,
      data: null,
      msg: `Required replyCommentId & msg`
    })
  }
  try {
    if (await badWordCheck(msg)) {
      return res.json({
        status: false,
        data: null,
        msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
      })
    }
    const isReply = await shortCommentReplyTable.findOne({ _id: replyCommentId, user: req.userId }).populate('user', 'FullName profilePhoto email mobileNumber isVerified').populate('replyTo', 'FullName profilePhoto email mobileNumber isVerified');
    if (!isReply) {
      return res.json({
        status: false,
        data: null,
        msg: 'Reply not exists'
      })
    }
    const newComment = await shortCommentReplyTable.findOneAndUpdate({ _id: replyCommentId }, {
      msg: msg
    }, { new: true, lean: true });
    return res.json({
      status: true,
      data: {
        "user": {
          "id": isReply?.user?._id,
          "name": isReply?.user?.FullName ?? "",
          "profilePhoto": isReply?.user?.profilePhoto ?? "",
          "isVerified": isReply?.user?.isVerified ?? false,
        },
        "replyTo": {
          "id": isReply?.replyTo?._id ?? "",
          "name": isReply?.replyTo?.FullName ?? "",
          "profilePhoto": isReply?.replyTo?.profilePhoto ?? "",
          "isVerified": isReply?.replyTo?.isVerified ?? false
        },
        "createdAt": moment(isReply.createdAt).fromNow(),
        "id": isReply?._id,
        "msg": newComment?.msg,
        "isMyReply": true,
      },
      msg: "Reply Comment edited successfully."
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})


// report comment 
learningRoute.post("/reportComment", ValidateTokenForUser, async (req, res) => {
  const { commentId, reason } = req.body;
  if (!commentId || !reason) {
    return res.json({
      status: false,
      data: null,
      msg: `Required commentId & reason`
    })
  }
  try {
    const isReport = await shortCommentReportTable.findOne({ comment: commentId, user: req.userId });
    if (isReport) {
      return res.json({
        status: false,
        data: null,
        msg: 'Already reported'
      })
    }
    await shortCommentReportTable.create({ reason, user: req.userId, comment: commentId })
    return res.json({
      status: true,
      data: null,
      msg: "Comment reported successfully."
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})
// report reply comment
learningRoute.post("/reportReplyComment", ValidateTokenForUser, async (req, res) => {
  const { replyCommentId, reason } = req.body;
  if (!replyCommentId || !reason) {
    return res.json({
      status: false,
      data: null,
      msg: `Required replyCommentId & reason`
    })
  }
  try {
    const isReport = await shortCommentReplyReportTable.findOne({ replyComment: replyCommentId, user: req.userId });
    if (isReport) {
      return res.json({
        status: false,
        data: null,
        msg: 'Already reported'
      })
    }
    await shortCommentReplyReportTable.create({ reason, user: req.userId, replyComment: replyCommentId })
    return res.json({
      status: true,
      data: null,
      msg: "Reply comment reported successfully."
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

learningRoute.get('/getAllChannel', isAdmin, async (req, res) => {
  try {
    const channels = await channelTable.find({}).populate('admin', '_id FullName Role profilePhoto').populate('category', '_id title');
    return res.json({
      status: true,
      data: channels.map((item, index) => {
        return {
          sno: index + 1,
          id: item?._id ?? "",
          name: item?.name ?? "",
          profile: item?.profile ?? "",
          admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role, profilePhoto: item?.admin?.profilePhoto ?? "" },
          isActive: item?.isActive,
          createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss'),
          nameWithProfile: { name: item?.name ?? "", profile: item?.profile ?? "" },
          category: item?.category ?? [],
          description: item?.description ?? "",
        }
      }),
      msg: 'All Channel fetched succesfully'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

learningRoute.put("/makeActiveAndInActiveChannel/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id`
    })
  }
  try {

    const isExist = await channelTable.findOne({ _id: id }).select('_id isActive');
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: `Channel Not Found`
      })
    }
    let isActive = isExist?.isActive == true ? false : true;
    await channelTable.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
    return res.json({
      status: true,
      data: null,
      msg: `Channel status changes into ${isActive == true ? 'Active' : 'In Active'}`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

learningRoute.get("/getAllShorts", isAdmin, async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) {
      return res.json({
        status: false,
        data: null,
        msg: 'Required channelId'
      })
    }
    const shorts = await shortTable.find({ channel: channelId }).populate('admin', '_id FullName Role profilePhoto');
    return res.json({
      status: true,
      data: shorts?.map((item, index) => {
        return {
          sno: index + 1,
          id: item?._id ?? "",
          title: item?.title ?? "",
          url: item?.urls[0]?.url ?? "",
          admin: { name: item?.admin?.FullName ?? "", Role: item?.admin?.Role ?? "", profilePhoto: item?.admin?.profilePhoto ?? "" },
          isActive: item?.isActive ?? false,
          shareCount: item?.shareCount ?? 0,
          createdAt: moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss')
        }
      }),
      msg: 'Short fetch successfully'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

learningRoute.put("/makeActiveAndInActiveShort/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id`
    })
  }
  try {

    const isExist = await shortTable.findOne({ _id: id }).select('_id isActive');
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: `Channel Not Found`
      })
    }
    let isActive = isExist?.isActive == true ? false : true;
    await shortTable.updateOne({ _id: isExist?._id }, { isActive: isActive }, { new: true, lean: true });
    return res.json({
      status: true,
      data: null,
      msg: `Short status changes into ${isActive == true ? 'Active' : 'In Active'}`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


// 
learningRoute.post("/uploadCheck", upload.single('file'), async (req, res) => {
  try {
    // const { msg } =  req.body ; 
    // const isBadWord = await badWordCheck(msg);
    const channels = await channelTable.find({});
    for (let channel of channels) {
      let link = `https://www.sdcampus.com?route=${`quicklearningChannel`}&rootId=${channel?._id}&childId=null`

      let details = {
        "link": link ?? "",
        "utmSource": "sdcampus_app",
        "utmMedium": "refer",
        "utmCampaign": "share_course",
        "utmTerm": "",
        "utmContent": "",
        "socialTitle": channel.name ?? "",
        "socialDescription": "",
        "socialImageLink": channel?.profile ?? ""
      }
      let data1 = await genrateDeepLink(details);
      await channelTable.findByIdAndUpdate(channel?._id, { shareLink: { link: data1.shortLink, text: channel.name } })

    }

    const shorts = await shortTable.find({});
    for (let short of shorts) {
      let link = `https://www.sdcampus.com?route=${`quicklearningById`}&rootId=${short?._id}&childId=null`

      let details = {
        "link": link ?? "",
        "utmSource": "sdcampus_app",
        "utmMedium": "refer",
        "utmCampaign": "share_course",
        "utmTerm": "",
        "utmContent": "",
        "socialTitle": short?.title ?? "",
        "socialDescription": "",
        "socialImageLink": ""
      }
      let data1 = await genrateDeepLink(details);
      await shortTable.findByIdAndUpdate(short?._id, { shareLink: { link: data1.shortLink, text: short?.title } })
    }
    // console.log(req.file);
    // let fileLoc=  "" ;
    // if (req.file) {
    //     const helperString = Math.floor(Date.now() / 1000);
    //     const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
    //     const extension = "." + req.file.originalname.split(".").pop();
    //     FileUploadLocation = `Channels/Video/check/${filename}_${helperString}${extension}`;
    //     let helperfileLoc = await uploadCheck(req.file.path, FileUploadLocation);
    //     fileLoc = helperfileLoc ;
    //   }else{
    //     return res.json({
    //         status : false ,
    //         data : null ,
    //         msg :  'Required Video file'
    //     })
    //   }
    // const urls = [
    //   "https://short-learning-videos.s3.ap-south-1.amazonaws.com/Channels/Video/check/BPSC_TRE_4_1734176476.mp4/360p.mp4" ,
    //    "https://short-learning-videos.s3.ap-south-1.amazonaws.com/Channels/Video/check/BPSC_TRE_4_1734176476.mp4/1080p.mp4" , 
    //               "https://short-learning-videos.s3.ap-south-1.amazonaws.com/Channels/Video/check/BPSC_TRE_4_1734176476.mp4/480p.mp4" ,
    //               "https://short-learning-videos.s3.ap-south-1.amazonaws.com/Channels/Video/check/BPSC_TRE_4_1734176476.mp4/720p.mp4"
    // ]
    return res.json({
      status: true,
      data: "",
      msg: `Feature Added in Batches`
    })



  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
module.exports = learningRoute;