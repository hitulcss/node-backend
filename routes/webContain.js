const express = require("express");
const { BatchesTable } = require("../models/BatchesSchema");
const { adminTeacherTable } = require('../models/adminTeacherModel');
const { categoryTable } = require("../models/category");
const { TestSeriesTable } = require("../models/TestSeries");
const { YouTube_Url } = require("../models/YouTubeSchema");
const { TestSeriesTestTable } = require("../models/testseriestest");
const { TestimonialTable } = require("../models/Testimonials");
const { QuizTable } = require("../models/Quiz");
const { QuizResponseTable } = require('../models/QuizResponse');
const { subCategoryTable } = require("../models/subCategory");
const {
  previousYearQuestionPapersTable,
} = require("../models/previousYearQuestionPapers");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { generateFromEmail } = require("unique-username-generator");
require("dotenv").config();
const { uploadFile } = require("../aws/UploadFile");
const multer = require("multer");
const { UserTable } = require("../models/userModel");
const { isAdmin, ValidateToken, ValidateTokenForUser } = require("../middleware/authenticateToken");
const { sendEmail } = require("../ContactUser/NodeMailer");
const { v1: uuidv1 } = require("uuid");
const { formatDate } = require("../middleware/dateConverter");
const {
  findUserByUserId,
  findUserByEmail,
  findUserByMobileNumber,
  generateReferralCode,
  saveRefAmount,
} = require("../HelperFunctions/userFunctions");
const { SendOtpSms } = require("../ContactUser/SendMessage");
const {
  findAdminTeacherUsingUserId,
} = require("../HelperFunctions/adminTeacherFunctions");
const { couponTable } = require("../models/Coupon");
const { LectureTable } = require("../models/addLecture");
const { BannerTable } = require("../models/BannerSchema");
const { ctaTable } = require("../models/CTA");
const { storeProductTable } = require("../models/storeProduct");
const { productCategoryTable } = require("../models/productCategory");
const { MybatchTable } = require("../models/MyBatches");
const { announcementTable } = require("../models/announcements");
const { SubjectTable } = require("../models/Subject");
const { LectureResourceTable } = require("../models/lectureResources");
const { QuizQuestionsTable } = require("../models/Quiz_question");
const { leaderBoardTable } = require("../models/leaderboard");
const { QuizResumeTable } = require("../models/resumeQuiz");
const { myNotificationModel } = require("../models/myNotification");
const { sendPushNotification } = require("../firebaseService/fcmService");
const { generateSlug } = require("../HelperFunctions/generateSlug");

const apicache = require("apicache");
const { courseOrdesTable } = require("../models/courseOrder");
const { courseTxnTable } = require("../models/coursePaymentTxn");
const { paymentTransactionTable } = require("../models/paymentTransaction");
const { getBatchDetailsByBatchName, getBatchDetailsByOrderId } = require("../HelperFunctions/getBatchDetails");
const { blogsTable } = require("../models/blog");
const { ctaBannerTable } = require("../models/ctaBanner");
const { emiTxnTable } = require("../models/emiTransaction");
const { pdfGenerate } = require("../HelperFunctions/invoiceGenrationBatch");
const { lectureRoomTable } = require("../models/lectureRoom");
const fs = require("fs");
const path = require('path');
const { faqsTable } = require("../models/FAQs");
const { invoiceTable } = require("../models/Invoice");
const { ebookTable } = require("../models/ebook");
const { getSignUrl } = require("../aws/getSignedUrl");
const { ValidityTable } = require("../models/Validity");
const { crmTracking } = require("../HelperFunctions/crmTracking");
// import apicache from 'apicache'
let cache = apicache.middleware
// const youtubedl = require('youtube-dl-exec')
// const ytdlp = require('yt-dlp-exec');

const { batchValidityFeatures } = require("../HelperFunctions/validity_features");
const { el } = require("translate-google/languages");
const { sendWhatsAppMessage,batchPurchaseSuccess } = require("../HelperFunctions/whatsAppTemplates");


const upload = multer({ dest: "uploads/webContains" });

const convertYTUrls = async (url) => {
  // const result = await youtubedl.exec(url,{ dumpSingleJson: true }, {
  //   timeout: 50000,
  //   killSignal: 'SIGKILL'
  // })
  console.log(url);
  let url1 = `https://www.youtube.com/watch?v=V8IWD7uGPA0`;
  // youtubedl(url1, {
  //   dumpSingleJson: true,
  //   noCheckCertificates: true,
  //   noWarnings: true,
  //   preferFreeFormats: true,
  //   addHeader: ['referer:youtube.com', 'user-agent:googlebot']
  // }).then(output => console.log(output))
  // .catch(error => return error)
  // console.log(result);
  // ytdlp('https://www.youtube.com/watch?v=example', {
  //   output: '%(title)s.%(ext)s',
  // })
  //   .then(output => console.log('Download Success:', output))
  //   .catch(error => console.error('Download Failed:', error));
}
function generateRandomCourseTransactionId() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000); // You can adjust the range as needed
  const transactionId = `SD${timestamp}${randomNum}`;
  return transactionId;
}

function ValidateTokenForWeb(req, res, next) {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];

    let decodedData;
    if (token) {
      decodedData = jwt.verify(token, process.env.SECRET_KEY);
      req.userId = decodedData?.studentId;
    } else {
      req.userId = "";
    }
    next();
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Session expired",
    });
  }
}

const WebContain = express.Router();

WebContain.get("/getAllBatchesDetails", ValidateTokenForWeb, async (req, res) => {
  const { stream, limit, categorySlug, subCategorySlug } = req.query;
  const n = parseInt(limit) || 5;
  const { userId } = req;
  let user;
  let query = {

  };

  try {
    // const user = await findUserByUserId(req.userId);
    let staffs = [];
    let faqs = []
    if (stream && stream !== '') {
      const category = await categoryTable.findOne({ slug: stream, is_active: true }).populate('faqs', '_id question answer');
      if (category) {
        faqs = category?.faqs ?? [];
        query = {
          stream: category?.title,
          is_active: true,

        }
        staffs = await adminTeacherTable.find({ isActive: true, Role: 'teacher', categories: category?._id }).populate("subject", "title").populate('categories', "title slug").select("FullName profilePhoto subject demoVideo categories qualification");
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Not A valid Category Or Active Category"
        })
        // query = {
        //   is_active: true,
        //   stream: "NA"
        // }
        // staffs = await adminTeacherTable.find({ isActive : true , Role : 'teacher' }).populate("subject" , "title").populate('category' , "title slug").select("FullName profilePhoto subject demoVideo category");
      }
    } else {
      query = {
        is_active: true,
      }
      staffs = await adminTeacherTable.find({ isActive: true, Role: 'teacher' }).populate("subject", "title").populate('categories', "title slug").select("FullName profilePhoto subject demoVideo categories qualification");
    }


    // console.log("Qu", query)
    // if (userId) {
    //   user = await findUserByUserId(userId);
    //   if (user) {
    //     query.student = {
    //       $nin: [user._id]
    //     }
    //   }
    // }
    if (categorySlug) {
      let newCategory = await categoryTable.findOne({ slug: categorySlug });
      if (newCategory) {
        query.category = {
          $in: [newCategory?._id]
        }
      } else {
        return res.json({
          status: false,
          data: null,
          message: `Not An Valid Category`
        })
      }
    }
    if (subCategorySlug) {
      let newSubCategory = await subCategoryTable.findOne({ slug: subCategorySlug });
      if (newSubCategory) {
        query.subCategory = {
          $in: [newSubCategory?._id]
        }
      }
      else {
        return res.json({
          status: false,
          data: null,
          message: `Not An Valid Sub Category`
        })
      }
    }
    const batchDetails = await BatchesTable.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          localField: "_id",
          foreignField: "batch",
          from: 'validitytables',
          as: 'validities',
        }
      },
      {
        $lookup: {
          localField: "category",
          foreignField: '_id',
          from: 'categorytables',
          as: "categoriesDetails"
        }
      },
      {
        $lookup: {
          localField: "subCategory",
          foreignField: '_id',
          from: 'subcategorytables',
          as: "subCategoriesDetails"
        }
      },

      {
        $addFields: {
          studentCount: { $size: "$student" },
          batchOrderInt: {
            $convert: {
              input: "$batchOrder",
              to: "int",
              onError: 0,  // fallback for parse errors like ''
              onNull: 0    // fallback for null
            }
          }
        },
      },
      {
        $sort: {
          batchOrderInt: 1,
          createdAt: -1
        },
      },
      {
        $limit: n,
      },
    ]);
    // console.log(batchDetails);
    if (!batchDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Courses not found",
      });
    }
    let responseArr = [];
    const response = await Promise.all(batchDetails.map(async (item) => {
      // console.log(item);
      const category = await categoryTable.findOne({ title: item.stream });
      let categoryDetails = { id: "", title: "", slug: "" };
      if (category) {
        categoryDetails = {
          id: category._id ?? "",
          title: category.title ?? "",
          slug: category.slug ?? "",
          metaTitle: category.metaTitle ?? "",
          metaDesc: category.metaDesc ?? "",
          tags: category?.tags ?? [],
        }
      }
      let validity = [];
      for (let batchValidity of item.validities) {
        let obj = {
          id: batchValidity?._id,
          month: batchValidity?.month,
          salePrice: batchValidity?.salePrice,
          regularPrice: batchValidity?.regularPrice,
        }
        if (batchValidity.isActive == true) {
          validity.push(obj);
        }
      }
      let obj = {
        id: item._id ?? "",
        batchName: item.batch_name ?? "",
        batchId: item?.batchId ?? "",
        // examType: item.exam_type ?? "",
        startingDate: moment(item.starting_date, 'YYYY-MM-DD').format('DD MMMM, YYYY') ?? "",
        endingDate: moment(item.ending_date, 'YYYY-MM-DD').format('DD MMMM, YYYY') ?? "",
        batchSlug: item?.slug ?? "",
        mode: item.mode ?? "",
        // isLive: item.materials ?? "",
        language: item.language ?? "",
        banner: item.banner[0].fileLoc ?? "",
        stream: item.stream ?? "",
        batchFeatureUrl: batchValidityFeatures(item.stream),
        category: categoryDetails,
        // duration: item.,
        categories: item?.categoriesDetails?.map((item2) => { return { id: item2?._id, title: item2?.title, slug: item2?.slug } }),
        subCategories: item?.subCategoriesDetails?.map((item2) => { return { id: item2?._id, title: item2?.title, slug: item2?.slug } }),

        realPrice: item.charges ?? "",
        salePrice: item.discount ?? "",
        isEmi: item?.isEmi ?? false,
        duration: moment(item.ending_date).diff(moment(item.starting_date), 'days'),
        studentCount: item.studentCount ?? 0,
        validity,
        // faqs

      };
      // if (category?.is_active == true) {
      //   responseArr.push(obj);
      // }
      return obj;

    }));
    staffs = await Promise.all(staffs?.map(async (item) => {
      // let category = await categoryTable.findOne({ _id: item?.category }).select("title slug");
      let categories = await categoryTable.find({ _id: item?.categories }).select('title slug')
      return {
        id: item?._id ?? "",
        FullName: item?.FullName ?? "",
        profilePhoto: item?.profilePhoto ?? "",
        category: { title: categories[0]?.title ?? "", slug: categories[0]?.slug ?? "" },
        categories: categories?.map((item2) => { return { title: item2?.title ?? "", slug: item2?.slug ?? "" } }),
        demoVideo: item?.demoVideo ?? "",
        subject: item?.subject?.map((item) => { return item?.title }),
        qualification: item?.qualification ?? "",
      }
    }))



    return res.json({
      status: true,
      // data: { batches: responseArr, faculty: staffs, faqs: faqs },
      data: { batches: response, faculty: staffs, faqs: faqs },

      // staffs : staffs,
      msg: "Batches found",
    });

  } catch (err) {
    console.log(err)
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
}
);
// get courses by details
WebContain.get("/getBatchDetailsBySlug/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.json({
      status: false,
      data: null,
      msg: "Batch Slug not found",
    });
  }
  try {
    const batch = await BatchesTable.findOne({ slug: slug })
      .populate({
        path: 'teacher',
        select: "FullName _id profilePhoto Role demoVideo categories qualification",
        populate: {
          path: 'subject',
          select: 'title'
        }
      })
      .populate('category', '_id title slug')
      .populate('subCategory', '_id title slug')
      .populate('faqs', "question answer")
      .populate('features', '_id feature icon isActive order')

    const category = await categoryTable.findOne({ title: batch?.stream });
    if (!batch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch  not found",
      });
    }

    let recordedLectureCount = await LectureTable.countDocuments({ batch: batch?._id, LiveOrRecorded: 'Recorded' });
    const validities = await ValidityTable.find({ batch: batch?._id, isActive: true }).sort({ month: 1 })
    // await convertYTUrls(batch?.featureVideo?.url);
    return res.json({
      status: true,
      data: {
        id: batch._id ?? "",
        batchName: batch.batch_name ?? "",
        batchId: batch?.batchId,
        featureVideo: {
          videoType: batch?.featureVideo?.videoType ?? "",
          url: batch?.featureVideo?.url ?? ""
        },
        // examType: batch.exam_type ?? "",
        teachers: await Promise.all(batch?.teacher.map(async (item) => {
          let categories = await categoryTable.find({ _id: item?.categories }).select("_id title slug")
          return {
            name: item.FullName,
            profilePhoto: item.profilePhoto,
            // Role : item?.Role ?? "",
            subject: item?.subject?.map((subject) => { return subject?.title }),
            demoVideo: item?.demoVideo ?? "",
            qualification: item?.qualification ?? "",
            category: { title: categories[0]?.title ?? "", slug: categories[0]?.slug ?? "" },
            categories: categories?.map((item2) => { return { title: item2?.title ?? "", slug: item2?.slug ?? "" } }),

          };
        })) ?? [],
        faqs: batch?.faqs ?? [],
        // teachers: staffs ?? [],
        // teachers: {
        //   name: batch.teachers?.FullName ?? "",
        //   id: batch.teachers?._id ?? "",
        // },
        validities: validities?.map((item) => {
          return {
            id: item?._id ?? "",
            month: item?.month,
            salePrice: item?.salePrice,
            regularPrice: item?.regularPrice,
            isRecommended: item?.isRecommended,
          }
        }),
        categoryDetails: { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "", tags: category?.tags ?? [] },
        startingDate: moment(batch.starting_date, 'YYYY-MM-DD').format('DD MMMM, YYYY') ?? "",
        endingDate: moment(batch.ending_date, 'YYYY-MM-DD').format('DD MMMM, YYYY') ?? "",
        mode: batch.mode ?? "",
        isLive: batch.materials ?? "",
        language: batch.language ?? "",
        banner: batch.banner[0].fileLoc ?? "",
        stream: batch.stream ?? "",
        maximumCoin: batch.maxAllowedCoins ?? 0,
        validity: batch.validity ?? "",
        planner: batch.planner ?? "",
        metaTitle: batch?.metaTitle ?? "",
        metaDesc: batch?.metaDesc ?? "",
        demoVideo:
          batch.demoVideo.map((item) => {
            return item.fileLoc;
          }) ?? [],
        paid: batch.isPaid ?? "",
        description: batch.description ?? "",
        amount: batch.charges ?? 0,
        duration: moment(batch.ending_date).diff(moment(batch.starting_date), 'days'),
        discount: batch.discount ?? 0,
        studentCount: batch.student?.length ?? 0,
        isEmi: batch?.isEmi ?? false,
        emiOptions: batch?.emiOptions ?? [],
        recordedLectureCount: recordedLectureCount ?? 0,
        categories: batch?.category?.map((item) => { return { id: item?.id ?? "", title: item?.title, slug: item?.slug ?? "" } }),
        subCategories: batch?.subCategory?.map((item) => { return { id: item?.id ?? "", title: item?.title, slug: item?.slug ?? "" } }),
        featureVideo: {
          videoType: batch?.featureVideo?.videoType ?? "yt",//yt , upload
          url: batch?.featureVideo?.url ?? "https://www.youtube.com/watch?v=iWTDZdv9llw" //https://static.sdcampus.com/videos/doubt_community.mp4
        },
        batchFeatures: batch?.features?.filter((item) => item.isActive != false).sort((a, b) => a.order - b.order).map((item) => {
          return {
            featureId: item?._id ?? "",
            icon: item?.icon ?? "",
            feature: item?.feature ?? "",
          }
        })
      },
      msg: "Batch Found",
    });
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "something went wrong",
    });
  }
});

// get Catgeory

