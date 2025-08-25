const express = require('express');
const mongoose = require('mongoose');
const { ValidateToken, isAdmin } = require('../middleware/authenticateToken');
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../aws/UploadFile");
const multer = require("multer");
const {
  findUserByUserId,
} = require("../HelperFunctions/userFunctions");

const {
  findAdminTeacherUsingUserId,
} = require("../HelperFunctions/adminTeacherFunctions");
const moment = require("moment");
const { savePanelEventLogs } = require("../HelperFunctions/storeLogs");
const { cmsPostTable } = require('../models/CmsPost');
const { cmsCommentTable } = require('../models/CmsComment');
const { cmsLikeTable } = require('../models/CmsLike');
const { cmsCommentReplyTable } = require('../models/CmsCommentReply');
const { cmsViewTable } = require('../models/CmsView');
require("dotenv").config();

const upload = multer({ dest: "uploads/cmsPost" });
const Community = express.Router();
const https = require('https');
const { fetchData } = require('../HelperFunctions/fileRead');
const { sendCustomNotification } = require('../HelperFunctions/sendCustomNotification');
const { cmsCommentReportTable } = require('../models/cmsCommentReport');
const { cmsReplyCommentReportTable } = require('../models/cmsReplyCommentReport');
const { genrateDeepLink } = require('../HelperFunctions/genrateDeepLink');
const { badWordCheck } = require('../HelperFunctions/BadWordCheck');

// cms post add
Community.post("/addCMSPost", isAdmin, upload.single("file"), async (req, res) => {
  const {
    title,
    tags,
    desc,
    language,
    isActive,
  } = req.body;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    let fileUrl;
    if (req.file) {
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0].replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `cmsPost/${filename}_${helperString}${extension}`;
      let fileLocHelper = await uploadFile(req.file.path, FileUploadLocation);
      fileUrl = fileLocHelper;
    }
    const newPost = new cmsPostTable({
      author: adminDetails._id,
      title,
      featuredImage: fileUrl,
      tags,
      language,
      desc,
      isActive,
    });
    const savePost = await newPost.save();

    if (savePost && savePost?.isActive) {
      const data = {
        title: title,
        message: `${title}`,
        fileUrl: fileUrl || "",
        route: "feedById",
        rootId: `${savePost?._id}`,
        childId: ""
      };
      // await sendCustomNotification('all', data);
    }
    let link = `https://www.sdcampus.com?route=${`feedById`}&rootId=${savePost?._id}&childId=null`
    let details = {
      "link": link ?? "",
      "utmSource": "web_app",
      "utmMedium": "refer",
      "utmCampaign": "share_community",
      "utmTerm": "",
      "utmContent": "",
      "socialTitle": savePost?.title ?? "",
      "socialDescription": "",
      "socialImageLink": savePost?.featuredImage ?? ""
    }
    let data1 = await genrateDeepLink(details);
    await cmsPostTable.findByIdAndUpdate(savePost?._id, { shareLink: { link: data1.shortLink, text: title } })
    return res.json({
      status: true,
      data: savePost,
      msg: "New Post added successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Post not added`,
    });
  }
}
);

