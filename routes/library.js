const express = require("express");
const moment = require('moment');
const { ValidateTokenForUser } = require("../middleware/authenticateToken");
const { QuizTable } = require("../models/Quiz");
const { default: mongoose } = require("mongoose");
const { QuizQuestionsTable } = require("../models/Quiz_question");
const { previousYearQuestionPapersTable } = require("../models/previousYearQuestionPapers");
const { NotesTable } = require("../models/Notes");
const { ResourcesTable } = require("../models/Resources");
const { QuizRating } = require("../models/QuizRating");
const { YouTube_Url } = require("../models/YouTubeSchema");
const { YoutubeReportTable } = require("../models/YoutubeReport");
const { YoutubeRatingTable } = require("../models/YotubeRating");
const { YoutubeCommentTable } = require("../models/YoutubeComment");
const { UserTable } = require("../models/userModel");


const libraryRoute = express.Router();

libraryRoute.get("/getQuizes", ValidateTokenForUser, async (req, res) => {
  try {
    let { category, subCategory, page, pageSize } = req.query;

    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    let query = { is_active: true };
    if (subCategory) {
      query.subCategory = { $in: [mongoose.Types.ObjectId(subCategory)] };
    }
    if (category) {
      query.category = { $in: [mongoose.Types.ObjectId(category)] };
    }
    const quizes = await QuizTable.aggregate([
      {
        $facet: {
          quizes: [
            { $match: query },
            {
              $lookup: {
                // localField : "_id"  ,
                // foriegnField : "quiz_id" ,
                from: "quizresponsetables",
                let: { quizId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$quiz_id", "$$quizId"] },
                          {
                            $eq: [
                              "$user_id",
                              mongoose.Types.ObjectId(req.userId),
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "attemptedInfo",
              },
            },
            {
              $addFields: {
                isAttempted: { $gt: [{ $size: "$attemptedInfo" }, 0] },
              },
            },

            { $sort: { createdAt: -1 } },
            {
              $project: {
                quizId: '$_id',
                _id: 0,
                isAttempted: 1,
                title: "$quiz_title",
                noOfQuestion: { $ifNull: ['$no_ques', 0] },
                duration: "$quiz_duration",
                totalMarks: {
                  $toInt: {
                    $multiply: [
                      { $toDouble: "$eachQueMarks" },
                      { $toInt: { $ifNull: ['$no_ques', 0] } },
                    ],
                  },
                },
              },
            },
          ],
          totalCounts: [
            { $match: query },
            { $group: { _id: null, count: { $sum: 1 } } }
          ]
        },
      },
      {
        $project: {
          quizes: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts.count', 0] }
        }
      }
    ]);
    return res.status(200).json({
      status: true,
      data: quizes[0],
      msg: "Quizes Fetched Succesfully"
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

libraryRoute.get("/getQuizQuestion", ValidateTokenForUser, async (req, res) => {
  try {
    const { quizId } = req.query;
    if (!quizId) {
      return res.json({
        status: false,
        data: null,
        msg: "Required QuizId"
      })
    }
    const questions = await QuizQuestionsTable.find({ quiz_id: quizId }).populate('sectionId', 'title sectionId').sort({ createdAt: -1 }).select({ __v: 0, is_active: 0, createdAt: 0, updatedAt: 0, created_at: 0, updated_at: 0 });
    return res.json({
      status: true,
      data: questions.map((question) => {
        return {
          _id: question._id,
          quiz_id: question.quiz_id,
          sectionId: question?.sectionId,
          question_title: question.question_title[0],
          option1: question.option1[0],
          option2: question.option2[0],
          option3: question.option3[0],
          option4: question.option4[0],
        };
      }),
      msg: "Quiz Question fetch successfully"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.get("/getPYQs", ValidateTokenForUser, async (req, res) => {
  try {
    const { subCategory, category, } = req.query;
    let query = { is_active: true }
    if (category) {
      query.category = category;
    }
    if (subCategory) {
      query.subCategory = subCategory
    }

    const pyqs = await previousYearQuestionPapersTable.find(query).sort({ createdAt: -1 }).select('title file_url language');
    return res.json({
      status: true,
      data: pyqs.map((item) => {
        return {
          title: item?.title,
          file_url: item?.file_url ?? {},
        }
      }),
      msg: "PYQs fetched successfully"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.get("/getNotes", ValidateTokenForUser, async (req, res) => {
  try {
    let { subCategory, category, page, pageSize, subject } = req.query;
    // page = parseInt(page) || 1 ;
    // pageSize =  parseInt(pageSize) || 10
    let query = { is_active: true }
    if (category) {
      query.category = category;
    }
    if (subCategory) {
      query.subCategory = subCategory;
    }
    if (subject) {
      query.subject = subject;
    }

    // console.log(query);
    const notes = await NotesTable.find(query).populate('subject', 'title').sort({ createdAt: -1 }).select('title subject file_url language');
    // const notes = await NotesTable.
    // console.log(notes);
    const groupedNotes = notes.reduce((acc, item) => {
      // console.log("item" , item);
      const subjectName = item?.subject?.title?.trim(); // Trim extra spaces/tabs
      const subjectId = item?.subject?._id;
      if (!subjectName) return acc;

      // Find if subject already exists in the accumulator
      let subjectObj = acc.find(obj => obj.id === subjectId);

      if (!subjectObj) {
        subjectObj = {
          id: subjectId,
          subject: subjectName,
          notes: []
        };
        acc.push(subjectObj);
      }

      subjectObj.notes.push({
        title: item?.title,
        file_url: item?.file_url ?? {},
        year: item?.year
      });

      return acc;
    }, []);


    return res.json({
      status: true,
      data: groupedNotes,
      msg: "Notes fetched successfully"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.get("/syllabus", ValidateTokenForUser, async (req, res) => {
  try {
    let { category, subject, year } = req.query;
    // page = parseInt(page) || 1 ;
    // pageSize =  parseInt(pageSize) || 10
    let query = { resource_type: 'file' }
    if (category) {
      query.category = category;
    }

    if (subject) {
      query.subjectId = subject;
    }
    if (year) {
      query.year = year
    }
    // ResourcesTable
    const syllabus = await ResourcesTable.find(query).populate('subjectId', 'title').sort({ createdAt: -1 }).select('title subjectId file_url language year');
    // const groupedSyllabus = syllabus.reduce((acc, item) => {
    //   const subjectName = item?.subjectId?.title ;
    //   const subjectId = item?.subjectId?._id;
    //   if (!subjectName) return acc;

    //   if (!acc[subjectName]) {
    //     acc[subjectName] = { id : subjectId  , subject : subjectName , syllabus: [] };
    //   }

    //   acc[subjectName].syllabus.push({
    //     title: item?.title,
    //     file_url: item?.file_url ?? {},
    //     year : item?.year
    //   });

    //   return acc;
    // }, {});
    const groupedSyllabus = syllabus.reduce((acc, item) => {
      const subjectName = item?.subjectId?.title?.trim(); // Trim extra spaces/tabs
      const subjectId = item?.subjectId?._id;
      if (!subjectName) return acc;

      // Find if subject already exists in the accumulator
      let subjectObj = acc.find(obj => obj.subject.title === subjectName);

      if (!subjectObj) {
        subjectObj = {
          id: subjectId,
          subject: subjectName,
          syllabus: []
        };
        acc.push(subjectObj);
      }

      subjectObj.syllabus.push({
        title: item?.title,
        file_url: item?.file_url ?? {},
        year: item?.year
      });

      return acc;
    }, []);
    return res.json({
      status: true,
      data: groupedSyllabus,
      msg: "Syllabus fetched successfully"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.post("/createQuizRating", ValidateTokenForUser, async (req, res) => {
  try {
    const { quizId, rating } = req.body;
    if (!quizId || ![1, 2, 3, 4, 5]?.includes(rating)) {
      return res.json({
        status: false,
        data: null,
        msg: "Required quiz details & correct rating"
      })
    }
    await QuizRating.create({
      user: req.userId,
      quiz: quizId,
      rating
    })
    return res.json({
      status: true,
      data: null,
      msg: "Quiz rating done successfully."
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.get("/videoLearning", ValidateTokenForUser, async (req, res) => {
  try {
    const { category, subCategory, subject } = req.query;
    let query = {}
    if (category) {
      query.category = { $in: [mongoose.Types.ObjectId(category)] };
    }
    if (subCategory) {
      query.subCategory = { $in: [mongoose.Types.ObjectId(subCategory)] };
    }

    if (subject) {
      query.subjectId = subject;
    }

    const yts = await YouTube_Url.find(query).populate('subject', 'title').select('_id title subject video_url shareLink notes desc');
    const groupedYts = yts.reduce((acc, item) => {
      const subjectName = item?.subject?.title?.trim();
      const subjectId = item?.subject?._id;
      if (!subjectName) return acc;

      let subjectObj = acc.find(obj => obj.subject.title === subjectName);

      if (!subjectObj) {
        subjectObj = {
          id: subjectId,
          subject: subjectName,
          videos: []
        };
        acc.push(subjectObj);
      }

      subjectObj.videos.push({
        id: item?._id ?? "",
        title: item?.title ?? "",
        url: item?.video_url,
        notes: item?.notes ?? [],
        info: item?.desc ?? "",
        shareUrl: { link: item?.shareLink?.link ?? "", text: item?.shareLink?.text ?? "" },

      });

      return acc;
    }, []);
    return res.json({
      status: true,
      data: groupedYts,
      msg: "Video learning fetched successfully"
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.post("/videoReport", ValidateTokenForUser, async (req, res) => {
  const { desc, youtubeId } = req.body;
  if (!desc || !youtubeId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Description youtubeId`
    })
  }
  try {

    const isYoutube = await YouTube_Url.findOne({ _id: youtubeId });
    if (!isYoutube) {
      return res.json({
        status: false,
        data: null,
        msg: 'Video not found'
      })
    }
    const newReport = new YoutubeReportTable({
      user: req.userId,
      desc,
      youtubeId: isYoutube?._id,
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

libraryRoute.post("/videoRating", ValidateTokenForUser, async (req, res) => {
  const { title, youtubeId, rating } = req.body;
  if (!title || !youtubeId || !["1", "2", "3", "4", "5"].includes(rating)) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Title youtubeId rating`
    })
  }
  try {

    const isYoutube = await YouTube_Url.findOne({ _id: youtubeId });
    if (!isYoutube) {
      return res.json({
        status: false,
        data: null,
        msg: 'Video not found'
      })
    }
    const newRating = new YoutubeRatingTable({
      user: req.userId,
      title,
      rating,
      youtubeIdId: isYoutube?._id,
    });
    const saveRating = await newRating.save();
    return res.json({
      status: true,
      data: saveRating,
      msg: `Your Rating Submitted`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.post("/createComment", ValidateTokenForUser, async (req, res) => {
  try {
    const { msg, youtubeId } = req.body;
    const user = await UserTable.findOne({ _id: req.userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not found."
      })
    }
    const comment = await YoutubeCommentTable.create({
      msg,
      youtubeId,
      user: req.userId,
      commentId: null
    })

    const newComment = await comment.save();
    return res.json({
      status: true,
      data: {
        id: newComment?._id,
        msg: newComment?.msg,
        isMyComment: true,
        user: { id: user?._id ?? "", name: user?.FullName ?? "", profilePhoto: user?.profilePhoto ?? "" },
        createdAt: moment(newComment?.createAt).fromNow(),
        replies: [],
      },
      msg: "New Comment Created"
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


libraryRoute.post("/createReplyComment", ValidateTokenForUser, async (req, res) => {
  try {
    const { msg, youtubeId, commentId, replyTo } = req.body;
    const user = await UserTable.findOne({ _id: req.userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not found."
      })
    }
    const isComment = await YoutubeCommentTable.findOne({ _id: commentId, user: replyTo }).populate('user', '_id FullName profilePhoto');
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: "Comment not found"
      })
    }
    // const allReply = await YoutubeCommentTable.find({ commentId : commentId }).populate('user' , '_id FullName profilePhoto');

    const comment = await YoutubeCommentTable.create({
      msg,
      youtubeId,
      user: req.userId,
      replyTo,
      commentId: commentId,
    })
    const newComment = await comment.save();

    return res.json({
      status: true,
      data: {
        id: newComment?._id,
        msg: newComment?.msg,
        isMyReplyComment: true,
        user: { id: user?._id ?? "", name: user?.FullName ?? "", profilePhoto: user?.profilePhoto ?? "" },
        replyTo: { id: isComment?.user?._id ?? "", name: isComment?.user?.FullName ?? "", profilePhoto: isComment?.user?.profilePhoto ?? "" },
        createdAt: moment(newComment?.createAt).fromNow(),
      },

      msg: "New Reply Comment Created."
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.delete("/removeComment/:id", ValidateTokenForUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: 'Required Id'
      })
    }
    const isComment = await YoutubeCommentTable.findOneAndDelete({ _id: id, user: req.userId });
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: "Comment not found"
      })
    }

    return res.json({
      status: true,
      data: null,
      msg: "Comment deleted."
    });

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
libraryRoute.put("/editComment", ValidateTokenForUser, async (req, res) => {
  try {
    const { msg, commentId } = req.body;
    const user = await UserTable.findOne({ _id: req.userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not found."
      })
    }
    const isComment = await YoutubeCommentTable.findOne({ _id: commentId, user: user?._id });
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: "Comment not found"
      })
    }
    const newComment = await YoutubeCommentTable.findOneAndUpdate({ _id: isComment?._id }, { msg: msg, })

    const allReply = await YoutubeCommentTable.find({ commentId: isComment?._id }).populate('user', '_id FullName profilePhoto').populate('replyTo', '_id FullName profilePhoto');
    return res.json({
      status: true,
      data: {
        id: newComment?._id,
        msg: msg,
        isMyComment: true,
        user: { id: user?._id ?? "", name: user?.FullName ?? "", profilePhoto: user?.profilePhoto ?? "" },
        createdAt: moment(newComment?.createAt).fromNow(),
        replies: allReply?.map((item2) => {
          return {
            id: item2?._id,
            msg: item2?.msg,
            isMyReplyComment: req.userId.equals(item2?.user?._id) ?? false,
            user: { id: item2?.user?._id ?? "", name: item2?.user?.FullName ?? "", profilePhoto: item2?.user?.profilePhoto ?? "" },
            replyTo: { id: item2?.replyTo?._id ?? "", name: item2?.replyTo?.FullName ?? "", profilePhoto: item2?.replyTo?.profilePhoto ?? "" },
            createdAt: moment(item2?.createAt).fromNow(),

          }
        }),
      },
      msg: "Comment Updated"
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

libraryRoute.put("/editReplyComment", ValidateTokenForUser, async (req, res) => {
  try {
    const { msg, replyCommentId } = req.body;
    const user = await UserTable.findOne({ _id: req.userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not found."
      })
    }
    const isComment = await YoutubeCommentTable.findOne({ _id: replyCommentId, user: user?._id });
    if (!isComment) {
      return res.json({
        status: false,
        data: null,
        msg: "Reply Comment not found"
      })
    }
    const newComment = await YoutubeCommentTable.findOneAndUpdate({ _id: isComment?._id }, { msg: msg, }).populate('replyTo', '_id FullName profilePhoto');

    return res.json({
      status: true,
      data: {
        id: newComment?._id,
        msg: msg,
        isMyReplyComment: true,
        user: { id: user?._id ?? "", name: user?.FullName ?? "", profilePhoto: user?.profilePhoto ?? "" },
        replyTo: { id: newComment?.replyTo?._id ?? "", name: newComment?.replyTo?.FullName ?? "", profilePhoto: newComment?.replyTo?.profilePhoto ?? "" },
        createdAt: moment(newComment?.createAt).fromNow(),

      },
      msg: "Reply Comment Updated"
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


libraryRoute.get("/comments", ValidateTokenForUser, async (req, res) => {
  try {
    let { youtubeId, page, pageSize } = req.query;
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10

    const comments = await YoutubeCommentTable.find({ youtubeId: youtubeId }).populate('user', '_id FullName profilePhoto').sort({ createdAt: -1 }).skip(page - 1).limit(pageSize);
    let cmntResponse = await Promise.all(comments?.map(async (item) => {
      const allReply = await YoutubeCommentTable.find({ commentId: item?._id }).populate('user', '_id FullName profilePhoto').populate('replyTo', '_id FullName profilePhoto');
      return {
        id: item?._id,
        msg: item?.msg,
        isMyComment: req.userId.equals(item?.user?._id) ?? false,
        user: { id: item?.user?._id ?? "", name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" },
        createdAt: moment(item?.createAt).fromNow(),
        replies: allReply?.map((item2) => {
          return {
            id: item2?._id,
            msg: item2?.msg,
            isMyReplyComment: req.userId.equals(item2?.user?._id) ?? false,
            user: { id: item2?.user?._id ?? "", name: item2?.user?.FullName ?? "", profilePhoto: item2?.user?.profilePhoto ?? "" },
            replyTo: { id: item2?.replyTo?._id ?? "", name: item2?.replyTo?.FullName ?? "", profilePhoto: item2?.replyTo?.profilePhoto ?? "" },
            createdAt: moment(item2?.createAt).fromNow(),

          }
        }),
      }
    }))
    return res.json({
      status: true,
      data: cmntResponse,
      msg: "Comment fetched"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

module.exports = libraryRoute;