WebContain.get("/getAllCategory", async (req, res) => {
  try {
    let categories = await categoryTable.find({
      type: "Stream",
      is_active: true,
    }).sort({ createdAt: -1 });
    if (!categories) {
      return res.json({
        status: false,
        data: null,
        msg: "Categories not found",
      });
    }
    //console.log(categories)
    // const course = await BatchesTable.find({ stream: { $nin: categories.map((item) => item.title) } })
    let filterCategories = [];
    for (let cat of categories) {
      // let isAssociated = await BatchesTable.find({ stream: cat?.title, is_active: true });
      let isAssociated = await BatchesTable.find({ category: { $in: [cat?._id] }, is_active: true });

      if (isAssociated.length > 0) {
        filterCategories.push(cat);
      }
    }
    return res.json({
      status: true,
      data: await Promise.all(filterCategories.map(async (item) => {
        const subCategories = await subCategoryTable.find({ category: item?._id, is_active: true });
        return {
          id: item._id ?? "",
          name: item.title ?? "",
          banner: item.icon ?? "",
          slug: item.slug ?? "",
          metaTitle: item?.metaTitle ?? "",
          metaDesc: item?.metaDesc ?? "",
          tags: item?.tags ?? [],
          subCategories: subCategories?.map((item2) => {
            return {
              id: item2?._id,
              title: item2?.title ?? "",
              slug: item2?.slug ?? "",
            }
          }),
        };
      })),
      msg: "All Category found",
    });
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
});

// testSeries
WebContain.get("/getAllTestSeries", ValidateTokenForWeb, async (req, res) => {
  const { stream, limit } = req.query;
  const n = parseInt(limit) || 3;
  try {
    let query = [
      {
        is_active: true,
      },
    ];
    if (req.userId) {
      const user = await findUserByUserId(req.userId);
      if (user) {
        query.push({
          student: { $nin: [user?._id] },
        });
      }
    }
    if (stream) {
      const category = await categoryTable.findOne({ slug: stream });

      query.push({
        stream: category?.title,
      });
    }
    const testSeries = await TestSeriesTable.aggregate([
      {
        $match: {
          $and: query,
        },
      },
      {
        $addFields: {
          studentCount: { $size: "$student" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: n,
      },
    ]);
    if (!testSeries) {
      return res.json({
        status: false,
        data: null,
        msg: "Something went wrong",
      });
    }
    const response = await Promise.all(testSeries.map(async (item) => {
      const category = await categoryTable.findOne({ title: item.stream });
      // console.log(category);
      let categoryDetails = { id: "", title: "", slug: "" };
      if (category) {
        categoryDetails = {
          id: category._id ?? "",
          title: category.title ?? "",
          slug: category.slug ?? ""
        }
      }
      return {
        id: item._id ?? "",
        name: item.testseries_name ?? "",
        language: item.language ?? "",
        banner: item.banner[0].fileLoc ?? "",
        noOfTest: item.no_of_test,
        stream: item.stream ?? "",
        remark: item.remark ?? "",
        slug: item?.slug ?? "",
        categoryDetails,
        duration: moment(item.ending_date).diff(moment(item.starting_date), 'days'),
        startingDate: item.starting_date ?? "",
        endingDate: item?.ending_date ?? "",
        realPrice: item.charges ?? "",
        salePrice: item.discount ?? "",
        link: item.link ?? "",
        charges: item.charges ?? "",
        studentCount: item.studentCount ?? 0,
      };
    }));
    return res.json({
      status: true,
      data: response,
      msg: " TestSeries found",
    });

  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
});

// free TestSeries
WebContain.get("/getFreeTestSeries", ValidateTokenForWeb, async (req, res) => {
  const { stream, limit } = req.query;
  const n = parseInt(limit) || 5;
  try {
    let query = [
      {
        is_active: true,
        charges: "0",
      }
    ]
    if (req.userId) {
      const user = await findUserByUserId(req.userId);
      //  console.log(user);
      if (user) {
        query.push({
          student: { $nin: [user?._id] },
        });
      }
    }
    if (stream) {
      const category = await categoryTable.findOne({ slug: stream });
      query.push({ stream: category?.title });
    }
    const freeTestSeries = await TestSeriesTable.aggregate([
      {
        $match: {
          $and: query,
        },
      },
      {
        $addFields: {
          studentCount: { $size: "$student" }
        }
      },
      {
        $limit: n,
      },
    ])
    const response = await Promise.all(freeTestSeries.map(async (item) => {
      const category = await categoryTable.findOne({ title: item.stream });
      // console.log(category);
      let categoryDetails = { id: "", title: "", slug: "", tags: [] };
      if (category) {
        categoryDetails = {
          id: category._id ?? "",
          title: category.title ?? "",
          slug: category.slug ?? "",
          tags: category.tags ?? [],
        }
      }
      return {
        id: item._id ?? "",
        name: item.testseries_name ?? "",
        language: item.language ?? "",
        banner: item.banner[0].fileLoc ?? "",
        noOfTest: item.no_of_test ?? 0,
        stream: item.stream ?? "",
        link: item.link ?? "",
        categoryDetails,
        studentCount: item.student?.length ?? 0,
      };
    }));
    return res.json({
      status: true,
      data: response,
      msg: " TestSeries found",
    });
  }
  catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
});

WebContain.get("/getTestSeriesById/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "TestSeries Id  not found",
    });
  }
  try {
    const testSeries = await TestSeriesTable.findById(id);
    if (!testSeries) {
      return res.json({
        status: false,
        data: null,
        msg: "TestSeries  not found",
      });
    }
    const tests = await TestSeriesTestTable.find({
      TestSeries: testSeries?._id,
      is_active: true,
    });
    let testsDetails = [];
    if (tests) {
      testsDetails = tests.map((item) => {
        return {
          id: item._id ?? "",
          name: item.Test_title ?? "",
          code: item.Test_code ?? "",
          noOfQuestions: item.No_of_questions ?? 0,
          totalMarks: item.totalMarks ?? 0,
          questionPaperType: item.question_paper_type ?? "",
          isNegativeMarking: item.negativemarking ?? "",
          negativeMarksPerQuestion: item.negativeMarks ?? 0,
          duration: item.duration ?? 0,
        };
      });
    }
    return res.json({
      status: true,
      data: {
        id: testSeries._id ?? "",
        name: testSeries.testseries_name ?? "",
        language: testSeries.language ?? "",
        banner: testSeries.banner[0].fileLoc ?? "",
        noOfTest: testSeries.no_of_test ?? 0,
        testsDetails,
        stream: testSeries.stream ?? "",
        amount: testSeries.charges ?? 0,
        discount: testSeries.discount ?? 0,
        startingDate: testSeries.starting_date ?? "",
        endingDate: testSeries.ending_date ?? "",
        slug: testSeries?.slug ?? "",
        duration: moment(testSeries.ending_date).diff(moment(testSeries.starting_date), 'days'),
        studentCount: testSeries.student?.length ?? 0,
        maximumCoin: testSeries.maxAllowedCoins ?? 0,
      },
      msg: "TestSeries found",
    });
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
});


WebContain.get("/getLatestTestSeries", ValidateTokenForWeb, async (req, res) => {
  const { stream, limit } = req.query;
  const n = parseInt(limit) || 5;
  try {
    const user = await findUserByUserId(req.userId);
    if (req.userId && !user) {
      return res.json({
        status: false,
        data: null,
        msg: "Something went wrong",
      });
    }
    if (!stream) {
      const testSeries = await TestSeriesTable.find({ is_active: true })
        .sort({ _id: -1 })
        .limit(n);
      if (!testSeries) {
        return res.json({
          status: false,
          data: null,
          msg: "Something went wrong",
        });
      }
      if (req.userID) {

      }
      const response = await Promise.all(testSeries.map(async (item) => {
        const category = await categoryTable.findOne({ title: item.stream });
        let categoryDetails = { id: "", title: "", slug: "", tags: [] };
        if (category) {
          categoryDetails = {
            id: category._id ?? "",
            title: category.title ?? "",
            slug: category.slug ?? "",
            tags: category?.tags ?? [],
          }
        }
        return {
          id: item._id ?? "",
          name: item.testseries_name ?? "",
          language: item.language ?? "",
          banner: item.banner[0].fileLoc ?? "",
          noOfTest: item.no_of_test ?? 0,
          link: item.link ?? "",
          categoryDetails,
          stream: item.stream ?? "",
          studentCount: item.student?.length ?? 0,
        };
      }));
      return res.json({
        status: true,
        data: response,
        msg: " TestSeries found",
      });
    } else {
      const category = await categoryTable.findOne({ slug: stream });
      const testSeries = await TestSeriesTable.find({
        stream: category?.title,
        is_active: true,
      })
        .sort({ _id: -1 })
        .limit(n);
      if (!testSeries) {
        return res.json({
          status: false,
          data: null,
          msg: "Something went wrong",
        });
      }
      let categoryDetails = { id: "", title: "", slug: "", tags: [] };
      if (category) {
        categoryDetails = {
          id: category._id ?? "",
          title: category.title ?? "",
          slug: category.slug ?? "",
          tags: category?.tags ?? [],
        }
      }
      const response = testSeries.map((item) => {
        return {
          id: item._id ?? "",
          name: item.testseries_name ?? "",
          language: item.language ?? "",
          banner: item.banner[0].fileLoc ?? "",
          noOfTest: item.no_of_test ?? 0,
          stream: item.stream ?? "",
          categoryDetails,
          studentCount: item.student?.length ?? 0,
        };
      });
      return res.json({
        status: true,
        data: response,
        msg: " TestSeries found",
      });
    }
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
});

// testimonal
WebContain.get("/getAllTestimonal", async (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit) || 5;
  try {
    const testimonals = await TestimonialTable.find({ is_active: true }).limit(
      n
    );
    if (!testimonals) {
      return res.json({
        status: false,
        data: null,
        msg: "Testimonals not found",
      });
    }
    const response = testimonals.map((item) => {
      return {
        id: item.id ?? "",
        studentName: item.student_name ?? "",
        rank: item.rank ?? "",
        photo: item.photo.fileLoc ?? "",
        message: item.message ?? "",
        exam: item.exam ?? "",
        year: item.year ?? "",
        language: item.language ?? "",
      };
    });
    return res.json({
      status: true,
      data: response,
      msg: "Testimonals found",
    });
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something Went wrong",
    });
  }
});


WebContain.get("/getAllQuiz", async (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit) || 5;
  try {
    if (req.userID) {
      const user = await findUserByUserId(req.userID);
      if (user) {
        const userResponse = await QuizResponseTable.find({ user_id: user._id });
        const attemptedQuizIds = userResponse.map((response) => response.quiz_id);

        const quizzes = await QuizTable.find({
          is_active: true,
          _id: { $nin: attemptedQuizIds },
        }).limit(n);

        if (quizzes && quizzes.length > 0) {
          const response = quizzes.map((item) => {
            return {
              id: item._id ?? "",
              name: item.quiz_title ?? "",
              description: item.quiz_desc ?? "",
              duration: item.quiz_duration ?? "",
              noOfQuestions: item.no_ques ?? "",
              eachQuestionMark: item.eachQueMarks ?? "",
              banner: item.quiz_banner[0] ?? "",
            };
          });

          return res.json({
            status: true,
            data: response,
            msg: "Quizzes found",
          });
        } else {
          return res.json({
            status: false,
            data: null,
            msg: "No quizzes found",
          });
        }
      }
    } else {
      const allQuizzes = await QuizTable.find({ is_active: true }).limit(n);

      if (allQuizzes && allQuizzes.length > 0) {
        const response = allQuizzes.map((item) => {
          return {
            id: item._id ?? "",
            name: item.quiz_title ?? "",
            description: item.quiz_desc ?? "",
            duration: item.quiz_duration ?? "",
            noOfQuestions: item.no_ques ?? "",
            eachQuestionMark: item.eachQueMarks ?? "",
            banner: item.quiz_banner[0] ?? "",
          };
        });

        return res.json({
          status: true,
          data: response,
          msg: "All quizzes found",
        });
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "No quizzes found",
        });
      }
    }
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something went wrong",
    });
  }
});



WebContain.get("/getAllFreeTest", async (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit) || 5;
  try {
    const allTest = await TestSeriesTestTable.find({})
      .populate("TestSeries", "testseries_name _id charges")
      .limit(n);
    if (allTest) {
      const response = allTest
        .filter((item) => item?.TestSeries?.charges == "0")
        .map((item) => {
          return {
            id: item._id ?? "",
            name: item.Test_title ?? "",
            code: item.Test_code ?? "",
            noOfQuestions: item.No_of_questions ?? 0,
            totalMarks: item.totalMarks ?? 0,
            questionPaperType: item.question_paper_type ?? "",
            isNegativeMarking: item.negativemarking ?? "",
            negativeMarksPerQuestion: item.negativeMarks ?? 0,
            duration: item.duration ?? 0,
            testSeries: {
              name: item.TestSeries?.testseries_name ?? "",
              id: item.TestSeries?._id ?? "",
            },
          };
        });
      return res.json({
        status: true,
        data: response,
        msg: "Tests found",
      });
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "Tests not found",
      });
    }
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "",
    });
  }
});

// get all SubCategory
WebContain.get("/getAllSubCategory", async (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit) || 5;
  try {
    const allSubCategory = await subCategoryTable
      .find({ is_active: true })
      .populate("category", "title _id tags")
      .limit(n);
    if (!allSubCategory) {
      return res.json({
        status: false,
        data: null,
        msg: "Sub Categories not found",
      });
    }

    return res.json({
      status: true,
      data: allSubCategory.map((item) => {
        return {
          id: item._id ?? "",
          name: item.title ?? "",
          // banner : item.icon ?? "",
          category: {
            name: item.category?.title ?? "",
            id: item.category?._id ?? "",
            tags: item.category?.tags ?? [],
          },
        };
      }),
      msg: "All Sub Category found",
    });
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something went wrong",
    });
  }
});

// get PYq
WebContain.get("/getAllPYQs", async (req, res) => {
  try {
    const { category, subCategory, limit } = req.query;
    const n = parseInt(limit) || 5;
    let filterQuery = {};
    if (category && subCategory) {
      filterQuery = {
        category,
        subCategory,
      };
    } else if (!category && subCategory) {
      filterQuery = { subCategory };
    } else if (category && !subCategory) {
      filterQuery = { category };
    } else {
      filterQuery = {};
    }

    const getAllPYQs = await previousYearQuestionPapersTable
      .find({ ...filterQuery, is_active: true })
      .populate("category", "title _id")
      .populate("subCategory", "title  _id")
      .limit(n);
    if (!getAllPYQs) {
      return res.json({
        status: false,
        data: null,
        msg: "PYQs not found",
      });
    }
    return res.json({
      status: true,
      data: getAllPYQs.map((item) => {
        return {
          id: item._id ?? "",
          name: item.title ?? "",
          category: {
            name: item?.category?.title ?? "",
            id: item.category?._id ?? "",
          },
          subCategory: {
            name: item.subCategory?.title ?? "",
            id: item.subCategory?._id ?? "",
          },
        };
      }),
      msg: "All PYQs found",
    });
  } catch (err) {
    return res.json({
      status: false,
      data: null,
      msg: err.message || "Something went wrong",
    });
  }
});

// user Registration api

WebContain.post("/userRegistration", async (req, res) => {
  const { password, mobileNumber, FullName, deviceName, deviceConfig } =
    req.body;
  let email;
  const name = FullName;
  var passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
  let phonenumber = /^\d{10}$/;
  if (!mobileNumber.match(phonenumber)) {
    return res.json({
      status: false,
      data: null,
      msg: "Please Check Your Phone Number",
    });
  }
  if (!password.match(passwordRegex)) {
    //checking for the strenght of the password
    return res.json({
      msg: "Please Choose a Strong Password",
      data: null,
      status: false,
    });
  }
  if (req.body.email) {
    //checking if email is given by the user
    email = req.body.email;
  }
  let username_from_mobile = mobileNumber.substring(4, 9); //genarating a random userName
  let username;
  if (email) {
    username = generateFromEmail(email, 6);
  } else {
    username = generateFromEmail(username_from_mobile, 6);
  }
  try {
    let user_exists_email;
    if (email) {
      //checking if the user exists in database
      user_exists_email = await findUserByEmail(email);
    }
    const user_exists_mobileNumber = await findUserByMobileNumber(mobileNumber);
    if (user_exists_email) {
      return res.status(400).json({
        status: false,
        data: null,
        msg: "This Email Already Exists.",
      });
    }
    if (user_exists_mobileNumber) {
      return res.status(400).json({
        status: false,
        data: null,
        msg: "This Phone Number Already Exists.",
      });
    }
    let emialotp = Math.floor(Math.random() * 9999);
    if (emialotp.toString().length != 4) {
      emialotp = Math.floor(Math.random() * 9999);
    }
    let mobileOTP = Math.floor(Math.random() * 9999); //creating a new user and sending the otp for 2 step verification
    if (mobileOTP.toString().length != 4) {
      mobileOTP = Math.floor(Math.random() * 9999);
    }
    mobileOTP = "1234";
    // await SendOtpSms(mobileOTP, mobileNumber);
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const time =
      date.getHours() * 60 + date.getMinutes() * 60 + date.getSeconds();
    bcrypt.hash(password, 8, async (err, hashedPassword) => {
      if (err) {
        return err;
      }
      let userID = uuidv1();
      const RefreshTokenAuth = jwt.sign(
        { studentId: userID },
        process.env.SECRET_KEY,
        { expiresIn: "24h" }
      );
      // req.session= { name:'guru' };
      const user = new UserTable({
        FullName: FullName,
        username: username,
        password: hashedPassword,
        email: email,
        created_at: formatedDate,
        deviceName: deviceName,
        deviceConfig: deviceConfig,
        mobileNumber: mobileNumber,
        Stream: [],
        RefreshToken: RefreshTokenAuth,
        emailVerificationOTP: emialotp,
        mobileNumberVerificationOTP: mobileOTP,
        otpcreatedDate: time,
        userId: userID,
        myReferralCode: await generateReferralCode(),
        signinType: "App",
      });
      const data = await user.save();
      const txnData = {
        action: "add",
        reason: "signup",
        amount: "51",
        dateTime: formatedDate,
      };
      await saveRefAmount(data._id, txnData);

      if (email?.length != 0) {
        jwt.sign(
          //assigning a jwt token to the user , signing with email if email exists
          { studentId: data.userId },
          process.env.SECRET_KEY,
          { expiresIn: "30d" },
          (err, accessToken) => {
            if (err) {
              console.log(err);
            }
            // const name = FullName;
            let maildata = {
              FullName: FullName,
            };
            sendEmail("RegistrationEmail", email, name, maildata);
            return res.json({
              status: true,
              data: {
                token: accessToken,
                email: data.email,
                mobileNumberVerificationOTP: "",
                username: username,
                userId: userID,
                myReferralCode: data.myReferralCode ?? "",
                _id: user._id,
              },
              msg: "",
            });
          }
        );
      } else {
        jwt.sign(
          //signing the jwt token with the username
          { user: data._id, studentId: data.userId },
          process.env.SECRET_KEY,
          { expiresIn: "30d" },
          (err, accessToken) => {
            if (err) {
              console.log(err);
            }
            sendEmail("RegistrationEmail", email, name, {});
            return res.json({
              status: true,
              mobileotp: mobileOTP,
              data: {
                token: accessToken,
                email: data.email,
                mobileNumberVerificationOTP: "",
                username: username,
                myReferralCode: data.myReferralCode ?? "",
              },
              msg: "",
            });
          }
        );
      }
    });
  } catch (err) {
    res.json({
      status: false,
      err: err,
      data: null,
      msg: "There is some issue, Please Try Again!",
    });
  }
});


// check user


WebContain.get("/getCoupons", ValidateTokenForWeb, async (req, res) => {
  const { userId } = req;
  const { link, linkWith } = req.query;
  let query = {};
  try {
    if (userId) {
      const userDetails = await findUserByUserId(userId);
      if (userDetails) {
        query = {
          is_active: true,
          link,
          linkWith
        }
      }
    } else {
      query = {
        is_active: true,
        couponAccess: "all",
        link,
        linkWith
      }
    }
    // console.log(query);
    const todayDate = new Date();
    const coupons = await couponTable.find({ ...query, expirationDate: { $gt: todayDate } });
    if (!coupons) {
      return res.json({
        status: false,
        data: [],
        msg: "Coupons not found"
      })
    }
    // const response = coupons.map((item) => {
    //   return {
    //     couponId: item._id ?? "",

    //     couponCode: item.couponCode ?? "",
    //     couponType: item.couponType ?? "",
    //     couponValue: item.couponValue ?? "",
    //     expirationDate: item.expirationDate ?? "",
    //     couponAccess: item.couponAccess ?? "",
    //     // is_active: item.is_active ?? "",
    //     created_at: item.created_at ?? "",
    //     updated_at: item.updated_at ?? "",
    //   }
    // })
    let couponArray = await Promise.all(coupons?.map(async (item) => {
      if (item.link == 'batch') {
        const batch = await BatchesTable.findOne({ _id: item?.linkWith });
        if (!batch) {
          return {
            couponId: item._id,
            // createdBy: { name: item.user.FullName, role: item.user.Role },
            couponCode: item.couponCode,
            couponType: item.couponType,
            link: item.link ?? "",
            linkWith: { id: "NA", title: "NA" },
            couponValue: item.couponValue,
            expirationDate: item.expirationDate,
            couponAccess: item.couponAccess,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }
        }
        return {
          couponId: item._id,
          // createdBy: { name: item.user.FullName, role: item.user.Role },
          couponCode: item.couponCode,
          couponType: item.couponType,
          link: item.link ?? "",
          linkWith: { id: batch?._id ?? "NA", title: batch?.batch_name ?? "NA" },
          couponValue: item.couponValue,
          expirationDate: item.expirationDate,
          couponAccess: item.couponAccess,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }

      } else if (item.link == 'testSeries') {
        const testSeries = await TestSeriesTable.findOne({ _id: item?.linkWith });
        if (!testSeries) {
          return {
            couponId: item._id,
            // createdBy: { name: item.user.FullName, role: item.user.Role },
            couponCode: item.couponCode,
            couponType: item.couponType,
            link: item.link ?? "",
            linkWith: { id: "NA", title: "NA" },
            couponValue: item.couponValue,
            expirationDate: item.expirationDate,
            couponAccess: item.couponAccess,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }
        }
        return {
          couponId: item._id,
          // createdBy: { name: item.user.FullName, role: item.user.Role },
          couponCode: item.couponCode,
          couponType: item.couponType,
          link: item.link ?? "",
          linkWith: { id: testSeries?._id ?? "NA", title: testSeries?.testseries_name ?? "NA" },
          couponValue: item.couponValue,
          expirationDate: item.expirationDate,
          couponAccess: item.couponAccess,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }

      } else if (item.link == 'product') {
        const product = await storeProductTable.findOne({ _id: item.linkWith });
        if (!product) {
          return {
            couponId: item._id,
            // createdBy: { name: item.user.FullName, role: item.user.Role },
            couponCode: item.couponCode,
            couponType: item.couponType,
            link: item.link ?? "",
            // link : "Product"
            linkWith: { id: "NA", title: "NA" },
            couponValue: item.couponValue,
            expirationDate: item.expirationDate,
            couponAccess: item.couponAccess,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }
        }
        return {
          couponId: item._id,
          // createdBy: { name: item.user.FullName, role: item.user.Role },
          couponCode: item.couponCode,
          couponType: item.couponType,
          link: item.link ?? "",
          linkWith: { id: product?._id ?? "NA", title: product?.title ?? "NA" },
          couponValue: item.couponValue,
          expirationDate: item.expirationDate,
          couponAccess: item.couponAccess,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }

      } else if (item.link == 'productCategory') {
        const productCategory = await productCategoryTable.findOne({ _id: item?.linkWith });
        if (!productCategory) {
          return {
            couponId: item._id,
            // createdBy: { name: item.user.FullName, role: item.user.Role },
            couponCode: item.couponCode,
            couponType: item.couponType,
            link: item.link ?? "",
            linkWith: { id: "NA", title: "NA" },
            couponValue: item.couponValue,
            expirationDate: item.expirationDate,
            couponAccess: item.couponAccess,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }
        }
        return {
          couponId: item._id,
          // createdBy: { name: item.user.FullName, role: item.user.Role },
          couponCode: item.couponCode,
          couponType: item.couponType,
          link: item.link ?? "",
          linkWith: { id: productCategory?._id ?? "NA", title: productCategory?.title ?? "NA" },
          couponValue: item.couponValue,
          expirationDate: item.expirationDate,
          couponAccess: item.couponAccess,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }

      }
      else {
        return {
          couponId: item._id,
          // createdBy: { name: item.user.FullName, role: item.user.Role },
          couponCode: item.couponCode,
          couponType: item.couponType,
          link: item.link ?? "",
          linkWith: { id: "NA", title: "NA" },
          couponValue: item.couponValue,
          expirationDate: item.expirationDate,
          couponAccess: item.couponAccess,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }
      }
    }))

    return res.json({
      status: true,
      data: couponArray ?? [],
      msg: "Coupons found"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Coupons not found"
    })
  }
})