// cmsPost delete for Admin
Community.delete("/deleteCMSPost/:postId", isAdmin, async (req, res) => {
  const { postId } = req.params;
  if (!postId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required postId`
    })
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const isPost = await cmsPostTable.findOne({ _id: postId });
    if (!isPost) {
      return res.json({
        status: false,
        data: null,
        msg: 'post not found'
      })
    }
    await savePanelEventLogs(
      adminDetails?._id,
      "deleteCommunityPost",
      "delete",
      isPost
    )
    await cmsPostTable.findByIdAndDelete(isPost?._id);
    return res.json({
      status: true,
      data: null,
      msg: "Post deleted successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Post not added`,
    });
  }
}
);
// cms get post By id
Community.get("/getCMSPostById/:postId", isAdmin, async (req, res) => {
  const { postId } = req.params;
  if (!postId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required postId`
    })
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    // const post = await cmsPostTable.findOne({ _id : postId}).populate("author" ,"FullName profilePhoto");
    const post = await cmsPostTable.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(postId) } },
      {
        $lookup: {
          from: 'adminteachertables',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails',
        },
      },
      { $unwind: '$authorDetails' },
      {
        $lookup: {
          from: 'cmsliketables',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $lookup: {
          from: 'cmsviewtables',
          localField: '_id',
          foreignField: 'postId',
          as: 'views',
        },
      },
      {
        $lookup: {
          from: 'cmscommenttables',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
        },
      },


      {
        $addFields: {
          likes: { $ifNull: ['$likes', []] },
          totalViews: { $toString: { $size: { $ifNull: ['$views', []] } } },
          totalLikes: { $toString: { $size: { $ifNull: ['$likes', []] } } },
          totalComments: { $toString: { $size: { $ifNull: ['$comments', []] } } },
          author: { name: '$authorDetails.FullName', profileIcon: '$authorDetails.profilePhoto' },
        },
      },

      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          title: 1,
          author: 1,
          tags: 1,
          featuredImage: 1,
          language: 1,
          isActive: 1,
          desc: 1,
          totalLikes: 1,
          totalViews: 1,
          totalComments: 1,

        },
      },
    ]);
    return res.json({
      status: true,
      data: {
        _id: post[0]?._id ?? "",
        title: post[0]?.title ?? "",
        desc: post[0]?.desc ?? "",
        tags: post[0]?.tags ?? "",
        isActive: post[0]?.isActive ?? "",
        featuredImage: post[0]?.featuredImage ?? "",
        language: post[0]?.language ?? "",
        author: post[0]?.author ?? { FullName: "", profilePhoto: "" },
        createdAt: moment(post[0].createdAt).format("DD-MM-YYYY HH:mm:ss"),
        updatedAt: moment(post[0].updatedAt).format("DD-MM-YYYY HH:mm:ss"),
        totalViews: post[0]?.totalViews ?? "",
        totalLikes: post[0]?.totalLikes ?? "0",
        totalComments: post[0]?.totalComments ?? "0",

      },
      msg: "Post fetched successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Post not added`,
    });
  }
}
);
// cms edit for Admin
Community.put("/updateCMSPost/:postId", isAdmin, upload.single("file"), async (req, res) => {
  const { postId } = req.params;
  if (!postId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required postId`
    })
  }
  const {
    title,
    tags,
    desc,
    language,
    isActive,
  } = req.body;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const isPost = await cmsPostTable.findOne({ _id: postId });
    if (!isPost) {
      return res.json({
        status: false,
        data: null,
        msg: 'post not found'
      })
    }
    let fileUrl;
    if (req.file) {
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0].replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `cmsPost/${filename}_${helperString}${extension}`;
      let fileLocHelper = await uploadFile(req.file.path, FileUploadLocation);
      fileUrl = fileLocHelper;
    } else {
      fileUrl = isPost?.featuredImage
    }
    const newPost = await cmsPostTable.findByIdAndUpdate(isPost?._id, {
      author: adminDetails._id,
      title,
      featuredImage: fileUrl,
      tags,
      language,
      desc,
      isActive,
    }, { new: true, lean: true });
    return res.json({
      status: true,
      data: newPost,
      msg: "Post updated successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Post not added`,
    });
  }
}
);
// cms getAll for Admin
Community.get("/getCMSPosts", isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const posts = await cmsPostTable.find({}).populate("author", "FullName profilePhoto");
    return res.json({
      status: true,
      data: posts.map((item) => {
        return {
          id: item?._id ?? "",
          title: item?.title ?? "",
          label: item?.title ?? "",
          value: item?._id ?? "",
          featuredImage: item?.featuredImage ?? "",
          author: item?.author ?? "",
          desc: item?.desc ?? "",
          language: item?.language ?? "",
          isActive: item?.isActive ?? "",
          isCommentAllowed: item?.isCommentAllowed ?? false,
          createdAt: moment(item.createdAt).format('DD-MM-YYYY HH:mm:ss') ?? "",
          updatedAt: moment(item?.updatedAt).format('DD-MM-YYYY HH:mm:ss') ?? "",
        }
      }),
      msg: "All Post fetched successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Post not added`,
    });
  }
}
);


// studnet get all post by students
// get post bY id student