function formatDateTime(inputDateTime) {
  // Parse the input date string
  const parts = inputDateTime.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
  if (!parts) {
    // Handle invalid input
    return "Invalid date format";
  }

  // Extract date components
  const day = parseInt(parts[1], 10);
  const monthIndex = parseInt(parts[2], 10) - 1; // Months are zero-based
  const year = parseInt(parts[3], 10);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Extract time components
  const hours = parseInt(parts[4], 10);
  const minutes = parseInt(parts[5], 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  const formattedHours = hours % 12 || 12;

  const date1 = `${day} ${monthNames[monthIndex]}. ${year}`
  const time1 = `${formattedHours} ${ampm}`
  return {
    date: date1,
    time: time1
  }
}

WebContain.get("/getLecturesByBatchSlug/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.json({
      status: false,
      data: null,
      msg: "Batch Slug required",
    })
  }
  const isBatch = await BatchesTable.findOne({ slug: slug })
  if (!isBatch) {
    return res.json({
      status: false,
      data: null,
      msg: "Batch Not Found"
    })
  }
  let teacherArr = isBatch.teacher?.remove('65264fda9701e790f3bec0b4');
  const faculty = await adminTeacherTable
    .find({ Role: "teacher", _id: { $in: teacherArr } })
    .populate('subject', 'title is_active');
  const { limit } = req.query;
  const n = parseInt(limit) || 15;
  try {
    const lectures = await LectureTable.find({ batch: isBatch?._id, isActive: true }).populate('teacher', 'FullName profilePhoto Role demoVideo categories qualification').populate('subject', '_id title').sort({ startingDate: 1 }).limit(n);
    if (lectures) {
      let batchLectures = [];
      lectures.map(async (item) => {
        let obj = {
          name: item.lecture_title ?? "",
          description: item.description ?? "",
          teachers: await Promise.all(item?.teacher.map(async (item) => {
            let categories = await categoryTable.find({ _id: item?.categories }).select("_id title slug");
            return {
              FullName: item?.FullName,
              profilePhoto: item?.profilePhoto,
              // Role : item?.Role ?? "",
              demoVideo: item?.demoVideo ?? "",
              category: { title: categories[0]?.title ?? "", slug: categories[0]?.slug ?? "" },
              categories: categories?.map((item2) => { return { title: item2?.title ?? "", slug: item2?.slug ?? "" } }),
              qualification: item?.qualification ?? ""
            }
          })) ?? [],
          subjectId: item?.subject?._id ?? "",
          subjects: item?.subject.title ?? "",
          link: item.link ?? "",
          LiveOrRecorded: item.LiveOrRecorded ?? "",
          startingDate: formatDateTime(item.starting_date) ?? "",
          endingDate: formatDateTime(item.ending_date) ?? "",
          material: item?.material?.fileLoc ?? "",
          ytLiveChatId: item.ytLiveChatId ?? "",
          language: item.language ?? "",
          banner: item?.banner ?? "https://d1mbj426mo5twu.cloudfront.net/Banner/Lecture%20Banner%20/sd-banner_1711950515.png",
        }
        if (!batchLectures.some(item2 => item2.subjectId === item.subject?._id)) {
          batchLectures.push(obj);
        }
      });

      return res.json({
        status: true,
        data: {
          batchLectures,
          faculty: await Promise.all(faculty?.map(async (item) => {
            // let category = await categoryTable.findOne({ _id: item?.category }).select("title _id slug");
            let categories = await categoryTable.find({ _id: item?.categories }).select("_id title slug");

            return {
              FullName: item?.FullName ?? "",
              profilePhoto: item?.profilePhoto ?? "",
              // Role :  item?.Role ?? "",
              subject: item?.subject?.map((item) => { return item?.title }),
              demoVideo: item?.demoVideo ?? "",
              category: { title: categories[0]?.title ?? "", slug: categories[0]?.slug ?? "" },
              categories: categories?.map((item2) => { return { title: item2?.title ?? "", slug: item2?.slug ?? "" } }),

              qualification: item?.qualification ?? "",
            }
          }))
        },
        msg: "Lectures found"

      })
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "Lectures not found"

      })
    }

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Something went wrong`,
    })
  }

})


// call existing one --> /getbannerdetails -> r
WebContain.get("/getBanner", async (req, res) => {
  const { category, BannerType } = req.query;
  // const n = parseInt(limit) || 5;
  try {
    let query = {
      is_active: true,
      BannerType: BannerType
    }
    if (!BannerType || BannerType == "") {
      query = {
        is_active: true,
        BannerType: 'WEB'
      }
    }

    if (category) {
      query = {
        is_active: true,
        BannerType: BannerType,
        linkWith: category
      }
    }
    let banners = await BannerTable.find(query).sort({ createdAt: -1 });
    if (banners?.length == 0) {
      banners = await BannerTable.find({ is_active: true, BannerType: BannerType }).sort({ createdAt: -1 })
    }
    if (banners) {
      return res.json({
        status: true,
        data: await Promise.all(banners.map(async (item) => {
          let categoryDetails = {
            id: "NA",
            title: "NA",
            slug: "NA",
          };
          let batchDetails = {
            id: "NA",
            batchName: "NA",
            slug: "NA",
          }
          if (item?.link == 'batch') {
            const isBatch = await BatchesTable.findOne({ _id: item?.linkWith });
            const category = await categoryTable.findOne({ title: isBatch?.stream });
            categoryDetails = {
              id: category?._id ?? "NA",
              title: category?.title ?? "NA",
              slug: category?.slug ?? "NA",
              tags: category?.tags ?? [],
            }
            batchDetails = {
              id: isBatch?._id ?? "NA",
              batchName: isBatch?.batch_name ?? "NA",
              slug: isBatch?.slug ?? "NA",
            }
          }
          if (item?.link == 'category') {
            const category = await categoryTable.findOne({ _id: item?.linkWith });
            categoryDetails = {
              id: category?._id ?? "NA",
              title: category?.title ?? "NA",
              slug: category?.slug ?? "NA",
              tags: category?.tags ?? [],
            }
          }
          return {
            title: item.title ?? "",
            url: item.banner_url ?? "",
            linkWith: item.linkWith ?? "",
            categoryDetails,
            batchDetails,
            link: item.link ?? "",
            language: item.language ?? "",
          }
        })),
        msg: "Banners found"
      })

    }

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || 'Banners not found'
    })
  }
})

WebContain.get("/getAllStaff", async (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit) || 5;

  try {
    const allStaff = await adminTeacherTable
      .find({ Role: "teacher", _id: { $nin: "65264fda9701e790f3bec0b4" }, isActive: true })
      .limit(n)
      .populate('categories', "title slug")
      .populate('subject', 'title is_active');

    if (!allStaff) {
      return res.json({
        status: false,
        data: null,
        msg: "There is no current teacher present",
      });
    }
    return res.json({
      status: true,
      data: allStaff.map((item) => {
        return {
          FullName: item?.FullName ?? "",
          profilePhoto: item?.profilePhoto ?? "",
          subject: item?.subject.map((subject) => { return subject?.title }),
          category: { title: item?.categories[0]?.title ?? "", slug: item?.categories[0]?.slug ?? "" },
          categories: item?.categories?.map((item2) => { return { title: item2?.title ?? "", slug: item2?.slug ?? "" } }),
          demoVideo: item?.demoVideo ?? "",
          qualification: item?.qualification ?? "",

        };
      }),
      msg: "Teacher details fetch successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "No record of teacher is found",
    });
  }
});


WebContain.get("/getallYoutube", async (req, res) => {
  const { limit, category } = req.query;
  try {
    const n = parseInt(limit) || 5;
    let query = {
      is_active: true
    }
    if (category) {
      query = {
        is_active: true,
        link: 'category',
        linkWith: category,
      }
    }
    const allYoutubeVideos = await YouTube_Url
      .find(query)
      .limit(n);
    if (!allYoutubeVideos) {
      return res.json({
        status: false,
        data: null,
        msg: "Youtube videos not found"
      })
    }

    return res.json({
      status: true,
      data: allYoutubeVideos.map((item) => ({
        title: item.title ?? "",
        video_url: item.video_url ?? "",
        slug: item?.slug ?? "",
        link: item?.link ?? "",
        linkWith: item?.linkWith ?? "",
        language: item.language ?? "",
      })),
      msg: "YouTube videos retrieved successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Something went wrong",
    });
  }
});

WebContain.post("/createCTA", async (req, res) => {
  const { fullName, email, category, msg, phoneNumber, standard, utm_campaign, utm_source, utm_medium } = req.body;
  if (!phoneNumber) {
    return res.json({
      status: false,
      data: null,
      msg: `phoneNumber required!`
    })
  }
  try {

    const phoneRegx = /^\d{10}$/;
    const isValidPhone = phoneNumber.match(phoneRegx) && phoneNumber.length === 10;

    if (!isValidPhone) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid Mobile No."
      });
    }
    const isCTA = await ctaTable.findOne({ phoneNumber });
    if (isCTA) {
      return res.json({
        status: false,
        data: null,
        msg: 'CTA is already exist'
      })
    }
    let isCategory = { title: "" };
    if (category) {
      isCategory = await categoryTable.findOne({ _id: category })
    }
    // let isCategory =  await categoryTable.findOne({ _id : })
    const newCTA = new ctaTable({
      fullName,
      email,
      category,
      msg,
      standard,
      phoneNumber,
      utm_campaign,
      utm_source,
      utm_medium,
    })
    const saveCTA = await newCTA.save();
    // if( ['app','ios' , 'website'].includes(platform)){
    crmTracking({ FullName: saveCTA?.fullName, mobileNumber: saveCTA?.phoneNumber, email: saveCTA?.email, platform: "campus_web_cta", utm_source: saveCTA?.utm_source, utm_medium: saveCTA?.utm_medium, utm_campaign: saveCTA?.utm_campaign, category: isCategory?.title ?? "", subCategory: "" })
    // }
    return res.json({
      status: true,
      data: saveCTA,
      msg: 'We will get you back to you.'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || 'CTA not created.'
    })
  }
})

WebContain.post("/register", async (req, res) => {
  const { password, mobileNumber, FullName, email, fcmToken, utm_campaign, utm_source, utm_medium } =
    req.body;
  if (!password && !mobileNumber && !FullName && !email) {
    return res.json({
      status: false,
      data: null,
      msg: "Please provide the required details!"
    })
  }
  // let email;
  const name = FullName;
  var passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
  let phonenumber = /^\d{10}$/;
  if (!mobileNumber.match(phonenumber)) {
    return res.json({
      status: false,
      data: null,
      msg: "Please Check Your Phone Number",
    });
  }
  if (!password.match(passwordRegex)) {
    //checking for the strenght of the password
    return res.json({
      msg: "Please Choose a Strong Password",
      data: null,
      status: false,
    });
  }

  let username_from_mobile = mobileNumber.substring(4, 9); //genarating a random userName
  let username;
  if (email) {
    username = generateFromEmail(email, 6);
  } else {
    username = generateFromEmail(username_from_mobile, 6);
  }
  try {
    let user_exists_email;
    if (email) {
      //checking if the user exists in database
      user_exists_email = await findUserByEmail(email);
    }
    const user_exists_mobileNumber = await findUserByMobileNumber(mobileNumber);
    if (user_exists_email) {
      return res.json({
        status: false,
        data: null,
        msg: "This Email Already Exists.",
      });
    }
    if (user_exists_mobileNumber) {
      return res.json({
        status: false,
        data: null,
        msg: "This Phone Number Already Exists.",
      });
    }
    let emialotp = Math.floor(Math.random() * 9999);
    if (emialotp.toString().length != 4) {
      emialotp = Math.floor(Math.random() * 9999);
    }
    let mobileOTP = Math.floor(Math.random() * 9999); //creating a new user and sending the otp for 2 step verification
    if (mobileOTP.toString().length != 4) {
      mobileOTP = Math.floor(Math.random() * 9999);
    }
    mobileOTP = "1234"
    // await SendOtpSms(mobileOTP, mobileNumber);
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const time =
      date.getHours() * 60 + date.getMinutes() * 60 + date.getSeconds();
    bcrypt.hash(password, 8, async (err, hashedPassword) => {
      if (err) {
        return err;
      }
      let userID = uuidv1();
      const RefreshTokenAuth = jwt.sign(
        { studentId: userID },
        process.env.SECRET_KEY,
        { expiresIn: "24h" }
      );
      // req.session= { name:'guru' };
      const user = new UserTable({
        FullName: FullName,
        username: username,
        password: hashedPassword,
        email: email,
        created_at: formatedDate,
        deviceName: "",
        deviceConfig: "",
        fcmToken,
        mobileNumber: mobileNumber,
        Stream: [],
        RefreshToken: RefreshTokenAuth,
        emailVerificationOTP: emialotp,
        mobileNumberVerificationOTP: mobileOTP,
        otpcreatedDate: time,
        userId: userID,
        utm_campaign,
        utm_source,
        utm_medium,
        myReferralCode: await generateReferralCode(),
        signinType: "WebSiteOrStore",
      });
      const data = await user.save();
      const txnData = {
        action: 'add',
        reason: 'signup',
        amount: '51',
        dateTime: formatedDate,
      }
      await saveRefAmount(data._id, txnData)

      if (email?.length != 0) {
        jwt.sign(
          //assigning a jwt token to the user , signing with email if email exists
          { studentId: data.userId },
          process.env.SECRET_KEY,
          { expiresIn: "30d" },
          (err, accessToken) => {
            if (err) {
              console.log(err);
            }
            // const name = FullName;
            let maildata = {
              FullName: FullName,
            };
            //   sendEmail("RegistrationEmail", email, name, maildata);
            return res.json({
              status: true,
              data: {
                token: accessToken,
                email: data.email,
                mobileNumberVerificationOTP: "",
                username: username,
                userId: userID,
                myReferralCode: data.myReferralCode ?? "",
                _id: user._id,
              },
              msg: "",
            });
          }
        );
      } else {
        jwt.sign(
          //signing the jwt token with the username
          { user: data._id, studentId: data.userId },
          process.env.SECRET_KEY,
          { expiresIn: "30d" },
          (err, accessToken) => {
            if (err) {
              console.log(err);
            }
            // sendEmail("RegistrationEmail", email, name, {});
            return res.json({
              status: true,
              mobileotp: mobileOTP,
              data: {
                token: accessToken,
                email: data.email,
                mobileNumberVerificationOTP: "",
                username: username,
                myReferralCode: data.myReferralCode ?? ""
              },
              msg: "",
            });
          }
        );
      }
    });
  } catch (err) {
    res.json({
      status: false,
      err: err,
      data: null,
      msg: "There is some issue, Please Try Again!",
    });
  }
})

WebContain.post("/login", async (req, res) => {
  const { email_phoneNumber, password, fcmToken } = req.body;
  if (!email_phoneNumber || !password) {
    return res.json({
      status: false,
      data: null,
      msg: "Required email or Phone and password"
    })
  }
  try {
    let phonenumber = /^\d{10}$/; //check if user has given mobile number or email
    let userExists;
    if (email_phoneNumber.match(phonenumber)) {
      userExists = await findUserByMobileNumber(email_phoneNumber);
    } else {
      userExists = await findUserByEmail(email_phoneNumber);
    }


    if (userExists == null) {
      return res.status(401).json({
        status: false,
        msg: "You are not our user",
        data: null,
      });
    }
    if (!userExists.is_active) {
      return res.json({
        status: false,
        data: null,
        // msg: "Your Account is not Active, Please contact SD Campus Team",
        msg: "No User Found !",
      });
    }
    if (userExists.signinType == "google") {
      return res.json({
        status: false,
        data: null,
        msg: "google_signin",
      });
    }
    // if (userExists.mobileNumberVerified == true) {
    bcrypt.compare(password, userExists.password, async function (err, result) {
      if (err) {
        //check if the passwords match
        return res.send("err" + err);
      }
      if (result == true) {
        if (!userExists) {
          return res.json({ msg: "You are not our user" });
        }

        const RefreshTokenAuth = jwt.sign(
          { studentId: userExists.userId },
          process.env.SECRET_KEY,
          { expiresIn: "30d" }
        );
        await UserTable.updateOne(
          { _id: userExists._id },
          { RefreshToken: RefreshTokenAuth, fcmToken: fcmToken }
        );
        jwt.sign(
          //(new Date(moment().add(5, "hours").add(30, "minutes"))).getTime().toString(36)
          { studentId: userExists.userId }, //assigning accessToken to the user
          process.env.SECRET_KEY,
          { expiresIn: "30d" },
          (err, accessToken) => {
            if (err) {
              return res.json({
                status: false,
                data: null,
                msg: err,
              });
            }
            res.json({
              status: true,
              data: {
                accessToken: accessToken,
                username: userExists.username,
                email: userExists.email,
                phoneNumber: userExists.mobileNumber,
                FullName: userExists.FullName,
                profilePhoto: userExists.profilePhoto,
                mobileVerified: userExists.mobileNumberVerified,
                myReferralCode: userExists.myReferralCode ?? "",
              },
              msg: "Welcome Back !",
            });
          }
        );
      } else {
        return res.json({
          status: false,
          msg: "Invalid Password !",
          data: null,
        });
      }
    });

  } catch (err) {
    //catching the err in the login event
    res.json({
      status: false,
      data: null,
      error: err,
      msg: "Ooh! Please Try Again",
    });
  }
})

WebContain.post("/signup", async (req, res) => {
  try {
    const { user_phone, fcmToken, utm_campaign, utm_source, utm_medium, platform } = req.body;
    if (!user_phone) {
      return res.json({
        status: false,
        data: null,
        msg: "Mobile No Required"
      })
    }
    const phoneRegx = /^\d{10}$/;
    const isValidPhone = user_phone.match(phoneRegx) && user_phone.length === 10;

    if (!isValidPhone) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid Mobile No."
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
    const masterOtp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);

    const isUserRxist = await UserTable.findOne({ mobileNumber: user_phone })
    if (isUserRxist) {
      // send verification code
      // console.log(otp)
      if (await SendOtpSms(otp, user_phone)) {
        const refreshToken = jwt.sign(
          { studentId: isUserRxist.userId },
          process.env.SECRET_KEY,
          { expiresIn: "10m" }
        );
        await UserTable.updateOne({ _id: isUserRxist._id }, { fcmToken: fcmToken, mobileNumberVerificationOTP: otp })
        return res.json({
          status: true,
          data: refreshToken,
          msg: `OTP sent to ${user_phone}`
        })
      } else return res.json({
        status: false,
        data: null,
        msg: "You have reached max attempted, Please Try again after sometime"
      })
    } else {
      // create new user
      const date = new Date(moment().add(5, "hours").add(30, "minutes"));
      let formatedDate = formatDate(date);
      const time =
        date.getHours() * 60 + date.getMinutes() * 60 + date.getSeconds();
      let userID = uuidv1();
      const refreshToken = jwt.sign(
        { studentId: userID },
        process.env.SECRET_KEY,
        { expiresIn: "10m" }
      );
      const cursor = await categoryTable.aggregate([
        { $match: { is_active: true } },
        { $sample: { size: 1 } }
      ]);
      const user = new UserTable({
        FullName: "Name",
        username: "User",
        password: "",
        email: "user@gmail.com",
        created_at: formatedDate,
        deviceName: "",
        deviceConfig: "",
        fcmToken: fcmToken ?? "",
        mobileNumber: user_phone,
        Stream: [],
        mobileNumberVerified: false,
        userEmailVerified: false,
        RefreshToken: refreshToken,
        emailVerificationOTP: otp,
        mobileNumberVerificationOTP: otp,
        otpcreatedDate: time,
        userId: userID,
        utm_campaign: utm_campaign || "direct_search",
        utm_source: utm_source || "sdcampus_website",
        utm_medium: utm_medium || "sdcampus_website",
        myReferralCode: await generateReferralCode(),
        signinType: "WebSite",
        masterOtp: masterOtp,
        platform: platform ?? "",
      });
      const data = await user.save();
      if (data && await SendOtpSms(otp, user_phone)) {
        const txnData = {
          action: 'add',
          reason: 'signup',
          amount: '51',
          dateTime: formatedDate,
        }
        await saveRefAmount(data._id, txnData)
        if (platform == "website") {
          const wpData = { name: "Learner", phone: user_phone }
          await campusSignup(wpData)
        }

        if (['app', 'ios', 'website'].includes(platform)) {
          crmTracking({ FullName: data?.FullName, mobileNumber: data?.mobileNumber, email: data?.email, platform: platform, utm_source: data?.utm_source, utm_medium: data?.utm_medium, utm_campaign: data?.utm_campaign, category: "", subCategory: "" })
        }
        return res.json({
          status: true,
          data: refreshToken,
          msg: `OTP sent to ${user_phone}`
        })
      } else return res.json({
        status: false,
        data: null,
        msg: "Error while registration, Please Try Again !"
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

WebContain.post("/calender_signup", async (req, res) => {
  try {
    const { user_name, user_email, user_phone, utm_campaign, utm_source, utm_medium, category } = req.body;
    if (!user_name || !user_email || !user_phone || !utm_campaign || !utm_source || !utm_medium || !category) {
      return res.json({
        status: false,
        data: null,
        msg: "Required user details"
      })
    }
    const phoneRegx = /^\d{10}$/;
    const isValidPhone = user_phone.match(phoneRegx) && user_phone.length === 10;

    if (!isValidPhone) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid Mobile No."
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
    const masterOtp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);

    const isUserRxist = await UserTable.findOne({ mobileNumber: user_phone })
    if (isUserRxist) {
      // send verification code
      // console.log(otp)
      if (await SendOtpSms(otp, user_phone)) {
        const refreshToken = jwt.sign(
          { studentId: isUserRxist.userId },
          process.env.SECRET_KEY,
          { expiresIn: "10m" }
        );
        await UserTable.updateOne({ _id: isUserRxist._id }, { mobileNumberVerificationOTP: otp })
        return res.json({
          status: true,
          data: refreshToken,
          msg: `OTP sent to ${user_phone}`
        })
      } else return res.json({
        status: false,
        data: null,
        msg: "You have reached max attempted, Please Try again after sometime"
      })
    } else {
      // create new user
      const date = new Date(moment().add(5, "hours").add(30, "minutes"));
      let formatedDate = formatDate(date);
      const time =
        date.getHours() * 60 + date.getMinutes() * 60 + date.getSeconds();
      let userID = uuidv1();
      const refreshToken = jwt.sign(
        { studentId: userID },
        process.env.SECRET_KEY,
        { expiresIn: "10m" }
      );
      const isCategory = await categoryTable.findOne({ _id: category, is_active: true });
      if (!isCategory) {
        return res.json({
          status: false,
          data: null,
          msg: `Category not found`
        })
      }
      const user = new UserTable({
        FullName: user_name ?? "Name",
        username: "User",
        password: "",
        email: user_email ?? "user@gmail.com",
        created_at: formatedDate,
        deviceName: "",
        deviceConfig: "",
        fcmToken: "",
        mobileNumber: user_phone,
        Stream: [isCategory?.title],
        category: [isCategory?._id],
        mobileNumberVerified: false,
        userEmailVerified: false,
        RefreshToken: refreshToken,
        emailVerificationOTP: otp,
        mobileNumberVerificationOTP: otp,
        otpcreatedDate: time,
        userId: userID,
        utm_campaign: utm_campaign || "direct_search",
        utm_source: utm_source || "sdcampus_website",
        utm_medium: utm_medium || "sdcampus_website",
        myReferralCode: await generateReferralCode(),
        signinType: "WebSite",
        masterOtp: masterOtp,
        platform: "website",
      });
      const data = await user.save();
      if (data && await SendOtpSms(otp, user_phone)) {
        const txnData = {
          action: 'add',
          reason: 'signup',
          amount: '51',
          dateTime: formatedDate,
        }
        await saveRefAmount(data._id, txnData)
        return res.json({
          status: true,
          data: refreshToken,
          msg: `OTP sent to ${user_phone}`
        })
      } else return res.json({
        status: false,
        data: null,
        msg: "Error while registration, Please Try Again !"
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


WebContain.post("/verifyOtp", ValidateTokenForWeb, async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.json({
      status: false,
      data: null,
      msg: "OTP Required"
    })
  }
  if (!(otp.length === 6)) {
    return res.json({
      status: false,
      data: null,
      msg: "Invalid OTP"
    });
  }
  const { userId } = req;
  const findUser = await UserTable.findOne({ userId })
  if (findUser) {
    if (findUser.mobileNumberVerificationOTP === otp || findUser?.masterOtp === parseInt(otp)) {
      const accessToken = jwt.sign(
        { studentId: findUser.userId },
        process.env.SECRET_KEY,
        { expiresIn: "365d" }
      );
      await UserTable.updateOne(
        { _id: findUser._id },
        { RefreshToken: accessToken, mobileNumberVerified: true, mobileNumberVerificationOTP: "" }
      );
      return res.json({
        status: true,
        data: {
          token: accessToken,
          id: findUser._id ?? "",
          enrollId: findUser.enrollId ?? "",
          name: findUser.FullName ?? "",
          email: findUser.email ?? "",
          mobileNumber: findUser.mobileNumber ?? "",
          profilePhoto: findUser.profilePhoto ?? "",
          stream: findUser.Stream ?? [],
          myReferralCode: findUser.myReferralCode ?? "",
          language: findUser.language ?? "",
          is_active: findUser.is_active ?? true,
          isNew: findUser?.Stream.length === 0 ? true : false,
          isCategory: findUser?.category.length == 0 ? false : true,
        },
        msg: "OTP Verified"
      })
    } else return res.json({
      status: false,
      data: null,
      msg: "Invalid OTP"
    })
  } else return res.json({
    status: false,
    data: null,
    msg: "Invalid Request"
  })

})

WebContain.post("/resendOtp", async (req, res) => {
  const { user_phone } = req.body;
  if (!user_phone) {
    return res.json({
      status: false,
      data: null,
      msg: "Mobile No Required"
    })
  }
  const phoneRegx = /^\d{10}$/;
  const isValidPhone = user_phone.match(phoneRegx) && user_phone.length === 10;

  if (!isValidPhone) {
    return res.json({
      status: false,
      data: null,
      msg: "Invalid Mobile No."
    });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
  const isUserRxist = await UserTable.findOne({ mobileNumber: user_phone })
  if (isUserRxist) {
    // send verification code
    if (await SendOtpSms(otp, user_phone)) {
      const refreshToken = jwt.sign(
        { studentId: isUserRxist.userId },
        process.env.SECRET_KEY,
        { expiresIn: "10m" }
      );
      await UserTable.updateOne({ _id: isUserRxist._id }, { mobileNumberVerificationOTP: otp })
      return res.json({
        status: true,
        data: refreshToken,
        msg: `OTP sent to ${user_phone}`
      })
    } else return res.json({
      status: false,
      data: null,
      msg: "You have reached max attempted, Please Try again after sometime"
    })
  } else return res.json({
    status: false,
    data: null,
    msg: "Invalid Request"
  })

})

WebContain.post("/googleSign", async (req, res) => {
  const { email, FullName, fcmToken, profile, utm_campaign, utm_source, utm_medium } = req.body;
  if (!email || !FullName) {
    return res.json({
      status: false,
      data: null,
      msg: "Required email and FullName"
    })
  }
  try {
    let userExists = await findUserByEmail(email);
    if (userExists) {
      if (userExists?.signinType == "google") {
        jwt.sign(
          //assigning a jwt token to the user , signing with email if email exists
          { studentId: userExists.userId },
          process.env.SECRET_KEY,
          { expiresIn: "30d" },
          async (err, accessToken) => {
            if (err) {
              console.log(err);
            }
            await UserTable.updateOne(
              { _id: userExists._id },
              {
                fcmToken: fcmToken,
              }
            );

            res.json({
              status: true,
              data: {
                accessToken: accessToken,
                id: userExists._id,
                FullName: userExists.FullName,
                email: userExists.email,
                profilePhoto: profile ?? userExists?.profilePhoto,
                userEmailVerified: userExists?.userEmailVerified ?? "",
                phoneNumber: userExists.mobileNumber
                  ? userExists.mobileNumber
                  : "",
                userMobileNumberVerified: userExists.mobileNumberVerified,
                myReferralCode: userExists.myReferralCode ?? "",
                verified: true,
              },
              msg: "Registered Successfully",
            });
          }
        );
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "google_signin",
        });
      }


    } else {
      let username = generateFromEmail(email, 6);
      const date = new Date(moment().add(5, "hours").add(30, "minutes"));
      let formatedDate = formatDate(date);
      const userID = uuidv1();
      const RefreshTokenAuth = jwt.sign(
        { studentId: userID },
        process.env.SECRET_KEY,
        { expiresIn: "24h" }
      );
      const password = email.split("@");
      let user;
      let pass = password[0];
      bcrypt.hash(pass, 8, async (err, hashedPassword) => {
        if (err) {
          return res.send(err);
        }
        user = await new UserTable({
          username: username,
          email: email,
          profilePhoto: profile ?? "",
          created_at: formatedDate,
          deviceName: "",
          deviceConfig: "",
          RefreshToken: RefreshTokenAuth,
          userEmailVerified: true,
          FullName,
          signinType: "google",
          Stream: [],
          utm_campaign,
          utm_source,
          utm_medium,
          fcmToken: fcmToken,
          myReferralCode: await generateReferralCode(),
          userId: userID,
          password: pass, //hashedPassword,
        });
        const saveGoogleSign = await user.save();
        let maildata = {
          FullName: FullName,
        };
        sendEmail("RegistrationEmail", email, FullName, maildata);
        const txnData = {
          action: 'add',
          reason: 'signup',
          amount: '51',
          dateTime: formatedDate,
        }
        await saveRefAmount(saveGoogleSign._id, txnData)
        const addedUser = await findUserByEmail(user.email);
        if (email.trim().length != 0) {
          jwt.sign(
            //assigning a jwt token to the user , signing with email if email exists
            { studentId: user.userId },
            process.env.SECRET_KEY,
            { expiresIn: "30d" },
            async (err, accessToken) => {
              if (err) {
                console.log(err);
              }
              await UserTable.updateOne(
                { _id: addedUser._id },
                {
                  fcmToken: fcmToken,
                }
              );
              return res.json({
                status: true,
                data: {
                  accessToken: accessToken,
                  FullName: addedUser.FullName,
                  email: addedUser.email,
                  profilePhoto: addedUser.profilePhoto,
                  userMobileNumberVerified: addedUser.mobileNumberVerified,
                  myReferralCode: addedUser.myReferralCode ?? "",
                },
                msg: "Successfully reggisterd",
              });
            }
          );
        } else {
          res.json({
            status: false,
            data: null,
            msg: "Failed to register",
          });
        }
      });

    }

  } catch (err) {
    //catching the err in the login event
    res.json({
      status: false,
      data: null,
      error: err,
      msg: "Ooh! Please Try Again",
    });
  }

})

WebContain.put("/updateUserStream", ValidateTokenForWeb, async (req, res) => {
  const { Stream } = req.body;
  try {
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const newUser = await UserTable.findByIdAndUpdate(
        user._id,
        {
          Stream: Stream,
        },
        {
          runValidators: true,
          new: true,
        }
      );

      res.json({
        status: true,
        // data: null,
        // before: user,
        // later: newUser,
        data: {
          id: newUser._id ?? "",
          enrollId: newUser.enrollId ?? "",
          name: newUser.FullName ?? "",
          email: newUser.email ?? "",
          mobileNumber: newUser.mobileNumber ?? "",
          profilePhoto: newUser.profilePhoto ?? "",
          stream: newUser.Stream ?? [],
          myReferralCode: newUser.myReferralCode ?? "",
          language: newUser.language ?? "",
          is_active: newUser.is_active ?? true,
          isNew: false
        },
        msg: `Updated the Stream to ${Stream} `,
      });
    } else {
      res.json({
        status: false,
        data: null,
        msg: "User Not Found",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

WebContain.put("/updateUserLanguage", ValidateTokenForWeb, async (req, res) => {
  const { language } = req.body;
  try {
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const newUser = await UserTable.findByIdAndUpdate(
        user._id,
        {
          language: language,
        },
        {
          runValidators: true,
          new: true,
        }
      );

      res.json({
        status: true,
        data: {
          id: newUser._id ?? "",
          enrollId: newUser.enrollId ?? "",
          name: newUser.FullName ?? "",
          email: newUser.email ?? "",
          mobileNumber: newUser.mobileNumber ?? "",
          profilePhoto: newUser.profilePhoto ?? "",
          stream: newUser.Stream ?? [],
          myReferralCode: newUser.myReferralCode ?? "",
          language: newUser.language ?? "",
          is_active: newUser.is_active ?? true,
          isNew: false
        },
        msg: `Updated the language to ${language} `,
      });
    } else {
      res.json({
        status: false,
        data: null,
        msg: "User Not Found",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

WebContain.put("/updateUserName", ValidateTokenForWeb, async (req, res) => {
  const { name } = req.body;
  try {
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const newUser = await UserTable.findByIdAndUpdate(
        user._id,
        {
          FullName: name?.trim(),
        },
        {
          runValidators: true,
          new: true,
        }
      );

      res.json({
        status: true,
        data: {
          // token: accessToken,
          id: newUser._id ?? "",
          enrollId: newUser.enrollId ?? "",
          name: newUser.FullName ?? "",
          email: newUser.email ?? "",
          mobileNumber: newUser.mobileNumber ?? "",
          profilePhoto: newUser.profilePhoto ?? "",
          stream: newUser.Stream ?? [],
          myReferralCode: newUser.myReferralCode ?? "",
          language: newUser.language ?? "",
          is_active: newUser.is_active ?? true,
          isNew: false
        },
        msg: `Updated the FullName to ${name} `,
      });
    } else {
      res.json({
        status: false,
        data: null,
        msg: "User Not Found",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

WebContain.get("/getMyCourses", ValidateTokenForWeb, async (req, res) => {
  try {
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const courses = await MybatchTable.find({ user: user?._id, is_active: true, assignedDate: { $exists: true, $lte: new Date() } }).populate("batch_id", "_id batch_name banner starting_date ending_date slug stream isPaid").populate('validity', 'month').sort({ createdAt: -1 });
      let responseData = await Promise.all(courses.map(async (item) => {
        // console.log(item);
        let category = await categoryTable.findOne({ title: item?.batch_id?.stream }).select("_id title slug tags");
        const assignDate = new Date(item?.assignedDate);
        let expireDate = new Date(assignDate.setMonth(assignDate.getMonth() + parseInt(item?.validity?.month)));
        // console.log(expireDate.getDate())

        return {
          // id : item._id ?? "",
          batchId: item?.batch_id?._id ?? "",
          batchName: item?.batch_id?.batch_name ?? "",
          slug: item?.batch_id?.slug ?? "",
          categoryDetails: { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "", tags: category?.tags ?? [] },
          banner: item?.batch_id?.banner[0]?.fileLoc ?? "",
          startingDate: moment(item?.batch_id?.starting_date, 'YYYY-MM-DD').format('DD MMM YYYY') ?? "",
          endingDate: moment(item?.batch_id?.ending_date, 'YYYY-MM-DD').format('DD MMM YYYY') ?? "",
          isPaid: item?.batch_id?.isPaid,
          daysLeft: moment(item?.expireDate).startOf('day').diff(moment().startOf('day'), 'days'),
          assignDate: moment(assignDate).format('DD-MM-YYYY'),
          expireDate: moment(item?.expireDate).format('DD-MM-YYYY'),
        }
      }))
      return res.json({
        status: true,
        data: responseData,
        msg: `My courses fetched successfully`
      })
    } else {
      res.json({
        status: false,
        data: null,
        msg: "Not an user",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

WebContain.get("/getMyCoursesByBatch/:batchSlug", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug } = req.params;
  if (!batchSlug) {
    return res.json({
      status: false,
      data: null,
      msg: `Required batchId`
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const isBatch = await BatchesTable.findOne({ slug: batchSlug }).populate('features', '_id feature icon isActive order').populate("subject", "_id title");
      if (!isBatch) {
        return res.json({
          status: false,
          data: null,
          msg: 'Batch not found'
        })
      }
      const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id });
      if (!isMyBatch) {
        return res.json({
          status: false,
          data: null,
          msg: "not authorized to access"
        })
      }
      let today = moment().startOf('day');
      let expireDate = moment(isMyBatch?.expireDate).startOf('day');
      if (expireDate.isBefore(today)) {
        return res.json({
          status: false,
          data: null,
          msg: 'Batch expired.'
        })
      }
      const courses = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id }).populate({ path: 'batch_id', populate: { path: 'teacher', model: "adminTeacherTable", select: "FullName profilePhoto qualification categories", populate: { path: 'subject', model: "SubjectTable", select: "title" } } });

      let category = await categoryTable.findOne({ title: courses?.batch_id?.stream }).select("_id title slug tags");

      let currentDate = moment(new Date()).format('DD-MM-YYYY');
      let date = new Date();
      let end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 28, 89, 59, 59)
      let end1 = new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 28, 89, 59, 59)
      let start = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 5, 30, 0, 0)

      // let todayLecture = lectures.filter((item) => {
      //   let startDate = moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY');
      //   return moment(startDate, 'DD-MM-YYYY').isSame(moment(currentDate, 'DD-MM-YYYY'));
      // });
      let todayLecture = await LectureTable.find({ batch: isBatch?._id, startingDate: { $gte: start, $lte: end }, isActive: true }).populate({
        path: 'teacher',
        select: "FullName profilePhoto demoVideo categories qualification",
        populate: {
          path: 'subject',
          select: 'title'
        }
      }).sort({ startingDate: -1 })
      // let upcomingLecture = lectures.filter((item) => {
      //   let startDate = moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY');
      //   return moment(startDate, 'DD-MM-YYYY').isAfter(moment(currentDate, 'DD-MM-YYYY'));
      // });
      let upcomingLecture = await LectureTable.find({ batch: isBatch?._id, startingDate: { $gte: end, $lte: end1 }, isActive: true }).populate({
        path: 'teacher',
        select: "FullName profilePhoto demoVideo categories qualification",
        populate: {
          path: 'subject',
          select: 'title'
        }
      }).sort({ startingDate: -1 })
      let responseData = {
        // id : item._id ?? "",
        batchId: courses?.batch_id?._id ?? "",
        batchName: courses?.batch_id?.batch_name ?? "",
        banner: courses?.batch_id?.banner[0]?.fileLoc ?? "",
        slug: courses?.batch_id?.slug ?? "",
        planner: courses?.batch_id?.planner ?? "",
        daysLeft: moment(courses?.expireDate).diff(moment(), 'days'),
        expireDate: moment(courses?.expireDate).format('DD-MM-YYYY'),
        // teacher: courses?.batch_id?.teacher ?? "",
        teacher: await Promise.all(courses?.batch_id?.teacher?.map(async (item) => {
          // let category = await categoryTable.findOne({ _id: item?.category }).select("_id title slug");
          let categories = await categoryTable.find({ _id: item?.categories }).select("_id title slug");
          return {
            FullName: item?.FullName ?? "",
            profilePhoto: item?.profilePhoto ?? "",
            demoVideo: item?.demoVideo ?? "",
            category: { title: categories[0]?.title ?? "", slug: categories[0]?.slug ?? "" },
            categories: categories?.map((item2) => { return { title: item2?.title ?? "", slug: item2?.slug ?? "" } }),
            subject: item?.subject.map((subject) => { return subject?.title }) ?? [],
            qualification: item?.qualification ?? "",
          }
        })),
        // teacher : staffs.map((item) => {

        // })
        // teacher : staffs ?? [],
        categoryDetails: { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "", tags: category?.tags ?? [] },
        description: courses?.batch_id?.description ?? "",
        duration: moment(courses?.batch_id?.ending_date, 'YYYY-MM-DD').diff(moment(courses?.batch_id?.starting_date, 'YYYY-MM-DD'), 'days'),
        startingDate: moment(courses?.batch_id?.starting_date, 'YYYY-MM-DD').format('DD MMM YYYY') ?? "",
        endingDate: moment(courses?.batch_id?.ending_date, 'YYYY-MM-DD').format('DD MMM YYYY') ?? "",
        todayLectures: todayLecture.map((item) => {
          return {
            _id: item?._id ?? "",
            lecture_type: item?.lecture_type ?? "",
            batchDetails: { batchSlug },
            lectureTitle: item?.lecture_title ?? "",
            teacher: { name: item?.teacher[0]?.FullName ?? "", profilePhoto: item?.teacher[0]?.profilePhoto ?? "", qualification: item?.teacher[0]?.qualification ?? "" } ?? { name: "", profilePhoto: "", qualification: "" },
            starting_date: item?.starting_date ?? "",

            duration: moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
            language: item?.language ?? "",
            ending_date: item?.ending_date ?? "",
            banner: item?.banner ?? 'https://d1mbj426mo5twu.cloudfront.net/Banner/Lecture%20Banner%20/sd-banner_1711950515.png',
            ending_time: moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
            starting_time: moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
          }
        }) ?? [],
        upcomingLectures: upcomingLecture.map((item) => {
          return {
            _id: item?._id ?? "",
            lecture_type: item?.lecture_type ?? "",
            batchDetails: { batchSlug },
            lectureTitle: item?.lecture_title ?? "",
            teacher: { name: item?.teacher[0]?.FullName ?? "", profilePhoto: item?.teacher[0]?.profilePhoto ?? "", qualification: item?.teacher[0]?.qualification ?? "" } ?? { name: "", profilePhoto: "", qualification: "" },
            starting_date: item?.starting_date ?? "",
            duration: moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
            language: item?.language ?? "",
            ending_date: item?.ending_date ?? "",
            // banner: item?.banner ?? "",
            banner: item?.banner ?? 'https://d1mbj426mo5twu.cloudfront.net/Banner/Lecture%20Banner%20/sd-banner_1711950515.png',
            ending_time: moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
            starting_time: moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('HH:mm A'),
          }
        }) ?? [],
        batchFeatures: isBatch?.features?.filter((item) => item.isActive != false).sort((a, b) => a.order - b.order).map((item) => {
          return {
            featureId: item?._id ?? "",
            icon: item?.icon ?? "",
            feature: item?.feature ?? "",
          }
        })

      }

      return res.json({
        status: true,
        data: responseData,
        msg: `My course deatails fetched successfully`
      })
    } else {
      res.json({
        status: false,
        data: null,
        msg: "Not an user",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

WebContain.get("/getRecommendedCourses", ValidateTokenForWeb, async (req, res) => {
  try {
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const myCourses = await MybatchTable.find({ user: user._id });
      let myCoursesId = myCourses.map((item) => {
        return item.batch_id;
      });

      const category = await categoryTable.findOne({ title: user.Stream[0] }).select('_id title slug');
      const courses = await BatchesTable.find({ _id: { $nin: myCoursesId }, Stream: user.Stream[0], isActive: true })
        .sort({ createdAt: -1 })
        .limit(10);
      let responseData = courses.map((item) => {
        return {
          // id : item._id ?? "",
          batchId: item?._id ?? "",
          batchName: item.batch_name ?? "",
          banner: item?.banner[0]?.fileLoc ?? "",
          categoryDetails: { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "" },
          startingDate: moment(item?.starting_date, 'YYYY-MM-DD').format('DD MMM YYYY') ?? "",
          endingDate: moment(item?.ending_date, 'YYYY-MM-DD').format('DD MMM YYYY') ?? "",
          salePrice: item?.discount ?? "",
          realPrice: item?.charges ?? "",
          duration: moment(item.ending_date).diff(moment(item.starting_date), 'days'),
          batchSlug: item?.slug ?? ""

        }
      })
      return res.json({
        status: true,
        data: responseData,
        msg: `Recommended courses fetched successfully`
      })
    } else {
      res.json({
        status: false,
        data: null,
        msg: "Not an user",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

WebContain.get("/getSubjectOfBatch", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug } = req.query;
  if (!batchSlug) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required batchSlug'
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ slug: batchSlug }).populate('features', '_id feature icon  isActive order').populate("subject", "_id title icon");
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Batch not found'
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "not authorized to access"
      })
    }

    // let today = moment().startOf('day'); 
    //   let expireDate = moment(isMyBatch?.expireDate).startOf('day');
    //   // console.log(today , expireDate);
    //   if (expireDate.isBefore(today)) {

    //       return res.json({
    //                 status: false,
    //                 data: null,
    //                 msg: 'Batch expired.'
    //               })
    //   }

    return res.json({
      status: true,
      data: await Promise.all(isBatch?.subject?.map(async (item) => {
        let lecturesCount = 0;
        if(isBatch?.materials == "recorded") {
           lecturesCount = await LectureTable.countDocuments({ batch: isBatch._id, subject: item._id, isActive: true });
        }else{
           lecturesCount = await LectureTable.countDocuments({ batch: isBatch._id, subject: item._id, startingDate: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true });
        }
        return {
          id: item?._id ?? "",
          title: item?.title ?? "",
          chapter: lecturesCount ?? 0,
          icon: item?.icon ?? ""
        }
      })),
      details: {
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

WebContain.get("/getLecturesOfSubject", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug, subjectId } = req.query;
  if (!batchSlug && !subjectId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required batchSlug or subjectId'
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }

    const isBatch = await BatchesTable.findOne({ slug: batchSlug });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Batch not found'
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'No Access for this course'
      })
    }
    // let today = moment().startOf('day'); 
    // let expireDate = moment(isMyBatch?.expireDate).startOf('day');
    // if (expireDate.isBefore(today)) {
    //       return res.json({
    //                 status: false,
    //                 data: null,
    //                 msg: 'Batch expired.'
    //               })
    // }
    const isSubject = await SubjectTable.findOne({ _id: subjectId });
    if (!isSubject) {
      return res.json({
        status: false,
        data: null,
        msg: 'Subject not found'
      })
    }
    let lectures = [];
    if(isBatch?.materials == "recorded") {
      lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId, isActive: true }).populate("subject", 'title')
        .populate({
          path: 'teacher',
          select: "FullName profilePhoto demoVideo category",

        }).sort({ startingDate: -1 });
    } else {
      lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId, startingDate: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true }).populate("subject", 'title')
        .populate({
          path: 'teacher',
          select: "FullName profilePhoto demoVideo category",

        }).sort({ startingDate: -1 });
    }
    let currentDate = moment(new Date()).format("DD-MM-YYYY");
    // console.log(current Date);

    // lectures = lectures.filter((item) => {
    //   const documentDate = moment(item.starting_date, 'DD-MM-YYYY HH:mm:ss').format("DD-MM-YYYY");
    //   return moment(documentDate, "DD-MM-YYYY").isSameOrBefore(moment(currentDate, "DD-MM-YYYY"));

    // }).sort((a, b) => {
    //   let dateA = moment(a.starting_date, "DD-MM-YYYY HH:mm:ss");
    //   let dateB = moment(b.starting_date, "DD-MM-YYYY HH:mm:ss");
    //   return dateB - dateA;
    // })
    // console.log(lectures)
    return res.json({
      status: true,
      data: lectures?.map((item) => {
        return {
          _id: item?._id ?? "",
          lecture_type: item?.lecture_type ?? "",
          lectureTitle: item?.lecture_title ?? "",
          teacher: { name: item?.teacher[0]?.FullName ?? "", profilePhoto: item?.teacher[0]?.profilePhoto ?? "", demoVideo: item?.teacher[0]?.demoVideo ?? "" } ?? { name: "", profilePhoto: "", demoVideo: "" },
          starting_date: item?.starting_date ?? "",
          duration: moment(item?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
          language: item?.language ?? "",
          banner: item?.banner != "" ? item?.banner : "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg",
        }
      }),
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

WebContain.get("/getLecture", ValidateTokenForWeb, async (req, res) => {
  //for whatsapp test 
  // sendWhatsAppMessage("8787246913", "Hello from SD Campus");
  // const dataObj = {
  //       name: "Learner",
  //       phone: "8787246913",
  //       batchName: "Batch",
  //       invoiceUrl:  "https://static.sdcampus.com/invoice/invoice/SDC_Online_23_24_0.8308496754038561_1746794699.pdf"
  //     };
  //   await batchPurchaseSuccess(dataObj);
  const { id, batchSlug } = req.query;
  if (!id && !batchSlug) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required id & batchSlug'
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }

    const isBatch = await BatchesTable.findOne({ slug: batchSlug });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Batch not found'
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'No Access for this course'
      })
    }

    let isLecture = await LectureTable.findOne({ _id: id, batch: isBatch?._id, isActive: true }).populate("subject", 'title')
      .populate({
        path: 'teacher',
        select: "FullName profilePhoto demoVideo category",

      }).populate('batch', '_id batch_name slug');
    let userRoom = await lectureRoomTable.findOne({ lecture: isLecture?._id, students: { $in: user?._id } }).populate("mentor", "_id FullName Role").select('_id title mentor');
    // console.log(isLecture);
    let lectureDate = moment(isLecture?.starting_date, "DD-MM-YYYY HH:mm:ss");
    let next24Hours = lectureDate.clone(lectureDate).add(1, 'days').set("hour", 23).set("minute", 59);
    let past24Hours = lectureDate.clone(lectureDate).subtract(1, 'days').set("hour", 0).set("minute", 0);
    const lectures = await LectureTable.find({ batch: isLecture?.batch, subject: isLecture?.subject }).populate("subject")
      .populate({
        path: 'teacher',
        select: "FullName profilePhoto demoVideo",
      }).sort({ createdAt: -1 });
    let upcomingLectures = [];
    let previousLectures = [];

    for (let lecture of lectures) {
      let lectDate = moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss')
      if (lecture?._id != isLecture?._id && moment(lectDate, 'DD-MM-YYYY HH:mm:ss').isBetween(moment(lectureDate, 'DD-MM-YYYY HH:mm:ss'), moment(next24Hours, 'DD-MM-YYYY HH:mm:ss'))) {
        // console.log("upCOming");
        let obj = {
          _id: lecture?._id ?? "",
          lecture_type: lecture?.lecture_type,
          lecture_title: lecture?.lecture_title ?? "",
          teacher: lecture?.teacher ?? [],
          banner: lecture?.banner ?? "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg",
          starting_date: lecture?.starting_date ?? "",
          duration: moment(lecture?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
          language: lecture?.language ?? "",
        }
        upcomingLectures.push(obj);
      }
      else if (lecture._id != isLecture?._id && moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss').isBetween(moment(past24Hours, 'DD-MM-YYYY HH:mm:ss'), moment(lectureDate, 'DD-MM-YYYY HH:mm:ss'))) {
        // console.log("previous")
        let obj = {
          _id: lecture?._id ?? "",
          lecture_type: lecture?.lecture_type,
          lecture_title: lecture?.lecture_title ?? "",
          teacher: lecture?.teacher ?? [],
          starting_date: lecture?.starting_date ?? "",
          duration: moment(lecture?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(lecture?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
          banner: lecture?.banner ?? "",
          language: lecture?.language ?? "",
        }
        previousLectures.push(obj);
      }
    }
    upcomingLectures = upcomingLectures.sort((a, b) => {
      let dateA = moment(a.starting_date, "DD-MM-YYYY HH:mm:ss");
      let dateB = moment(b.starting_date, "DD-MM-YYYY HH:mm:ss");
      return dateA - dateB;
    })
    previousLectures = previousLectures.sort((a, b) => {
      let dateA = moment(a.starting_date, "DD-MM-YYYY HH:mm:ss");
      let dateB = moment(b.starting_date, "DD-MM-YYYY HH:mm:ss");
      return dateB - dateA;
    })
    await UserTable.updateOne({ _id: user?._id }, { $addToSet: { viewedLectures: isLecture?._id } });
    await UserTable.updateOne({ _id: user?._id }, { $set: { lastActive: new Date() } });

    return res.json({
      status: true,
      data: {

        _id: isLecture?._id ?? "",
        lectureType: isLecture?.lecture_type ?? "",
        lectureTitle: isLecture?.lecture_title ?? "",
        description: isLecture?.description ?? "",
        teacher: { name: isLecture?.teacher[0]?.FullName ?? "", profilePhoto: isLecture?.teacher[0]?.profilePhoto ?? "", demoVideo: isLecture?.teacher[0]?.demoVideo ?? "" } ?? { name: "", profilePhoto: "", demoVideo: "" },
        subject: isLecture?.subject ?? {},
        link: isLecture?.link ?? "",
        roomDetails: { id: userRoom?._id ?? "", roomName: userRoom?.title ?? "", mentor: userRoom?.mentor?.map((item2) => { return { mentorId: item2?._id ?? "", mentorName: item2?.FullName ?? "" } }) ?? [] },
        // rooms: rooms.map((item) => { return { roomId: item?._id ?? "", students: item?.students ?? [], title: item?.title } }),
        LiveOrRecorded: isLecture?.LiveOrRecorded ?? "",
        commonName: isLecture?.commonName ?? "",
        starting_date: isLecture?.starting_date ?? "",
        ending_date: isLecture?.ending_date ?? "",
        duration: moment(isLecture?.ending_date, 'DD-MM-YYYY HH:mm:ss').diff(moment(isLecture?.starting_date, 'DD-MM-YYYY HH:mm:ss'), 'minutes'),
        material: isLecture?.material ?? "",
        dpp: isLecture?.dpp ?? "",
        ytLiveChatId: isLecture?.ytLiveChatId ?? "",
        createdAt: isLecture?.created_at ?? "",
        language: isLecture?.language ?? "",
        socketUrl: isLecture?.socketUrl ?? "",
        banner: isLecture?.banner ?? "",
        batchDetails: { id: isLecture?.batch?._id ?? "", batchName: isLecture?.batch?.batch_name ?? "", slug: isLecture?.batch?.slug ?? "" },
        upcomingLectures,
        previousLectures,
      }
      ,
      msg: 'Lecture Details fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getNotesByBatch/:batchId", ValidateTokenForWeb, async (req, res) => {
  const { batchId } = req.params;
  if (!batchId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchId"
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ _id: batchId });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'No Access for this course'
      })
    }
    // let today = moment().startOf('day'); 
    // let expireDate = moment(isMyBatch?.expireDate).startOf('day');
    // if (expireDate.isBefore(today)) {
    //       return res.json({
    //                 status: false,
    //                 data: null,
    //                 msg: 'Batch expired.'
    //               })
    // }
    let lectures = [];
    if (isBatch?.materials == "recorded") {
      lectures = await LectureTable.find({ batch: batchId, isActive: true });
    } else {
      lectures = await LectureTable.find({ batch: batchId, createdAt: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true });
    }
    let responseArr = [];
    for (let lec of lectures) {
      const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $ne: "DPP" }, is_active: true });
      let lectureMaterial = {
        resource_title: lec?.material?.fileName ?? "", resourceType: "pdf", file: lec?.material ?? {
          fileLoc: "",
          fileName: "",
          fileSize: "",
        }
      }
      let resArr = [];
      if (lectureMaterial.file.fileLoc != "") resArr.push(lectureMaterial);
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

WebContain.get("/getAnnouncementsByBatch/:batchSlug", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug } = req.params;
  if (!batchSlug) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchSlug"
    })
  }
  try {

    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ slug: batchSlug });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'No Access for this course'
      })
    }
    // let today = moment().startOf('day'); 
    //   let expireDate = moment(isMyBatch?.expireDate).startOf('day');
    //   if (expireDate.isBefore(today)) {
    //       return res.json({
    //                 status: false,
    //                 data: null,
    //                 msg: 'Batch expired.'
    //               })
    //   }
    const announcements = await announcementTable.find({ link: "batch", linkWith: isBatch._id, createdAt: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true }).sort({ createdAt: -1 }).select("_id title description createdAt");
    let responseArr = announcements.map((item) => {
      return {
        id: item._id ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        createdAt: moment(item.createdAt).format("DD MMM YYYY"),
      }
    });
    return res.json({
      status: true,
      data: responseArr,
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

WebContain.get("/getQuizDetailsByBatchId/:batchId", ValidateTokenForWeb, async (req, res) => {
  const { batchId } = req.params;
  if (!batchId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Batch Id'
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ _id: batchId });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'No Access for this course'
      })
    }
    // let today = moment().startOf('day'); 
    //   let expireDate = moment(isMyBatch?.expireDate).startOf('day');
    //   if (expireDate.isBefore(today)) {
    //       return res.json({
    //                 status: false,
    //                 data: null,
    //                 msg: 'Batch expired.'
    //               })
    //   }
    let QuizDetails;
    const studentDetails = await findUserByUserId(req.userId);
    if (studentDetails) {
      const attemptedQuizes = await QuizResponseTable.find({
        user_id: studentDetails._id,
      });
      let checkArray = [];
      for (let i = 0; i < attemptedQuizes.length; i++) {
        checkArray.push(attemptedQuizes[i].quiz_id);
      }
      QuizDetails = await QuizTable.find(
        {
          _id: { $nin: checkArray },
          link: 'batch',
          linkWith: isBatch?._id,
          is_active: true,
          no_ques: {
            $gt: "0",
          },
          createdAt: { $exists: true, $gte: isMyBatch?.assignedDate }
        },
        { user: 0, __v: 0 }
      ).sort({ createdAt: -1 });
      let resArr = [];
      for (let j = 0; j < QuizDetails.length; j++) {
        const questions = await QuizQuestionsTable.find({
          quiz_id: QuizDetails[j]._id,
        });
        let Res = {
          id: QuizDetails[j]._id,
          quiz_title: QuizDetails[j].quiz_title,
          quiz_desc: QuizDetails[j].quiz_desc,
          quiz_duration: QuizDetails[j].quiz_duration,
          no_ques: questions.length.toString(),
          quiz_banner: QuizDetails[j].quiz_banner[0],
          language: QuizDetails[j].language,
          is_negative: QuizDetails[j].is_negative,
          negativeMarks: QuizDetails[j].negativeMarks,
          eachQueMarks: QuizDetails[j].eachQueMarks,
          quiz_created_at: QuizDetails[j].created_at,
        };
        resArr.push(Res);
      }
      let atmptArr = [];
      QuizAteempted = await QuizTable.find(
        { _id: { $in: checkArray }, link: "batch", linkWith: isBatch?._id },
        { user: 0, __v: 0 }
      ).sort({ createdAt: -1 });
      for (let j = 0; j < QuizAteempted.length; j++) {
        let Res = {
          id: QuizAteempted[j]._id,
          quiz_title: QuizAteempted[j].quiz_title,
          quiz_desc: QuizAteempted[j].quiz_desc,
          quiz_duration: QuizAteempted[j].quiz_duration,
          no_ques: QuizAteempted[j].no_ques.toString(),
          quiz_banner: QuizAteempted[j].quiz_banner[0],
          language: QuizAteempted[j].language,
          is_negative: QuizAteempted[j].is_negative,
          negativeMarks: QuizAteempted[j].negativeMarks,
          eachQueMarks: QuizAteempted[j].eachQueMarks,
          quiz_created_at: QuizAteempted[j].created_at,
        };
        atmptArr.push(Res);
      }
      if (QuizDetails) {
        res.json({
          status: true,
          data: {
            is_attempted: atmptArr,
            not_attempted: resArr,
          },
          msg: "Quizes",
        });
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Quizes Not Found",
        });
      }

    }
  } catch (err) {
    res.json({
      status: false,
      data: null,
      msg: err.message,
    });
  }


});

WebContain.get("/getQuizById/:id", ValidateTokenForWeb, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id!'
    })
  }
  try {
    // const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
    const studentDetails = await findUserByUserId(req?.userId);

    if (studentDetails) {
      const quiz = await QuizTable.findOne({ _id: id, is_active: true });
      return res.json({
        status: true,
        data: {
          id: quiz._id,
          quiz_title: quiz.quiz_title,
          quiz_desc: quiz.quiz_desc,
          quiz_duration: quiz.quiz_duration,
          no_ques: quiz.no_ques.toString(),
          quiz_banner: quiz.quiz_banner[0],
          language: quiz.language,
          is_negative: quiz.is_negative,
          negativeMarks: quiz.negativeMarks,
          eachQueMarks: quiz.eachQueMarks,
          quiz_created_at: quiz.created_at,
        },
        msg: "Quiz details found"
      })
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "User not found",
      });
    }
  } catch (err) {
    res.status(401).json({
      status: false,
      data: null,
      msg: err.message,
    });
  }
})

WebContain.get("/getLectureById/:id", ValidateTokenForWeb, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Lecture Id!'
    })
  }
  try {

    const studentDetails = await findUserByUserId(req?.userId);

    if (studentDetails) {
      const lecture = await LectureTable.findOne({ _id: id, isActive: true }).populate("subject").populate("teacher", {
        FullName: 1,
        profilePhoto: 1,
        _id: 1,
        demoVideo: 1,
      });
      if (!lecture) {
        return res.json({
          status: false,
          data: null,
          msg: "Lecture Not Found"
        })
      }
      return res.json({
        status: true,
        data: lecture,
        msg: "Lecture details"
      })

    } else {
      return res.json({
        status: false,
        data: null,
        msg: "User not found",
      });
    }
  } catch (err) {
    res.status(401).json({
      status: false,
      data: null,
      msg: err.message,
    });
  }
})

// get quiz question 
WebContain.get("/getQuizQuestions/:quizId", ValidateTokenForWeb, async (req, res) => {
  const { quizId } = req.params;
  try {
    const studentDetails = await findUserByUserId(req?.userId);

    if (studentDetails) {
      const questions = await QuizQuestionsTable.find({
        quiz_id: quizId,

      });
      if (questions) {
        res.json({
          status: true,
          data: questions,
          msg: "Quiz Question",
        });
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Quiz Question Not Found",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
});

// get quiz response
async function getTopperScore(quizId) {
  const score = await leaderBoardTable.findOne({
    quizId,
  });
  if (score !== null) return score.leaderBoard[0].myScore;
  else return "0.00";
}

WebContain.get(
  "/getQuizResultByQuizIdAndStudentId/:quizId",
  ValidateTokenForWeb,
  async (req, res) => {
    const { quizId } = req.params;
    try {
      const studentDetails = await findUserByUserId(req?.userId);
      if (studentDetails) {
        const quiz = await QuizTable.findById(quizId);
        const GetTest = await TestSeriesTestTable.findById(quizId);
        if (!quiz && !GetTest) {
          return res.json({
            status: false,
            data: null,
            msg: "Test Or Quiz Not Found",
          });
        }

        if (quiz) {
          let studentRes = [];
          let currectRes = [];
          const quizResponse = await QuizResponseTable.find({
            quiz_id: quizId,
            user_id: studentDetails?._id,
          });
          if (quizResponse) {
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
              currectRes[i]["myAnswer"] = Object.values(
                quizResponse[0].ans_res[0]
              )[i];
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
            const topperScore = await getTopperScore(quizId);
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
                  percentage: topperPer
                    ? (topperPer / 100).toFixed(2)
                    : "0.00",
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
                    percentage: (easy / 100).toFixed(2),
                    number: easy.toFixed(2),
                  },
                  medium: {
                    percentage: (medium / 100).toFixed(2),
                    number: medium.toFixed(2),
                  },
                  hard: {
                    percentage: (
                      (currectRes.length - (easy + medium)) /
                      100
                    ).toFixed(2),
                    number: (currectRes.length - (easy + medium)).toFixed(2),
                  },
                },
                response: currectRes,
              },
              msg: "Quiz Result !",
            });
          } else {
            res.json({
              status: false,
              data: null,
              msg: "Quiz Result Not Published !",
            });
          }
        }
        if (GetTest) {
          let studentRes = [];
          let currectRes = [];
          const quizResponse = await QuizResponseTable.find({
            quiz_id: quizId,
            user_id: studentDetails?._id,
          });
          if (quizResponse) {
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
              currectRes[i]["myAnswer"] = Object.values(
                quizResponse[0].ans_res[0]
              )[i];
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
            if (GetTest.negativemarking) {
              myScore =
                correctAns * parseFloat(GetTest.eachQueMarks) -
                wrongAnswers * parseFloat(GetTest.negativeMarks);
            } else {
              myScore = correctAns * parseFloat(GetTest.eachQueMarks);
            }
            const topperScore = await getTopperScore(quizId);
            const topperSc =
              typeof topperScore === "number" ? topperScore : 0.0;
            const topperPer =
              (topperSc / (GetTest.eachQueMarks * currectRes.length)) * 100;
            const myScorePer =
              (myScore / (GetTest.eachQueMarks * currectRes.length)) * 100;
            res.json({
              status: true,
              data: {
                is_published: false,
                quizId: quizId,
                totalMarks: (
                  parseFloat(GetTest.eachQueMarks) * currectRes.length
                ).toFixed(2),
                is_negative: GetTest.negativemarking,
                negativeMarks:
                  GetTest.negativeMarks !== ""
                    ? parseFloat(GetTest.negativeMarks).toFixed(2)
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
                  percentage: topperPer
                    ? (topperPer / 100).toFixed(2)
                    : "0.00",
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
                    percentage: (easy / 100).toFixed(2),
                    number: easy.toFixed(2),
                  },
                  medium: {
                    percentage: (medium / 100).toFixed(2),
                    number: medium.toFixed(2),
                  },
                  hard: {
                    percentage: (
                      (currectRes.length - (easy + medium)) /
                      100
                    ).toFixed(2),
                    number: (currectRes.length - (easy + medium)).toFixed(2),
                  },
                },
                response: currectRes,
              },
              msg: "Quiz Result !",
            });
          } else {
            res.json({
              status: false,
              data: null,
              msg: "Quiz Result Not Published !",
            });
          }
        }
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Not an User",
        });
      }
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message
      })
    }

  }
);
// getQuestion Wise result
//attempt quiz
WebContain.post("/attemptQuiz/:quizId", ValidateTokenForWeb, async (req, res) => {
  const { ans_res, timeSpent } = req.body;
  const { quizId } = req.params;
  try {
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const studentDetails = await findUserByUserId(req?.userId);
    if (studentDetails) {
      const quiz = await QuizTable.findById(quizId);
      const testTesseris = await TestSeriesTestTable.findById(quizId);
      if (quiz) {
        const AttemtedQuizes = await QuizResponseTable.find({
          quiz_id: quizId,
          user_id: studentDetails._id,
        });
        if (AttemtedQuizes.length > 0) {
          return res.json({
            status: false,
            data: null,
            msg: `Already Submitted.`
          })
        }
        // if (AttemtedQuizes.length == 0) {
        const ansRes = new QuizResponseTable({
          user_id: studentDetails._id,
          quiz_id: quizId,
          ans_res: ans_res,
          timeSpent: timeSpent,
          created_at: formatedDate,
          is_active: quiz.is_manual ? false : true,
        });
        const attmtQuiz = await ansRes.save();
        await QuizResumeTable.findOneAndDelete({ quizId: quiz._id });
        let data;
        if (studentDetails.language === "hi") {
          data = {
            title: quiz.quiz_title,
            message: `आपने ${quiz.quiz_title} सफलतापूर्वक सबमिट कर दिया है। `,
            route: "attemptquiz",
          };
        } else {
          data = {
            title: quiz.quiz_title,
            message: `You attempted ${quiz.quiz_title}  successfully`,
            route: "attemptquiz",
          };
        }
        const myNotifi = new myNotificationModel({
          user: studentDetails._id,
          title: data.title,
          message: data.message,
          route: data.route,
        });
        await myNotifi.save();
        await sendPushNotification(studentDetails.fcmToken, data);
        res.json({
          status: true,
          data: {
            id: attmtQuiz._id,
            quizId: attmtQuiz.quiz_id,
            attemptedAt: attmtQuiz.created_at,
            attemptedtype: attmtQuiz.attemptedtype,
            timeSpent: attmtQuiz.timeSpent,
            isResultPublished: attmtQuiz.is_active,
          },
          msg: "Quiz Attempted",
        });
        // } else {
        //   res.json({
        //     status: false,
        //     data: null,
        //     msg: "Quiz already Attempted",
        //   });
        // }
      } else if (testTesseris) {
        const AttemtedQuizes = await QuizResponseTable.find({
          quiz_id: quizId,
          user_id: studentDetails._id,
        });
        // if (AttemtedQuizes.length == 0) {

        const ansRes = new QuizResponseTable({
          user_id: studentDetails._id,
          quiz_id: quizId,
          ans_res: ans_res,
          timeSpent: timeSpent,
          created_at: formatedDate,
          is_active: testTesseris.is_manual ? false : true,
        });
        const RespionseSaved = await ansRes.save();
        await QuizResumeTable.findOneAndDelete({ quizId: testTesseris._id });
        let data;
        if (studentDetails.language === "hi") {
          data = {
            title: testTesseris.Test_title,
            message: `आपने ${testTesseris.Test_title} सफलतापूर्वक सबमिट कर दिया है। `,
            route: "attemptquiz",
          };
        } else {
          data = {
            title: testTesseris.Test_title,
            message: `You attempted ${testTesseris.Test_title}  successfully`,
            route: "attemptquiz",
          };
        }
        const myNotifi = new myNotificationModel({
          user: studentDetails._id,
          title: data.title,
          message: data.message,
          route: data.route,
        });
        await myNotifi.save();
        await sendPushNotification(studentDetails.fcmToken, data);
        res.json({
          status: true,
          data: {
            id: RespionseSaved._id,
            quizId: RespionseSaved.quiz_id,
            attemptedAt: RespionseSaved.created_at,
            attemptedtype: RespionseSaved.attemptedtype,
            timeSpent: RespionseSaved.timeSpent,
            isResultPublished: RespionseSaved.is_active,
          },
          msg: `${testTesseris.Test_title} Attempted `,
        });
        // } else {
        //   res.json({
        //     status: true,
        //     data: null,
        //     msg: `${testTesseris.Test_title} already Attempted`,
        //   });
        // }
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Invalid Request",
        });
      }
    } else {
      res.json({
        status: false,
        data: null,
        msg: "User not found",
      });
    }

  }
  catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

WebContain.post("/resumeQuiz", ValidateTokenForWeb, async (req, res) => {
  const { ans_res, quizId, timeSpent } = req.body;
  try {
    // console.log(ans_res, quizId, timeSpent);

    if (!ans_res && !quizId && !timeSpent) {
      return res.json({
        status: false,
        data: null,
        msg: "All fields are required",
      });
    }
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const user = await findUserByUserId(req?.userId);
    if (user) {
      const isResumed = await QuizResumeTable.findOne({ quizId: quizId });

      if (isResumed) {
        await QuizResumeTable.findByIdAndUpdate(isResumed._id, {
          userId: user._id,
          quizId,
          ans_res,
          timeSpent,
          createdAt: formatedDate,
        });
        return res.json({
          status: true,
          data: null,
          msg: "Resumed Updated",
        });
      }
      const savedRes = new QuizResumeTable({
        userId: user._id,
        quizId,
        ans_res,
        timeSpent,
        createdAt: formatedDate,
      });
      await savedRes.save();
      return res.json({
        status: true,
        data: null,
        msg: "Resumed",
      });
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "not an user"
      })
    }
  }

  catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

WebContain.get("/getResumeQuiz/:quizId", ValidateTokenForWeb, async (req, res) => {
  const { quizId } = req.params;
  try {
    const user = await findUserByUserId(req.userId);
    if (user) {
      const quiz = await QuizTable.findById(quizId);
      const test = await TestSeriesTestTable.findById(quizId);
      if (quiz) {
        const resumedQuiz = await QuizResumeTable.find({ quizId });
        return res.json({
          status: true,
          data: resumedQuiz?.map((item) => {
            return {
              id: item._id,
              quizId: item.quizId,
              userId: item.userId,
              ans_res: item.ans_res,
              totaltime: quiz.quiz_duration,
              timeSpent: item.timeSpent,
            };
          }),
          msg: "Resumed Quizes",
        });
      } else if (test) {
        const resumedQuiz = await QuizResumeTable.find({ quizId });
        return res.json({
          status: true,
          data: resumedQuiz?.map((item) => {
            return {
              id: item._id,
              quizId: item.quizId,
              userId: item.userId,
              ans_res: item.ans_res,
              totaltime: test.duration,
              timeSpent: item.timeSpent,
            };
          }),
          msg: "Resumed Tests",
        });
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Invalid Request",
        });
      }
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid User",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

//get quiz result
WebContain.get("/getQuizResult", ValidateTokenForWeb, async (req, res) => {
  const { quizId, attemptId } = req.query;
  try {
    // console.log(quizId + " " + attemptId + "" + req.userId);
    const studentDetails = await findUserByUserId(req?.userId);
    if (studentDetails) {
      const quiz = await QuizTable.findById(quizId);
      const GetTest = await TestSeriesTestTable.findById(quizId);
      // console.log("Quiz", GetTest)
      if (quiz) {
        let quizResFilter = {};
        if (attemptId) {
          quizResFilter = {
            _id: attemptId,
            quiz_id: quizId,
            user_id: studentDetails._id,
          };
        } else {
          quizResFilter = {
            quiz_id: quizId,
            user_id: studentDetails?._id,
          };
        }
        let studentRes = [];
        let currectRes = [];
        const quizResponse = await QuizResponseTable
        .findOne(quizResFilter)
        .sort({ createdAt: -1 });
        // console.log("quizResponse", quizResponse);
        const topperScore = await getTopperScore(quizId);
        if (quizResponse?.is_active) {
          studentRes.push(quizResponse?.ans_res);
          
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
          console.log("studentRes", studentRes.length);
          for (let i = 0; i < quizQuestions.length; i++) {
            if(studentRes.length > 1) {
              if (quizResponse?.ans_res && quizResponse?.ans_res[0]) {
                currectRes[i]["myAnswer"] = Object.values(
                  quizResponse.ans_res[i]
                )[0] ?? "";
              } else {
                currectRes[i]["myAnswer"] = "";
              }
            }else {
              currectRes[i]["myAnswer"] = Object.values(
                quizResponse?.ans_res[0]
              )[i] ?? "";
            }
            
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
          // quizResponse.forEach((r) => {
          //   studentRes.push(r.ans_res);
          // });
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
          // studentRes = studentRes?.[0];
          for (let i = 0; i < quizQuestions.length; i++) {
            currectRes[i]["myAnswer"] = Object?.values(
              quizResponse?.ans_res[0]
            )[i];
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
      } else if (GetTest) {
        let quizResFilter = {};
        if (attemptId) {
          quizResFilter = {
            _id: attemptId,
            quiz_id: quizId,
            user_id: studentDetails._id,
          };
        } else {
          quizResFilter = {
            quiz_id: quizId,
            user_id: studentDetails._id,
          };
        }
        let studentRes = [];
        let currectRes = [];
        const quizResponse = await QuizResponseTable.find(quizResFilter);
        const topperScore = await getTopperScore(quizId);
        if (quizResponse[0]?.is_active) {
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
            currectRes[i]["myAnswer"] = Object.values(
              quizResponse[0].ans_res[0]
            )[i];
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
          if (GetTest.negativemarking) {
            myScore =
              correctAns * parseFloat(GetTest.eachQueMarks) -
              wrongAnswers * parseFloat(GetTest.negativeMarks);
          } else {
            myScore = correctAns * parseFloat(GetTest.eachQueMarks);
          }
          const topperSc =
            typeof topperScore === "number" ? topperScore : 0.0;
          const topperPer =
            (topperSc / (GetTest.eachQueMarks * currectRes.length)) * 100;
          const myScorePer =
            (myScore / (GetTest.eachQueMarks * currectRes.length)) * 100;
          res.json({
            status: true,
            data: {
              quizId: quizId,
              is_published: true,
              totalMarks: (
                parseFloat(GetTest.eachQueMarks) * currectRes.length
              ).toFixed(2),
              is_negative: GetTest.negativemarking,
              negativeMarks:
                GetTest.negativeMarks !== ""
                  ? parseFloat(GetTest.negativeMarks).toFixed(2)
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
            currectRes[i]["myAnswer"] = Object.values(
              quizResponse[0]?.ans_res[0]
            )[i];
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
          if (GetTest.negativemarking) {
            myScore =
              correctAns * parseFloat(GetTest.eachQueMarks) -
              wrongAnswers * parseFloat(GetTest.negativeMarks);
          } else {
            myScore = correctAns * parseFloat(GetTest.eachQueMarks);
          }
          const topperSc =
            typeof topperScore === "number" ? topperScore : 0.0;
          const topperPer =
            (topperSc / (GetTest.eachQueMarks * currectRes.length)) * 100;
          const myScorePer =
            (myScore / (GetTest.eachQueMarks * currectRes.length)) * 100;
          res.json({
            status: true,
            data: {
              is_published: false,
              quizId: quizId,
              totalMarks: (
                parseFloat(GetTest.eachQueMarks) * currectRes.length
              ).toFixed(2),
              is_negative: GetTest.negativemarking,
              negativeMarks:
                GetTest.negativeMarks !== ""
                  ? parseFloat(GetTest.negativeMarks).toFixed(2)
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
      } else {
        res.json({
          status: false,
          data: null,
          msg: "No Data Found",
        });
      }
    } else {
      res.json({
        status: false,
        data: null,
        msg: "Not authorized",
      });
    }
  } catch (error) {
    // console.log(error);
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

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
            let is_attempted = false;
            if (studentRes.length === 0) {
                // console.log("No answers found for student:", studentId);
            } else {
                is_attempted = true;
            }
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
                is_attempted
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
            let is_attempted = false;
            if (studentRes.length === 0) {
                // console.log("No answers found for student:", studentId);
            }
            else {
                is_attempted = true;
            }
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
                is_attempted
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
// getLeaderBoard
WebContain.get("/getleaderBoard/:quizId", ValidateTokenForWeb, async (req, res) => {
  const { quizId } = req.params;
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'not an user'
      })
    }
    if (!quizId) {
      return res.json({
        status: false,
        data: null,
        msg: "quizId required",
      });
    }
    const quiz = await QuizTable.findById(quizId);
    const GetTest = await TestSeriesTestTable.findById(quizId);
    if (quiz || GetTest) {
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
            data: {
              leaderBoardId: data._id,
              quizId: data.quizId,
              leaderBoard: data.leaderBoard.map((item) => {
                return {
                  studentId: item.studentId,
                  studentName: item.studentName,
                  myScore: item.myScore?.parseInt(),
                  totalMarks: item.totalMarks,
                  accuracy: item.accuracy,
                  is_attempted: item.is_attempted,
                }
              }),
              isActive: data.isActive,
              // publishedAt: data.publishedAt,
            },
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
        const usersScore = await getQuizResults(quiz?._id);
        if (usersScore) {
            let leaderBoard = usersScore?.studentScores;
            const data = await leaderBoardTable.findByIdAndUpdate(ldrbrd[0]?._id, { leaderBoard: leaderBoard }, { new: true, lean: true });
            return res.json({
              status: true,
              data: {
                leaderBoardId: data._id,
                quizId: data.quizId,
                leaderBoard: data.leaderBoard.map((item) => {
                  return {
                    studentId: item.studentId,
                    studentName: item.studentName,
                    myScore: item.myScore,
                    totalMarks: item.totalMarks,
                    accuracy: item.accuracy,
                    is_attempted: item.is_attempted,
                  }
                }),
                isActive: data.isActive,
                // publishedAt: data.publishedAt,
              },
              msg: "LederBorad",
            });
        }
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }



});

WebContain.get("/getNotes", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug, subjectId } = req.query;
  if (!batchSlug || !subjectId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchSlug Or SubjectId"
    })
  }
  try {
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ slug: batchSlug, subject: { $in: subjectId } });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "not authorized to access"
      })
    }

    let lectures = [];
    if (isBatch?.materials == "recorded") {
      lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId, isActive: true });
    } else {
      lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId, createdAt: { $exists: true, $gte: isMyBatch?.assignedDate }, isActive: true });
    }
    
    let responseArr = [];
    for (let lec of lectures) {
      const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $ne: "DPP" }, is_active: true });
      let lectureMaterial = {
        resource_title: lec?.material?.fileName ?? "", resourceType: "pdf", file: lec?.material ?? {
          fileLoc: "",
          fileName: "",
          fileSize: "",
        }
      }
      let resArr = [];
      if (lectureMaterial.file.fileLoc != "") resArr.push(lectureMaterial);
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

WebContain.get("/getDPPs", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug, subjectId } = req.query;
  if (!batchSlug || !subjectId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchId Or SubjectId"
    })
  }
  try {

    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ slug: batchSlug, subject: { $in: subjectId } });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user._id, batch_id: isBatch?._id });
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "not authorized to access"
      })
    }


    const lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId });
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

WebContain.get("/freeCourses", ValidateTokenForWeb, async (req, res) => {
  const { stream, limit, categorySlug, subCategorySlug } = req.query;
  const n = parseInt(limit) || 5;
  try {
    const user = await findUserByUserId(req?.userId);
    const myBatches = await MybatchTable.find({ user: user?._id });
    let myBatchIdArray = myBatches.map((item) => { return item?.batch_id })
    let query = {};
    if (stream && stream != 'all') {
      const category = await categoryTable.findOne({ slug: stream });
      if (myBatchIdArray.length > 0) {
        query = {
          _id: { $nin: myBatchIdArray },
          stream: category?.title,
          isPaid: false,
          charges: '0',
          discount: '0',
          is_active: true,
        }
      } else {
        query = {
          // _id: { $nin: myBatchIdArray },
          stream: category?.title,
          isPaid: false,
          charges: '0',
          discount: '0',
          is_active: true,
        }
      }
    } else {
      if (myBatchIdArray.length > 0) {
        query = {
          _id: { $nin: myBatchIdArray },
          isPaid: false,
          discount: "0",
          charges: '0',
          is_active: true,
        }
      } else {
        query = {
          // _id: { $nin: myBatchIdArray },
          isPaid: false,
          discount: "0",
          charges: '0',
          is_active: true,
        }
      }

    }
    if (categorySlug) {
      let newCategory = await categoryTable.findOne({ slug: categorySlug });
      if (newCategory) {
        query.category = {
          $in: [newCategory?._id]
        }
      } else {
        return res.json({
          status: false,
          data: null,
          message: `Not An Valid Category`
        })
      }
    }
    if (subCategorySlug) {
      let newSubCategory = await subCategoryTable.findOne({ slug: subCategorySlug });
      if (newSubCategory) {
        query.subCategory = {
          $in: [newSubCategory?._id]
        }
      }
      else {
        return res.json({
          status: false,
          data: null,
          message: `Not An Valid Sub Category`
        })
      }
    }
    // console.log(query)
    const batchDetails = await BatchesTable.aggregate([
      {
        $match: query
      },
      {
        $addFields: {
          studentCount: { $size: "$student" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: n,
      },
    ]);
    if (!batchDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Courses not found",
      });
    }
    let responseArr = [];

    const ResponseArray = await Promise.all(batchDetails.map(async (item) => {

      const category = await categoryTable.findOne({ title: item.stream });
      // console.log(category);
      let categoryDetails = { id: "", title: "", slug: "", tags: [] };
      if (category) {
        categoryDetails = {
          id: category._id ?? "",
          title: category.title ?? "",
          slug: category.slug ?? "",
          tags: category?.tags ?? [],
        }
      }
      let obj = {
        id: item._id ?? "",
        batchName: item.batch_name ?? "",
        // examType: item.exam_type ?? "",
        startingDate: item.starting_date ?? "",
        endingDate: item.ending_date ?? "",
        batchSlug: item?.slug ?? "",
        mode: item.mode ?? "",
        // isLive: item.materials ?? "",
        language: item.language ?? "",
        banner: item.banner[0].fileLoc ?? "",
        stream: item.stream ?? "",
        category: categoryDetails,
        batchFeatureUrl: batchValidityFeatures(item.stream),
        // duration: item.,
        realPrice: item.charges ?? "",
        salePrice: item.discount ?? "",

        duration: moment(item.ending_date).diff(moment(item.starting_date), 'days'),
        studentCount: item.studentCount ?? 0,
      };
      if (category?.is_active == true) {
        responseArr.push(obj);
      }

    }));
    return res.json({
      status: true,
      // data: ResponseArray ?? [],
      data: responseArr ?? [],
      msg: 'free Courses fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/paidCourses", ValidateTokenForWeb, async (req, res) => {
  const { stream, limit, subCategorySlug, categorySlug } = req.query;
  const n = parseInt(limit) || 5;
  try {
    const user = await findUserByUserId(req?.userId);
    const myBatches = await MybatchTable.find({ user: user?._id });
    let myBatchIdArray = myBatches.map((item) => { return item?.batch_id })
    let query = {};
    // let categoryDetails = { id : "" , title : "" , slug : ""};
    if (stream && stream != 'all') {
      const category = await categoryTable.findOne({ slug: stream });
      if (myBatchIdArray.length > 0) {
        query = {
          _id: { $nin: myBatchIdArray },
          stream: category?.title,
          isPaid: true,
          charges: { $gt: '0' },
          is_active: true,
        }
      } else {
        query = {
          // _id: { $nin: myBatchIdArray },
          stream: category?.title,
          isPaid: true,
          charges: { $gt: '0' },
          is_active: true,
        }
      }

    } else {
      if (myBatchIdArray.length > 0) {
        query = {
          _id: { $nin: myBatchIdArray },

          isPaid: true,
          charges: { $gt: '0' },
          is_active: true,
        }
      } else {
        query = {

          isPaid: true,
          charges: { $gt: '0' },
          is_active: true,
        }
      }
    }
    if (categorySlug) {
      let newCategory = await categoryTable.findOne({ slug: categorySlug });
      if (newCategory) {
        query.category = {
          $in: [newCategory?._id]
        }
      } else {
        return res.json({
          status: false,
          data: null,
          message: `Not An Valid Category`
        })
      }
    }
    if (subCategorySlug) {
      let newSubCategory = await subCategoryTable.findOne({ slug: subCategorySlug });
      if (newSubCategory) {
        query.subCategory = {
          $in: [newSubCategory?._id]
        }
      }
      else {
        return res.json({
          status: false,
          data: null,
          message: `Not An Valid Sub Category`
        })
      }
    }
    // console.log(query);
    const batchDetails = await BatchesTable.aggregate([
      {
        $match: query
      },
      {
        $addFields: {
          studentCount: { $size: "$student" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: n,
      },
    ]);
    if (!batchDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Courses not found",
      });
    }
    let responseArr = [];
    const ResponseArray = await Promise.all(batchDetails.map(async (item) => {

      const category = await categoryTable.findOne({ title: item.stream });
      // console.log(category);
      let categoryDetails = { id: "", title: "", slug: "", tags: [] };
      if (category) {
        categoryDetails = {
          id: category._id ?? "",
          title: category.title ?? "",
          slug: category.slug ?? "",
          tags: category?.tags ?? [],
        }
      }
      let obj = {
        id: item._id ?? "",
        batchName: item.batch_name ?? "",
        // examType: item.exam_type ?? "",
        startingDate: item.starting_date ?? "",
        endingDate: item.ending_date ?? "",
        batchSlug: item?.slug ?? "",
        mode: item.mode ?? "",
        // isLive: item.materials ?? "",
        language: item.language ?? "",
        banner: item.banner[0].fileLoc ?? "",
        stream: item.stream ?? "",
        category: categoryDetails,
        batchFeatureUrl: batchValidityFeatures(item.stream),
        // duration: item.,
        realPrice: item.charges ?? "",
        salePrice: item.discount ?? "",

        duration: moment(item.ending_date).diff(moment(item.starting_date), 'days'),
        studentCount: item.studentCount ?? 0,
      };
      if (category?.is_active == true) {
        responseArr.push(obj);
      }

    }));

    return res.json({
      status: true,
      // data: ResponseArray ?? [],
      data: responseArr ?? [],
      msg: 'Paid Courses fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/freePurchaseCourses", ValidateTokenForWeb, async (req, res) => {
  const { batchId } = req.body;
  if (!batchId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required BatchId!'
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ _id: batchId, is_active: true, charges: "0" });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Batch not found Or Price greater than 0'
      })
    }
    const isMyBatch = await MybatchTable.findOne({ user: user?._id, batch_id: isBatch?._id });
    if (isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Already purchased'
      })
    }
    let genOrderId = "0001";
    const latestOrder = await courseOrdesTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    const genTxnId = generateRandomCourseTransactionId()
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const courseOrderObj = new courseOrdesTable({
      user: user._id,
      orderId: genOrderId,
      courseId: batchId,
      totalAmount: '0',
      txnId: genTxnId,
      paymentStatus: 'pending',
      isPaid: false,
      purchaseDate: formatedDate
    })
    const saveOrder = await courseOrderObj.save();
    const courseTxnObj = new courseTxnTable({
      user: saveOrder.user,
      orderId: saveOrder._id,
      txnAmount: saveOrder.totalAmount,
      txnId: saveOrder.txnId,
      easePayId: "",
      isPaid: true,
      reason: "free",
      txnDate: formatedDate
    })

    const saveTxn = await courseTxnObj.save();
    const ordersUpdate = await courseOrdesTable.findByIdAndUpdate({ _id: saveTxn.orderId }, {
      paymentStatus: 'success',
      isPaid: true
    }, { new: true });
    if (ordersUpdate.isPaid) {
      // condition
      await BatchesTable.findByIdAndUpdate(
        isBatch?._id,
        { $addToSet: { student: { $each: [user?._id] } } },
        { new: true, lean: true }
      );
      const myBatch = new MybatchTable({
        user: user?._id,
        batch_id: isBatch?._id,
        amount: saveTxn?.txnAmount,
        is_active: true,
        is_paid: true,
        created_at: formatDate(date),
        updated_at: formatDate(date),
      })
      const saveMyBatch = await myBatch.save();

      // let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 }).limit(1);
      // let invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
      let addressArray = user?.Address?.split(',');
      let isState = addressArray[addressArray?.length - 2] ?? "";
      let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
      let year = `${moment().format('YY')}-${parseInt(moment().format('YY')) + 1}`
      const dataForInvoice = {
        invoiceNumber: `${year}/${"NA"}`,
        invoiceDate: moment().format("DD-MM-YYYY"),
        studentName: user?.FullName,
        studentAddress: user?.Address ?? "",
        SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
        items: [{ name: isBatch?.batch_name ?? "", price: parseInt(0), quantity: 1 }],
        studentEmail: user?.email != 'user@gmail.com' ? user?.email : 'NA',
        studentPhone: user?.mobileNumber,
        studentState: state,
        gstNumber: "NA"
      }
      const FileUploadLocation = await pdfGenerate(dataForInvoice);
      const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
      let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
      let ext = path.extname(pdfFilePath)
      //  console.log(fileName)
      let fileLoc = ''
      const helperString = Math.floor(Date.now() / 1000);
      let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
      setTimeout(async () => {

        fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
        // console.log(fileLoc);
        const newpayment = await courseOrdesTable.findByIdAndUpdate(saveTxn.orderId, { invoice: { installmentNumber: "1", fileUrl: fileLoc } }, { new: true, lean: true })
        // if (newpayment?.invoice[0].fileUrl != "") {
        //   const newInvoice = new invoiceTable({
        //     invoiceNumber: invoiceNumber,
        //   })
        //   newInvoice.save();
        // }
      }, 4000);

      return res.json({
        status: true,
        data: null,
        msg: 'Course Pucrchase Successfully'
      })
    } else {
      return res.json({
        status: false,
        data: null,
        msg: `Course not purchased`
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

WebContain.get("/myProfile", ValidateTokenForWeb, async (req, res) => {

  try {
    const userExists = await findUserByUserId(req?.userId);
    if (!userExists) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    return res.json({
      status: true,
      data: {
        language: userExists?.language ?? "",
        stream: userExists?.Stream ?? "",
        username: userExists.username,
        email: userExists.email,
        phoneNumber: userExists.mobileNumber,
        // userID: userExists.userId,
        FullName: userExists.FullName,
        profilePhoto: userExists?.profilePhoto ?? "",
        Address: userExists?.Address ?? "",
        enrollId: userExists.enrollId
      },
      msg: 'User Details Fetched Succesfully'
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.put("/updateProfile", ValidateTokenForWeb, async (req, res) => {
  const { FullName, email, address } = req.body;
  try {
    const userExists = await findUserByUserId(req?.userId);
    if (!userExists) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    // email duplicate & email Validation
    const newUser = await UserTable.findByIdAndUpdate(userExists?._id, {
      FullName: FullName ? FullName?.trim() : userExists?.FullName,
      email: email ? email : userExists?.email,
      Address: address ? address : userExists?.Address
    })
    return res.json({
      status: true,
      data: null,
      msg: `profile updated`
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


WebContain.get("/myPurchase", ValidateTokenForWeb, async (req, res) => {
  try {
    const userExists = await findUserByUserId(req?.userId);
    if (!userExists) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const transactionDetails = await paymentTransactionTable.find({
      user: userExists._id,
    }).sort({ createdAt: -1 });

    const coursesOrder = await courseOrdesTable.find({ user: userExists?._id }).populate("courseId", "_id slug batch_name banner stream").sort({ createdAt: -1 })
    let data = [];
    for (let i = 0; i < transactionDetails.length; i++) {
      let batchDetails = await getBatchDetailsByBatchName(transactionDetails[i]?.batch_name);
      let category = await categoryTable.findOne({ title: batchDetails?.stream }, { _id: 1, title: 1, slug: 1, tags: 1 })
      // console.log(transactionDetails[i]?.batch_name);
      let obj = {
        orderId: transactionDetails[i]?.orderId ?? "",
        userOrderId: transactionDetails[i]?.userOrederId ?? "",
        paymentStatus: transactionDetails[i]?.success == true ? "success" : 'failed' ?? "",
        amount: transactionDetails[i]?.amount ?? "",
        invoice: transactionDetails[i]?.invoice ?? "",
        category: { id: category?._id ?? "", title: category?.title ?? "", categorySlug: category?.slug ?? "", tags: category?.tags ?? [] },
        batchDetails: { batchId: batchDetails?._id ?? "", batchSlug: batchDetails?.slug ?? "", batchName: batchDetails?.batch_name ?? "", banner: batchDetails?.banner ?? [] },
        platform: 'androidApp',
        courseOrderId: "",
      }
      data.push(obj);
    }
    for (let i = 0; i < coursesOrder.length; i++) {
      // console.log(i);
      let category = await categoryTable.findOne({ title: coursesOrder[i]?.courseId?.stream }, { _id: 1, title: 1, slug: 1, tags: 1 })
      let emiArray = [];
      if (coursesOrder[i]?.isEmi) {
        let emis = await emiTxnTable.find({ courseOrderId: coursesOrder[i]?._id, user: userExists?._id }).select("_id installmentNumber amount isPaid paidDate dueDate courseOrderId").sort({ installmentNumber: 1 }).collation({ locale: "en_US", numericOrdering: true });
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
            // paidDate :  item?.isPaid ? moment(item?.updatedAt).format("DD-MM-YYYY") : "NA",
            // dueDate : item?.isPaid ? moment(item?.updatedAt).format("DD-MM-YYYY") : moment(payDate).format("DD-MM-YYYY"),
            amount: item?.amount,
            paid: item?.isPaid,
            courseOrderId: item?.courseOrderId,
            // next  : item?.isPaid ? false : true, 
            next,
            installmentNumber: item?.installmentNumber
          }
          emiArray.push(emiObj)
          if (item?.isPaid == false) {
            payDate = moment(payDate).add(31, 'days');
          }
        })

        // if( emiArray.length != coursesOrder[i]?.noOfInstallments){
        //   let n = parseInt(coursesOrder[i]?.noOfInstallments) - emiArray.length ;
        //   let nextDate = coursesOrder[i]?.nextInstallmentDate ;
        //   let emiNumber =  emiArray.length;
        //   while ( n > 0){
        //     emiNumber += 1;
        //     let emiObj = {
        //       paidDate :  moment(nextDate).format("DD-MM-YYYY"),
        //        dueDate : moment(nextDate).format("DD-MM-YYYY"),
        //        amount : coursesOrder[i]?.eachInstallmentAmount,
        //         paid: false,
        //         next :  emiArray.length == emis.length ? true : false,
        //        installmentNumber : emiNumber ,
        //     }
        //     nextDate = moment(nextDate).add(31 , 'days');
        //     emiArray.push(emiObj);
        //     n--;
        //   }
        // }
      }
      let obj = {
        courseOrderId: coursesOrder[i]?._id ?? "",
        orderId: coursesOrder[i]?.orderId ?? "",
        userOrderId: coursesOrder[i]?.txnId ?? "",
        paymentStatus: coursesOrder[i]?.paymentStatus ?? "",
        amount: coursesOrder[i]?.totalAmount ?? "",
        category: { id: category?._id ?? "", title: category?.title ?? "", categorySlug: category?.slug ?? "", tags: category?.tags ?? [] },
        batchDetails: { batchId: coursesOrder[i]?.courseId?._id, batchName: coursesOrder[i]?.courseId?.batch_name ?? "", batchSlug: coursesOrder[i]?.courseId?.slug ?? "", banner: coursesOrder[i]?.courseId?.banner ?? "" },
        invoice: coursesOrder[i]?.invoice ?? "",
        platform: 'website',
        isEmi: coursesOrder[i]?.isEmi ?? "",
        nextInstallmentDate: coursesOrder[i]?.nextInstallmentDate ?? "",
        eachInstallmentAmount: coursesOrder[i]?.eachInstallmentAmount ?? "",
        pendingAmount: coursesOrder[i]?.pendingAmount ?? "",
        pendingInstallment: coursesOrder[i]?.pendingInstallment ?? "",
        noOfInstallments: coursesOrder[i]?.noOfInstallments ?? "",
        emiArray,

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

// sitemap
WebContain.get("/getSiteMap", async (req, res) => {
  try {
    const allBatches = await BatchesTable.find({ is_active: true }).select('slug stream');
    const allBlogs = await blogsTable.find({ isActive: true, platform: 'website' }).populate("category", "slug").select('slug category');
    const categories = await categoryTable.find({ is_active: true, type: "Stream" }).select('slug')

    let batchUrls = [];
    for (let i = 0; i < allBatches.length; i++) {
      const category = await categoryTable.findOne({ title: allBatches[i]?.stream }).select('slug is_active');
      let url = { "cat": category?.slug ?? "", "slug": allBatches[i]?.slug ?? "" }
      if (category?.is_active == true) {
        batchUrls.push(url);
      }

    }
    let examsCateBlogUrls = [];
    for (let i = 0; i < allBlogs.length; i++) {
      let url = { "cat": allBlogs[i]?.category?.slug ?? "", "slug": allBlogs[i]?.slug ?? "" }
      examsCateBlogUrls.push(url);
    }
    let cateUrls = [];
    for (let i = 0; i < categories.length; i++) {
      let url = `${categories[i]?.slug}`
      if (url.includes('undefined')) {
        continue;
      }
      cateUrls.push(url);
    }
    return res.json({
      status: true,
      data: { batchUrls, cateUrls, examsCateBlogUrls },
      msg: 'Url Fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/searchCourses", async (req, res) => {
  const { search } = req.query;
  try {
    let query = { is_active: true };
    if (search) {
      // console.log(search)
      query.$or = [
        { batch_name: { $regex: search, $options: "i" } },
        { stream: { $regex: search, $options: "i" } },
        // { remark: { $regex: search, $options: "i" } },
        // { metaTitle: { $regex: search, $options: "i" } },
        // { metaDesc: { $regex: search, $options: "i" } },
      ]
    }
    // console.log(query.$or);
    let BatchesDetails = await BatchesTable.find(query)
      .populate({
        path: 'teacher',
        select: "FullName profilePhoto",
        populate: {
          path: 'subject',
          select: 'title'
        }
      })
      .populate("subject", { _id: 1, title: 1 });
    let responseArr = [];
    let ResponseArray = await Promise.all(BatchesDetails.map(async (item) => {
      let category = await categoryTable.findOne({ title: item?.stream }).select("title slug");
      let obj = {
        _id: item._id ?? "",
        batch_name: item.batch_name ?? "",
        slug: item.slug ?? "",
        exam_type: item.exam_type ?? "",
        student: item.student ?? [],
        subject: item.subject ?? [],
        teacher: item.teacher ?? [],
        starting_date: item.starting_date ?? "",
        ending_date: item.ending_date ?? "",
        mode: item.mode ?? "",
        materials: item.materials ?? "",
        // language : item.language ?? "",
        charges: item.charges ?? "",
        discount: item.discount ?? "",
        description: item.description ?? "",
        banner: item.banner ?? {},
        language: item.language ?? "",
        stream: item.stream ?? "",
        remark: item.remark ?? "",
        demoVideo: item.demoVideo ?? "",
        validity: item.validity ?? "",
        is_active: item.is_active ?? "",
        isPaid: item.isPaid ?? "",
        isCoinApplicable: item.isCoinApplicable ?? "",
        maxAllowedCoins: item.maxAllowedCoins ?? "",
        course_review: item.course_review ?? "",
        batchOrder: item?.batchOrder ?? "",
        planner: item?.planner ?? {
          fileLoc: "",
          fileName: "",
          fileSize: "",
        },
        created_at: item.created_at ?? "",
        category: { title: category?.title ?? "", slug: category?.slug ?? "" }
      }
      if (category?.is_active == true) {
        responseArr.push(obj);
      }

    }));
    return res.json({
      status: true,
      // data: BatchesDetails,
      // data : ResponseArray ?? [],
      data: responseArr ?? [],
      msg: "Batches fetched"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


// CtaBanner
WebContain.get("/blogCategory", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: `Not An Admin`
      })
    }
    const blogCategory = await blogsTable.find({}).populate('category', "_id title");
    let responseArr = blogCategory?.map((item) => {
      return {
        _id: item?.category?._id ?? "",
        title: item?.category?.title ?? "",
      }
    })

    return res.json({
      status: true,
      data: [...new Set(responseArr.map(JSON.stringify))].map(JSON.parse),
      msg: 'blog Category fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/createCTABanner", upload.single("file"), isAdmin, async (req, res) => {
  const { link, linkWith, isActive, routingLink } = req.body;
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
    // console.log(routingLink)
    let fileLoc = "";
    if (req.file) {
      size = req.file.size / (1024);
      if (size > 100) {
        return res.json({
          status: false,
          data: null,
          msg: 'Maximum  icon size 100KB allowed'
        })
      }
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0].replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `ctaBanner/${filename}_${helperString}${extension}`;
      let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
      fileLoc = helperfileLoc;
    }
    let renderLink = "https://www.sdcampus.com"
    if (link == 'exam') {
      renderLink += "/exams"
    }
    else if (link == 'category') {
      let category = await categoryTable.findOne({ _id: linkWith });
      if (!category) {
        return res.json({
          status: false,
          data: null,
          msg: 'Please Select Correct category'
        })
      }
      renderLink += `/${category?.slug}`
    }
    else if (link == 'examCategory') {
      let category = await categoryTable.findOne({ _id: linkWith });
      if (!category) {
        return res.json({
          status: false,
          data: null,
          msg: 'Please Select Correct category'
        })
      }
      renderLink += `/exams/${category?.slug}`
    }
    else if (link == 'examDetails') {
      let blog = await blogsTable.findOne({ _id: linkWith }).populate('category', 'slug');
      if (!blog) {
        return res.json({
          status: false,
          data: null,
          msg: 'Please Select Correct blog'
        })
      }
      renderLink += `/${blog?.category?.slug}/${blog?.slug}`
    }
    else if (link === 'externalLink') {
      renderLink = linkWith;
    }
    const newCTABanner = new ctaBannerTable({
      admin: admin?._id,
      icon: fileLoc,
      renderLink,
      link,
      linkWith,
      routingLink,
      isActive
    })
    const saveCTABanner = await newCTABanner.save();
    return res.json({
      status: true,
      data: saveCTABanner,
      msg: 'CTA Banner Created'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getAllCTABanner", isAdmin, async (req, res) => {
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
    const allCTABanner = await ctaBannerTable.find({}).populate('admin', 'FullName Role').sort({ createdAt: -1 })
    let responseArr = [];
    for (let i = 0; i < allCTABanner.length; i++) {
      let link = "";
      let linkWith = { id: "", title: "", slug: "" };
      if (allCTABanner[i].link == 'home') {
        link = "Home Page",
          linkWith = { id: "", title: "", slug: "" }

      } else if (allCTABanner[i].link == 'exam') {
        link = "Exam Page",
          linkWith = { id: "", title: "NA", slug: "" }
      } else if (allCTABanner[i].link == 'examDetails') {
        let blog = await blogsTable.findOne({ _id: allCTABanner[i]?.linkWith })
        link = "Exam Details Page",
          linkWith = { id: blog?._id ?? "", title: blog?.title ?? "", slug: blog?.slug ?? "" }

      } else if (allCTABanner[i].link == 'examCategory') {
        let category = await categoryTable.findOne({ _id: allCTABanner[i]?.linkWith })
        link = "Exam Category Page",
          linkWith = { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "" }

      }
      else if (allCTABanner[i].link == 'category') {
        let category = await categoryTable.findOne({ _id: allCTABanner[i]?.linkWith })
        link = "Category Page",
          linkWith = { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "" }

      }
      else if (allCTABanner[i].link == 'externalLink') {
        // let category = await categoryTable.findOne({ _id: allCTABanner[i]?.linkWith })
        link = "External Link",
          linkWith = { title: allCTABanner[i]?.linkWith }
        // linkWith = { id: category?._id ?? "", title: category?.title ?? "", slug: category?.slug ?? "" }

      }
      let obj = {
        sNo: i + 1,
        id: allCTABanner[i]?._id ?? "",
        admin: { FullName: allCTABanner[i]?.admin?.FullName ?? "", Role: allCTABanner[i]?.admin?.Role ?? "" },
        renderLink: allCTABanner[i]?.renderLink ?? "",
        icon: allCTABanner[i]?.icon ?? "",
        link,
        linkWith,
        isActive: allCTABanner[i]?.isActive ?? false,
        routingLink: allCTABanner[i]?.routingLink ?? "",
        createdAt: moment(allCTABanner[i].createdAt).format('DD-MM-YYYY HH:mm:ss')
      }
      responseArr.push(obj);
    }
    return res.json({
      status: true,
      data: responseArr ?? [],
      msg: 'CTA Banner Created'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


WebContain.delete("/deleteCTABanner/:id", isAdmin, async (req, res) => {
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
        msg: 'Not an Admin'
      })
    }
    const ctaBanner = await ctaBannerTable.findByIdAndDelete(id);
    if (!ctaBanner) {
      return res.json({
        status: false,
        data: null,
        msg: 'CTA Banner not found'
      })
    }
    return res.json({
      status: true,
      data: null,
      msg: 'CTA Banner Deleted'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getCTABanners", async (req, res) => {
  const { link, linkWith } = req.query;
  try {
    let query = {};
    if (link == 'home' || link == 'exam') {
      query = {
        link: link,
        isActive: true
      }
    }
    if ((link == 'examDetails' || link == 'examCategory' || link == 'category') && linkWith != "") {
      query = {
        link: link,
        linkWith: linkWith, isActive: true
      }
    }
    if (link == 'externalLink') {
      query = {
        link: 'externalLink', isActive: true
      }
    }

    const ctaBanners = await ctaBannerTable.find(query).sort({ createdAt: -1 });
    let resArr = ctaBanners.map((item) => {
      return {
        // url: item?.renderLink ?? "",
        url: item?.routingLink ?? "",
        image: item?.icon ?? ""
      }
    })

    return res.json({
      status: true,
      data: resArr,
      msg: 'CTA Banner fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/getInVoiceUrl", ValidateTokenForWeb, async (req, res) => {
  const { batchId, batchName, amount } = req.body;
  if (!batchId || !batchName || !amount) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required BatchId batchName amount'
    })
  }
  try {
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not an User`
      })
    }
    let isInVoice = await MybatchTable.findOne({ user: user?._id, batch_id: batchId }).select('invoice');
    if (isInVoice?.invoice) {
      //  from = 'app' ; 
      // console.log()
      console.log(`Not Uploaded in S3`)
      return res.json({
        status: true,
        data: isInVoice?.invoice,
        msg: 'PDF will download here'
      })
    }
    const data = {
      invoiceNumber: 'autoGenerated',
      invoiceDate: moment().format("DD-MM-YYYY"),
      studentName: user?.FullName,
      studentAddress: user?.Address ?? "",
      SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
      items: [{ name: batchName ?? "", price: parseInt(amount), quantity: 1 }],
      studentEmail: user?.email != 'user@gmail.com' ? user?.email : 'NA',
      studentPhone: user?.mobileNumber,
      studentState: "Uttar Pradesh",
      gstNumber: "09ABBCS1440F1ZN"
    }
    let FileUploadLocation = await pdfGenerate(data);
    const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
    let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
    let ext = path.extname(pdfFilePath)
    //  console.log(fileName)
    let fileLoc = ''
    const helperString = Math.floor(Date.now() / 1000);
    let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
    setTimeout(async () => {
      // console.log("Delayed for 1 second.");
      fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
      console.log(fileLoc)
      const newMyBatch = await MybatchTable.findByIdAndUpdate(isInVoice?._id, { invoice: fileLoc }, { new: true, lean: true })
      return res.json({
        status: true,
        data: newMyBatch?.invoice,
        msg: `PDF will download here`
      })
    }, 3000);
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/getInVoiceUrlForApp", async (req, res) => {
  // WebContain.post("/getInVoiceUrlForApp" , ValidateTokenForWeb , async(req , res) => {
  const { batchName, batchId, user, totalAmount, isEmi } = req.body;
  try {

    let isInVoice = await MybatchTable.findOne({ user: user?._id, batch_id: batchId }).select('invoice');
    if (isInVoice?.invoice) {
      //  from = 'app' ; 
      // console.log()
      // console.log(`Not Uploaded in S3`)
      return res.json({
        status: true,
        data: isInVoice?.invoice,
        msg: 'PDF will download here'
      })
    }


    const data = {
      invoiceNumber: 'autoGenerated',
      invoiceDate: moment().format("DD-MM-YYYY"),
      studentName: user?.FullName,
      studentAddress: user?.Address ?? "",
      SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
      items: [{ name: batchName ?? "", price: parseInt(totalAmount), quantity: 1 }],
      studentEmail: user?.email != 'user@gmail.com' ? user?.email : 'NA',
      studentPhone: user?.mobileNumber,
      studentState: "Uttar Pradesh",
      gstNumber: "09ABBCS1440F1ZN"
    }

    let FileUploadLocation = await pdfGenerate(data);
    const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
    let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
    let ext = path.extname(pdfFilePath)
    //  console.log(fileName)
    let fileLoc = ''
    const helperString = Math.floor(Date.now() / 1000);
    let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
    setTimeout(async () => {
      // console.log("Delayed for 1 second.");
      fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
      // console.log(fileLoc)
      const newMyBatch = await MybatchTable.findByIdAndUpdate(isInVoice?._id, { invoice: fileLoc }, { new: true, lean: true })
      return res.json({
        status: true,
        data: newMyBatch?.invoice,
        msg: `PDF will download here`
      })
    }, 2000);


    // return res.json({
    //   status : true ,
    //   data : newMyBatch?.invoice  ,
    //   msg : `PDF will download here`
    // })
    // fileLoc = helperfileLoc;

    // fs.unlink(pdfFilePath, (err) => {
    //   if (err) {
    //     console.error('Error deleting PDF file:', err);
    //     return;
    //   }
    //   console.log('PDF file deleted successfully.');
    // });




  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getFAQs", async (req, res) => {
  const { type, id } = req.query;
  if (![null, '', undefined, 'home']?.includes(type) && !id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id'
    })
  }
  try {
    // if( [null , 'undefined' , '']?.includes())
    // console.log(type , id);
    let faqs = {};
    if (type === 'batch') {
      faqs = await BatchesTable.findOne({ _id: id }).select('faqs').populate('faqs', '_id question answer')
    } else if (type == 'category') {
      faqs = await categoryTable.findOne({ _id: id }).select('faqs').populate('faqs', '_id question answer')
    } else {
      faqs.faqs = await faqsTable.findOne({ type: 'home' })
    }
    // console.log(faqs?.faqs?.length)

    return res.json({
      status: true,
      data: faqs?.faqs?.map((item) => {
        return {
          id: item?._id ?? "",
          question: item?.question ?? "",
          label: item?.question,
          value: item?._id,
          answer: item?.answer ?? "",
        }
      }),
      msg: 'faqs'

    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/createFAQs", isAdmin, async (req, res) => {
  const { question, answer, type, isActive } = req.body;
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: `Not an Admin`
      })
    }
    const newFaq = new faqsTable({
      admin: admin?._id,
      question: question,
      answer: answer,
      isActive: isActive,
      type: type,
    })
    const saveFaq = await newFaq.save();
    return res.json({
      status: true,
      data: null,
      msg: 'faqs'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.put("/updateFAQ/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id'
    })
  }
  const { question, answer, type, isActive } = req.body;
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: `Not an Admin`
      })
    }
    const newFaq = await faqsTable.findByIdAndUpdate(id, {
      admin: admin?._id,
      question: question,
      answer: answer,
      isActive: isActive,
      type: type,
    })
    // const saveFaq = await newFaq.save(); 
    return res.json({
      status: true,
      data: null,
      msg: 'faqs updated'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getFAQ/:id", isAdmin, async (req, res) => {
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
        msg: `Not an Admin`
      })
    };
    const newFaq = await faqsTable.findOne({ _id: id })
    // const saveFaq = await newFaq.save(); 
    return res.json({
      status: true,
      data: newFaq,
      msg: 'faqs fetched'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.delete("/deleteFAQ/:id", isAdmin, async (req, res) => {
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
        msg: `Not an Admin`
      })
    };
    const newFaq = await faqsTable.findByIdAndDelete(id)
    // const saveFaq = await newFaq.save(); 
    return res.json({
      status: true,
      data: newFaq,
      msg: 'faqs deleted'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getAllFAQs", isAdmin, async (req, res) => {
  const { type } = req.query;

  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: `Not an Admin`
      })
    };
    let query = {};
    if (!["", undefined, null]?.includes(type)) {
      query = {
        type: type,
        isActive: true
      }
    }
    const faqs = await faqsTable.find({ ...query }).populate('admin', '_id FullName Role profilePhoto')
    // const saveFaq = await newFaq.save(); 
    return res.json({
      status: true,
      data: faqs.map((item, index) => {
        return { ...item?._doc, value: item?._id, name: item?.question, label: item?.question, admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" }, id: item?._id, sno: index + 1 }
      }),
      msg: 'faqs fetched'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/assignFAQs", isAdmin, async (req, res) => {
  const { type, id, faqs } = req.body;
  if (!['home', 'category', 'batch']?.includes(type) || !id || faqs.length <= 0) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required type , id , Faqs'
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not An Admin'
      })
    }
    // console.log(type , faqs , id);
    if (type == 'category') {
      const isExist = await categoryTable.findOne({ _id: id });
      // duplicate remove 
      let faqsss = [...isExist?.faqs, ...faqs]?.map((item) => { return item?.toString() });
      let uniqueFaqs = [...new Set(faqsss)];
      // console.log(uniqueFaqs);
      await categoryTable.findByIdAndUpdate(isExist?._id, { faqs: uniqueFaqs });
    }
    if (type == 'batch') {
      const isExist = await BatchesTable.findOne({ _id: id });
      let faqsss = [...isExist?.faqs, ...faqs]?.map((item) => { return item?.toString() });
      let uniqueFaqs = [...new Set(faqsss)];
      // console.log(uniqueFaqs);
      await BatchesTable.findByIdAndUpdate(isExist?._id, { faqs: uniqueFaqs });;
    }
    return res.json({
      status: true,
      data: null,
      msg: 'FAQS added given Batch Or Category'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/sendOtpToPhone", async (req, res) => {
  try {
    const { phone, utm_campaign, utm_medium, utm_source } = req.body;
    let phoneRegex = /^\d{10}$/;
    if (!phone || !phone?.toString().match(phoneRegex)) {
      return res.json({
        status: false,
        data: null,
        msg: "Please Check Your Phone Number",
      });
    }
    const isUser = await UserTable.findOne({ mobileNumber: phone });
    if (isUser) {
      return res.json({
        status: false,
        data: null,
        msg: "User Already Exists"
      })
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
    const masterOtp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const time =
      date.getHours() * 60 + date.getMinutes() * 60 + date.getSeconds();
    let userID = uuidv1();
    const refreshToken = jwt.sign(
      { studentId: userID },
      process.env.SECRET_KEY,
      { expiresIn: "10m" }
    );

    const user = new UserTable({
      FullName: "",
      username: "User",
      password: "",
      email: "user@gmail.com",
      created_at: formatedDate,
      deviceName: "",
      deviceConfig: "",
      fcmToken: "",
      mobileNumber: phone,
      Stream: [],
      mobileNumberVerified: false,
      userEmailVerified: false,
      RefreshToken: refreshToken,
      emailVerificationOTP: otp,
      mobileNumberVerificationOTP: otp,
      otpcreatedDate: time,
      userId: userID,
      utm_campaign: utm_campaign || "direct_search",
      utm_source: utm_source || "sdcampus_website",
      utm_medium: utm_medium || "sdcampus_website",
      myReferralCode: await generateReferralCode(),
      signinType: "WebSite",
      masterOtp: masterOtp
    });
    const data = await user.save();
    if (data && await SendOtpSms(otp, phone)) {
      const txnData = {
        action: 'add',
        reason: 'signup',
        amount: '51',
        dateTime: formatedDate,
      }
      await saveRefAmount(data._id, txnData)
      return res.json({
        status: true,
        data: refreshToken,
        msg: `OTP sent to ${phone}`
      })
    } else return res.json({
      status: false,
      data: null,
      msg: "Error while registration, Please Try Again !"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.post("/createCampaign", ValidateTokenForWeb, async (req, res) => {
  try {
    const { name, phone, fcmToken, category, subCategory } = req.body;
    let phoneRegex = /^\d{10}$/;
    if (!phone || !phone?.toString().match(phoneRegex)) {
      return res.json({
        status: false,
        data: null,
        msg: "Please Check Your Phone Number",
      });
    }
    const isUser = await UserTable.findOne({ mobileNumber: phone, userId: req.userId });
    if (!isUser) {
      return res.json({
        status: false,
        data: null,
        msg: "Phone is not verified"
      })
    }
    const isCategory = await categoryTable.findOne({ _id: category });
    if (!isCategory) {
      return res.json({
        status: false,
        data: null,
        msg: "Category not exists"
      })
    }
    const isSubCategory = await subCategoryTable.findOne({ _id: subCategory });
    if (!isSubCategory) {
      return res.json({
        status: false,
        data: null,
        msg: "Sub Category not exists"
      })
    }
    await UserTable.findByIdAndUpdate({ _id: isUser?._id }, { FullName: name, fcmToken, category: [isCategory?._id], Stream: [isCategory?.title], subCategory: [isSubCategory?._id] })
    return res.json({
      status: true,
      data: null,
      msg: `You successfully register for campaign`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getSubjectDetailsOfBatch", async (req, res) => {
  const { batchSlug } = req.query;
  if (!batchSlug) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required slug'
    })
  }
  try {

    let query = {
      slug: batchSlug,
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
      details: {
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

WebContain.get("/getLectureDetailsOfSubject", async (req, res) => {
  const { batchSlug, subjectId } = req.query;
  if (!batchSlug && !subjectId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required batchSlug or subjectId'
    })
  }
  try {

    const isBatch = await BatchesTable.findOne({ slug: batchSlug, subject: { $in: subjectId } }).populate("subject", "_id title");
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: 'Batch not found'
      })
    }

    const lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId, isActive: true }).select('lecture_title starting_date ending_date link banner teacher').populate('teacher', '_id FullName').sort({ createdAt: 1 });

    return res.json({
      status: true,
      data: lectures.map((item, index) => {
        return {
          title: item?.lecture_title ?? "",
          startDateTime: item?.starting_date ?? "",
          endDateTime: item?.ending_date ?? "",
          link: index == 0 ? item?.link : "",
          teacher: item?.teacher[0]?.FullName ?? "",
          banner: item?.banner != "" ? item?.banner : "https://static.sdcampus.com/assets/lecture_default_1732539568.jpg",
          startTime: moment(item.starting_date, 'DD-MM-YYYY HH:mm:ss').format('LT'),
          endTime: moment(item.ending_date, 'DD-MM-YYYY HH:mm:ss').format('LT')
        }
      }),
      msg: 'All Lecture fetched'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

WebContain.get("/getNoteDetails", async (req, res) => {
  const { batchSlug, subjectId } = req.query;
  if (!batchSlug || !subjectId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchSlug Or SubjectId"
    })
  }
  try {
    const isBatch = await BatchesTable.findOne({ slug: batchSlug, subject: { $in: subjectId } });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }


    const lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId, isActive: true }).select('_id lecture_title material');
    let responseArr = [];
    let i = 0;
    for (let lec of lectures) {
      const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $nin: ["link", 'video', 'yt_videos', "DPP"] }, is_active: true });
      // console.log(notes);
      let lectureMaterial = {
        resource_title: lec?.material?.fileName ?? "", resourceType: "pdf", file: {
          fileLoc: lec?.material?.fileLoc,
          fileName: lec?.material?.fileName ?? "",
          fileSize: lec?.material?.fileSize ?? "",
        }
      }
      let resArr = [];
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
      if (lectureMaterial.file.fileName != "" && lectureMaterial.file.fileLoc != "") resArr.push(lectureMaterial);
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
              resourceType: 'pdf',
              file: {
                fileLoc: (index === 0 && index2 === 0) ? item2?.file?.fileLoc : '',
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

WebContain.get("/getDppDetails", async (req, res) => {
  const { batchSlug, subjectId } = req.query;
  if (!batchSlug || !subjectId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchSlug Or SubjectId"
    })
  }
  try {

    const isBatch = await BatchesTable.findOne({ slug: batchSlug, subject: { $in: subjectId } });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const lectures = await LectureTable.find({ batch: isBatch?._id, subject: subjectId });
    let responseArr = [];
    for (let lec of lectures) {
      const notes = await LectureResourceTable.find({ lecture: lec._id, resourceType: { $eq: "DPP" }, is_active: true });
      let lectureDPP = {
        resource_title: lec?.dpp?.fileName ?? "", resourceType: "DPP", file: {
          fileLoc: lec?.dpp?.fileLoc,
          fileName: lec?.dpp?.fileName ?? "",
          fileSize: lec?.dpp?.fileSize ?? "",
        }
      }
      let resArr = [];
      // if (lectureDPP.file.fileName != "") resArr.push(lectureDPP);
      notes.map((item) => {
        let resource = {
          fileLoc: item?.upload_file?.fileLoc ?? "",
          fileName: item?.upload_file?.fileName ?? "",
          fileSize: item?.upload_file?.fileSize ?? "",
        }
        if (resource.fileName != "") resArr.push({ resource_title: item.title, resourceType: item.resourceType, file: resource });

      })

      if (lectureDPP.file.fileName != "") resArr.push(lectureDPP);
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

WebContain.get("/getAnnouncementsOfBatch/:batchSlug", ValidateTokenForWeb, async (req, res) => {
  const { batchSlug } = req.params;
  if (!batchSlug) {
    return res.json({
      status: false,
      data: null,
      msg: "Required batchSlug"
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ slug: batchSlug });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }
    const announcements = await announcementTable.find({ link: "batch", linkWith: isBatch._id, isActive: true }).sort({ createdAt: -1 }).select("_id title description createdAt");
    let responseArr = announcements.map((item) => {
      return {
        id: item._id ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        createdAt: moment(item.createdAt).format("DD MMM YYYY"),
      }
    });
    return res.json({
      status: true,
      data: responseArr,
      msg: 'All Announcement fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

WebContain.get("/getQuizDetailsOfBatchId/:batchId", ValidateTokenForWeb, async (req, res) => {
  const { batchId } = req.params;
  if (!batchId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Batch Id'
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const isBatch = await BatchesTable.findOne({ _id: batchId });
    if (!isBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not found"
      })
    }

    let QuizDetails;
    const studentDetails = await findUserByUserId(req.userId);
    if (studentDetails) {
      const attemptedQuizes = await QuizResponseTable.find({
        user_id: studentDetails._id,
      });
      let checkArray = [];
      for (let i = 0; i < attemptedQuizes.length; i++) {
        checkArray.push(attemptedQuizes[i].quiz_id);
      }
      QuizDetails = await QuizTable.find(
        {
          _id: { $nin: checkArray },
          link: 'batch',
          linkWith: isBatch?._id,
          is_active: true,
          no_ques: {
            $gt: "0",
          },
        },
        { user: 0, __v: 0 }
      );
      let resArr = [];
      for (let j = 0; j < QuizDetails.length; j++) {
        const questions = await QuizQuestionsTable.find({
          quiz_id: QuizDetails[j]._id,
        });
        let Res = {
          id: QuizDetails[j]._id,
          quiz_title: QuizDetails[j].quiz_title,
          quiz_desc: QuizDetails[j].quiz_desc,
          quiz_duration: QuizDetails[j].quiz_duration,
          no_ques: questions.length.toString(),
          quiz_banner: QuizDetails[j].quiz_banner[0],
          language: QuizDetails[j].language,
          is_negative: QuizDetails[j].is_negative,
          negativeMarks: QuizDetails[j].negativeMarks,
          eachQueMarks: QuizDetails[j].eachQueMarks,
          quiz_created_at: QuizDetails[j].created_at,
        };
        resArr.push(Res);
      }
      let atmptArr = [];
      QuizAteempted = await QuizTable.find(
        { _id: { $in: checkArray }, link: "batch", linkWith: isBatch?._id },
        { user: 0, __v: 0 }
      );
      for (let j = 0; j < QuizAteempted.length; j++) {
        let Res = {
          id: QuizAteempted[j]._id,
          quiz_title: QuizAteempted[j].quiz_title,
          quiz_desc: QuizAteempted[j].quiz_desc,
          quiz_duration: QuizAteempted[j].quiz_duration,
          no_ques: QuizAteempted[j].no_ques.toString(),
          quiz_banner: QuizAteempted[j].quiz_banner[0],
          language: QuizAteempted[j].language,
          is_negative: QuizAteempted[j].is_negative,
          negativeMarks: QuizAteempted[j].negativeMarks,
          eachQueMarks: QuizAteempted[j].eachQueMarks,
          quiz_created_at: QuizAteempted[j].created_at,
        };
        atmptArr.push(Res);
      }
      if (QuizDetails) {
        res.json({
          status: true,
          data: {
            is_attempted: atmptArr,
            not_attempted: resArr,
          },
          msg: "Quizes",
        });
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Quizes Not Found",
        });
      }
    }
  } catch (err) {
    res.json({
      status: false,
      data: null,
      msg: err.message,
    });
  }


});


module.exports = WebContain;