// likeOrRemoveLike
Community.put("/likeOrRemoveLike", ValidateToken, async (req, res) => {
  const { postId } = req.query;
  if (!postId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required postId`
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
    // const isPostExist = await cmsPostTable.findOne({_id : postId});
    // if( !isPostExist){
    //     return res.json({
    //         status: false,
    //         data: null,
    //         msg: 'post not exists'
    //     })
    // }
    const isLiked = await cmsLikeTable.findOne({ user: user?._id, postId: postId });
    if (isLiked) {
      await cmsLikeTable.findByIdAndDelete(isLiked?._id);
      return res.json({
        status: true,
        data: null,
        msg: `Post like removed by ${user?.FullName}`,
      })
    } else {
      const newLike = new cmsLikeTable({
        postId: postId,
        user: user?._id,
      })
      await newLike.save();
      return res.json({
        status: true,
        data: null,
        msg: `Post liked by ${user?.FullName}`,
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
Community.post("/addCommentToPost", ValidateToken, async (req, res) => {
  const { postId, msg } = req.body;
  if (!postId || !msg) {
    return res.json({
      status: false,
      data: null,
      msg: `Required postId & msg`
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
    if (await badWordCheck(msg)) {
      return res.json({
        status: false,
        data: null,
        msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
      })
    }
    const isPostExist = await cmsPostTable.findOne({ _id: postId });
    if (!isPostExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'post not exists'
      })
    }
    if (isPostExist?.isCommentAllowed == false) {
      return res.json({
        status: false,
        data: null,
        msg: `Comments not allowed`
      })
    }
    const noOfComments = await cmsCommentTable.countDocuments({ postId: postId, user: user?._id });
    if (noOfComments > 5) {
      return res.json({
        status: false,
        data: null,
        msg: 'Maximum post comment exceed'
      })
    }

    const newComment = new cmsCommentTable({
      postId: postId,
      user: user?._id,
      msg: msg
    })
    const saveComment = await newComment.save();
    return res.json({
      status: true,
      data: saveComment,
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
Community.post("/replyToComments", ValidateToken, async (req, res) => {
  const { commentId, msg, replyTo } = req.body;
  if (!commentId || !msg) {
    return res.json({
      status: false,
      data: null,
      msg: `Required commentId & msg & replyTo`
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
    if (await badWordCheck(msg)) {
      return res.json({
        status: false,
        data: null,
        msg: "In adherence to community guidelines, we do not permit the use of inappropriate language."
      })
    }
    const isComment = await cmsCommentTable.findOne({ _id: commentId });
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: 'comment not exists'
      })
    }
    const newReply = new cmsCommentReplyTable({
      commentId: commentId,
      user: user?._id,
      msg: msg,
      // replyTo ,
    })
    const saveReply = await newReply.save();
    return res.json({
      status: true,
      data: saveReply,
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
Community.delete("/deleteComment", ValidateToken, async (req, res) => {
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
      await cmsCommentTable.findByIdAndDelete(commentId);
      return res.json({
        status: true,
        data: null,
        msg: "Comment deleted"
      })
    } else {
      const comment = await cmsCommentTable.findOneAndDelete({ user: user?._id, _id: commentId });
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
Community.delete("/deleteReplyComment", ValidateToken, async (req, res) => {
  const { replyCommentId } = req.query;
  if (!replyCommentId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required replyCommentId`
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
      // console.log('admin');
      await cmsCommentReplyTable.findByIdAndDelete(replyCommentId);
      return res.json({
        status: true,
        data: null,
        msg: "Comment deleted"
      })
    } else {
      const reply = await cmsCommentReplyTable.findOneAndDelete({ _id: replyCommentId, user: user?._id });
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

// getCommnetsByPostId ,
Community.get("/getCommentsByPostId/:postId", ValidateToken, async (req, res) => {
  const { postId } = req.params;
  let { page, pageSize } = req.query;
  try {
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 15;
    const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
    const user = await findUserByUserId(decoded.studentId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isPostExist = await cmsPostTable.findOne({ _id: postId });
    if (!isPostExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'post not exists'
      })
    }

    const commentsWithReplies = await cmsCommentTable.aggregate([
      {
        $facet: {
          comments: [
            {
              $match: { postId: isPostExist?._id } // Assuming 'blog' is an ObjectId
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
                from: 'cmscommentreplytables',
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
                      //   msg: 1,
                      createdAt: 1,
                      likesCount: "20",
                      user: {
                        name: '$replyUserDetails.FullName',
                        profilePhoto: '$replyUserDetails.profilePhoto'
                      },
                    }
                  },
                ],
                as: 'replies'
              }
            },
            {
              $project: {
                // _id: 1,
                id: '$_id',
                cmntsMsg: '$msg',
                isPin: 1,
                likesCount: "10",
                createdAt: 1,
                user: {
                  name: '$userDetails.FullName',
                  profilePhoto: '$userDetails.profilePhoto'
                },
                replies: 1
                // include other fields as needed
              }
            },
            { $sort: { isPin: -1, createdAt: -1 } },
          ],
          totalCounts: [
            { $match: { postId: isPostExist?._id } },
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

    // console.log(commentsWithReplies[0]?.totalCounts)
    const response = {
      id: isPostExist?._id ?? "",
      comments: {
        // count: `${commentsWithReplies.length}`,
        count: `${commentsWithReplies[0]?.totalCounts?.count ?? 0}`,
        commentList: commentsWithReplies[0].comments.map((item) => {
          return {
            id: item?._id ?? "",
            isPin: item?.isPin ?? false,
            user: { name: item?.user?.name ?? "", profileIcon: item?.user?.profilePhoto ?? "" },
            cmntsMsg: item?.cmntsMsg ?? "",
            likesCount: "10",
            createdAt: moment(item?.createdAt).fromNow() ?? "",
            replies: item?.replies?.map((item2) => {
              return {
                id: item2?._id ?? "",
                user: { name: item2?.user?.name ?? "", profileIcon: item2?.user?.profilePhoto ?? "" },
                cmntsMsg: item2?.cmntsMsg ?? "",
                likesCount: "10",
                createdAt: moment(item2?.createdAt).fromNow() ?? "",
              }
            })
          }
        })
      },
    }
    return res.json({
      status: true,
      data: response,
      data1: { ...response, totalCounts: commentsWithReplies[0]?.totalCounts?.count ?? 0 },

      msg: "blog fetched",
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})
// getRepliesByCommentsId,
Community.get("/getAllPosts", ValidateToken, async (req, res) => {
  let { page, pageSize } = req.query;

  try {
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 15;
    const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
    const user = await findUserByUserId(decoded.studentId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const posts = await cmsPostTable.aggregate([
      {
        $facet: {
          posts: [
            { $match: { isActive: true } },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              $lookup: {
                from: 'adminteachertables',
                localField: 'author',
                foreignField: '_id',
                as: 'authorDetails',
              },
            },
            { $unwind: '$authorDetails' },
            {
              $lookup: {
                from: 'cmsliketables',
                localField: '_id',
                foreignField: 'postId',
                as: 'likes',
              },
            },
            {
              $lookup: {
                from: 'cmsviewtables',
                localField: '_id',
                foreignField: 'postId',
                as: 'views',
              },
            },
            {
              $lookup: {
                from: 'cmscommenttables',
                let: { postId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
                  { $sort: { isPin: -1, createdAt: -1 } },
                  {
                    $lookup: {
                      from: 'userstables',
                      localField: 'user',
                      foreignField: '_id',
                      as: 'userDetails',
                    },
                  },
                  { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
                ],
                as: 'comments',
              },
            },
            {
              $sort: { 'comments.isPin': -1, 'comments.createdAt': -1 }
              // $sort: {  'comments.createdAt': -1 }

            },
            {
              $addFields: {
                likes: { $ifNull: ['$likes', []] },
                views: { $ifNull: ['$views', []] },
                comments: { $ifNull: ['$comments', []] },
                totalLikes: { $toString: { $size: { $ifNull: ['$likes', []] } } },
                totalViews: { $toString: { $size: { $ifNull: ['$views', []] } } },
                totalComments: { $toString: { $size: { $ifNull: ['$comments', []] } } },
              },
            },
            {
              $group: {
                _id: '$_id',
                createdAt: { $first: '$createdAt' },
                title: { $first: '$title' },
                featuredImage: { $first: '$featuredImage' },
                tags: { $first: '$tags' },
                isCommentAllowed: { $first: '$isCommentAllowed' },
                shareLink: { $first: '$shareLink' },
                author: { $first: { FullName: '$authorDetails.FullName', profilePhoto: '$authorDetails.profilePhoto' } },
                totalLikes: { $first: '$totalLikes' },
                totalViews: { $first: '$totalViews' },
                totalComments: { $first: '$totalComments' },
                comments: { $first: '$comments' },
              },
            },
            {
              $project: {
                _id: 1,
                createdAt: 1,
                title: 1,
                author: 1,
                featuredImage: 1,
                totalLikes: 1,
                totalViews: 1,
                totalComments: 1,
                tags: 1,
                isCommentAllowed: 1,
                shareLink: 1,
                comments: {
                  $slice: [
                    {
                      $map: {
                        input: '$comments',
                        as: 'comment',
                        in: {
                          id: '$$comment._id',
                          msg: '$$comment.msg',
                          isPin: "$$comment.isPin",
                          createdAt: '$$comment.createdAt',
                          user: {
                            id: { $ifNull: ['$$comment.userDetails._id', ''] },
                            name: { $ifNull: ['$$comment.userDetails.FullName', ''] },
                            profileIcon: { $ifNull: ['$$comment.userDetails.profilePhoto', ''] },
                          },
                        },
                      },
                    },
                    2,
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
          ],
          totalCounts: [
            { $match: { isActive: true } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ]
        }
      },
      {
        $project: {
          posts: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

        }
      }

    ]);

    const result = await Promise.all(posts[0].posts.map(async (item) => {
      const isLiked = await cmsLikeTable.findOne({ user: user?._id, postId: item?._id });
      return {
        id: item?._id ?? "",
        title: item?.title ?? "",
        author: { name: item?.author?.FullName ?? "", profileIcon: item?.author?.profilePhoto ?? "" },
        featuredImage: item?.featuredImage ?? "",
        createdAt: moment(item?.createdAt).fromNow() ?? "",
        likeCounts: item?.totalLikes ?? "0",
        shareUrl: { link: item?.shareLink?.link ?? "", text: item?.shareLink?.text ?? "" },
        shareLink: "",
        isCommentAllowed: item?.isCommentAllowed ?? false,
        // shareLink: item?.shareLink ?? "www.sdcampus.com",
        isLiked: isLiked ? true : false,
        viewsCount: item?.totalViews ?? "0",
        tags: item?.tags ?? "",
        comments: {
          count: item.totalComments,
          commentList: item?.comments?.map((item2) => {
            return {
              id: item2?.id ?? "",
              isPin: item2?.isPin ?? false,
              myComment: (user?._id).toString() === (item2?.user?.id).toString() ? true : false,
              user: { name: item2?.user?.name ?? "", profileIcon: item2?.user?.profileIcon },
              cmntsMsg: item2?.msg ?? "",
              createdAt: moment(item2.createdAt).fromNow() ?? "",
            }
          })
        },
      }
    }))
    return res.json({
      status: true,
      data: result,
      data1: { posts: result, totalCounts: posts[0]?.totalCounts?.count },

      msg: "blogs fetched",
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

Community.get("/getPostById/:id", ValidateToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id'
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
    const isPostExist = await cmsPostTable.findOne({ _id: id });
    if (!isPostExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'post not exists'
      })
    }

    await cmsViewTable.findOneAndUpdate({ postId: isPostExist?._id, user: user?._id }, { postId: isPostExist?._id, user: user?._id }, { upsert: true })
    const posts = await cmsPostTable.aggregate([
      { $match: { isActive: true, _id: mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'adminteachertables',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails',
        },
      },
      { $unwind: '$authorDetails' },
      {
        $lookup: {
          from: 'cmsliketables',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $lookup: {
          from: 'cmsviewtables',
          localField: '_id',
          foreignField: 'postId',
          as: 'views',
        },
      },


      {
        $addFields: {
          likes: { $ifNull: ['$likes', []] },
          totalViews: { $toString: { $size: { $ifNull: ['$views', []] } } },
          totalLikes: { $toString: { $size: { $ifNull: ['$likes', []] } } },
          author: { name: '$authorDetails.FullName', profileIcon: '$authorDetails.profilePhoto' },
        },
      },

      {
        $project: {
          _id: 1,
          createdAt: 1,
          title: 1,
          author: 1,
          featuredImage: 1,
          desc: 1,
          totalLikes: 1,
          totalViews: 1,
          totalComments: 1,
          shareLink: 1,
          isCommentAllowed: 1,

        },
      },
    ]);
    const commentCounts = await cmsCommentTable.countDocuments({ postId: isPostExist?._id });
    const commentsWithReplies = await cmsCommentTable.aggregate([
      {
        $match: { postId: isPostExist?._id }
      },
      { $sort: { isPin: -1, createdAt: -1 } },
      { $limit: 10 },
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
          from: 'cmscommentreplytables',
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
                id: '$_id',
                cmntsMsg: '$msg',
                createdAt: 1,

                likesCount: "20",
                user: {
                  id: '$replyUserDetails._id',
                  name: '$replyUserDetails.FullName',
                  profilePhoto: '$replyUserDetails.profilePhoto'
                },
              }
            }
          ],
          as: 'replies'
        }
      },
      {
        $project: {
          // _id: 1,
          id: '$_id',
          cmntsMsg: '$msg',
          // msg: 1,
          isPin: 1,
          likesCount: "10",
          createdAt: 1,

          user: {
            id: '$userDetails._id',
            name: '$userDetails.FullName',
            profilePhoto: '$userDetails.profilePhoto'
          },
          replies: 1

        }
      },
      // { $sort: { createdAt: -1 } },  
    ]);
    const isLiked = await cmsLikeTable.findOne({ user: user?._id, postId: posts[0]?._id });
    const response = {
      id: posts[0]?._id ?? "",
      title: posts[0]?.title ?? "",
      author: posts[0]?.author,
      featuredImage: posts[0]?.featuredImage ?? "",
      createdAt: moment(posts[0]?.createdAt).fromNow(),
      description: posts[0]?.desc ?? "",
      likeCounts: posts[0]?.totalLikes ?? "0",
      isCommentAllowed: posts[0]?.isCommentAllowed ?? false,
      // shareLink: "www.sdcampus.com",
      shareUrl: { link: posts[0]?.shareLink?.link ?? "", text: posts[0]?.shareLink?.text ?? "" },
      shareLink: "",
      isLiked: isLiked ? true : false,
      viewsCount: posts[0]?.totalViews ?? "0",
      comments: {
        // count: `${commentsWithReplies.length}`,
        count: `${commentCounts}`,
        commentList: commentsWithReplies.map((item) => {
          return {
            id: item?._id ?? "",
            isPin: item?.isPin ?? false,
            myComment: (user?._id).toString() === (item?.user?.id).toString() ? true : false,
            user: { name: item?.user?.name ?? "", profileIcon: item?.user?.profilePhoto ?? "" },
            cmntsMsg: item?.cmntsMsg ?? "",
            likesCount: "10",
            createdAt: moment(item?.createdAt).fromNow(),
            replies: item?.replies?.map((item2) => {
              return {
                id: item2?._id ?? "",
                myComment: (user?._id).toString() === (item2?.user?.id).toString() ? true : false,
                user: { name: item2?.user?.name ?? "", profileIcon: item2?.user?.profilePhoto ?? "" },
                cmntsMsg: item2?.cmntsMsg ?? "",
                likesCount: "10",
                createdAt: moment(item2.createdAt).fromNow(),
              }
            })

          }
        })

      },
    }
    return res.json({
      status: true,
      data: response,
      msg: "blog fetched",
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})


Community.put("/markCmsCommentToReport", ValidateToken, async (req, res) => {
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
    let reports = await cmsCommentReportTable.findOne({ commentId: commentId });
    if (!reports?._id) {
      let report = new cmsCommentReportTable({
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
      await cmsCommentReportTable.findOneAndUpdate({ commentId: commentId }, { $addToSet: { user: { $each: [user?._id] } } })

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

Community.put("/markCmsReplyCommentToReport", ValidateToken, async (req, res) => {
  const { replyCommentId } = req.query;
  if (!replyCommentId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required replyCommentId`
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
    let reports = await cmsReplyCommentReportTable.findOne({ replyCommentId: replyCommentId });
    if (!reports?._id) {
      let report = new cmsReplyCommentReportTable({
        user: [user?._id],
        replyCommentId: replyCommentId,
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
      await cmsReplyCommentReportTable.findOneAndUpdate({ replyCommentId: replyCommentId }, { $addToSet: { user: { $each: [user?._id] } } })

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

Community.put("/markCmsCommentToPinOrUnpin", ValidateToken, async (req, res) => {
  const { commentId } = req.query;
  if (!commentId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Comment Id Required!'
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
    const isComment = await cmsCommentTable.findOne({ _id: commentId });
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: 'Comment not exists'
      })
    }
    if (user?.email.includes('@sdempire.co.in')) {
      await cmsCommentTable.findByIdAndUpdate(commentId, { isPin: !isComment.isPin });
      return res.json({
        status: true,
        data: null,
        msg: `Comment ${isComment?.isPin ? 'unpinned' : 'pinned'} successfully`
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


Community.put("/changePostComment", isAdmin, async (req, res) => {
  const { postId } = req.query;
  if (!postId) {
    return res.json({
      status: false,
      data: null,
      msg: `Post Id Required`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    // console.log(decode?.studentId)
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }
    const isPost = await cmsPostTable.findOne({ _id: postId });
    if (!isPost) {
      return res.json({
        status: false,
        data: null,
        msg: "Post not found"
      })
    }
    let isCommentAllowed = !isPost?.isCommentAllowed
    await cmsPostTable.findByIdAndUpdate(isPost?._id, { isCommentAllowed: isCommentAllowed });
    return res.json({
      status: true,
      data: null,
      msg: `Comment is ${isCommentAllowed == true ? 'allowed' : 'disable'} on ${isPost?.title}`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
module.exports = Community;