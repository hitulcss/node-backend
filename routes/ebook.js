const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require("jsonwebtoken");
const { ebookUploadFile } = require('../aws/ebookUploadFile');
const { getSignUrl } = require('../aws/getSignedUrl');
const { isAdmin, ValidateTokenForWeb, ValidateToken } = require('../middleware/authenticateToken');
const { ebookTable } = require('../models/ebook');
const { genrateDeepLink } = require('../HelperFunctions/genrateDeepLink');
const { generateSlug } = require('../HelperFunctions/generateSlug');
const moment = require('moment');
// const express = require('express');
const { findAdminTeacherUsingUserId } = require('../HelperFunctions/adminTeacherFunctions');
const { chapterTable } = require('../models/chapter');
const { myEbookTable } = require('../models/myEbook');
const { Cashfree } = require('cashfree-pg');
const { findUserByUserId, getFcmTokenArrByUserIdArr } = require('../HelperFunctions/userFunctions');
const { ebookOrderTable } = require('../models/ebookOrder');
const { topicTable } = require('../models/topic');
const { ebookReviewTable } = require('../models/ebookReview');
const { productCategoryTable } = require('../models/productCategory');
const { uploadFile } = require('../aws/UploadFile');
const { sendBulkPushNotifications } = require('../firebaseService/fcmService');
const { getStoreCategoryByText } = require('../HelperFunctions/findStoreCategory');
const { sendCustomNotification } = require('../HelperFunctions/sendCustomNotification');

function generateRandomTransactionId() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000); // You can adjust the range as needed
  const transactionId = `SDSEBOOK${timestamp}${randomNum}`;
  return transactionId;
}
require('dotenv').config();
const upload = multer({ dest: "uploads/ebook" });

const Ebook = express.Router();

const fileDetails = (file, fileLoc) => {
  const filename = (file.originalname.split(".")[0]).replace(/\s+/g, '_');
  return {
    fileLoc: fileLoc,
    fileName: filename,
    fileSize: `${(file.size / 1000000).toFixed(2)} MB`,
  };
};




// Ebook.post("/postEbook" , upload.single('file') , async(req , res) => {
//     try{
//         // let fileUrl = "" ;
//         // if (req.file) {
//         //     const helperString = Math.floor(Date.now() / 1000);
//         //     const filename = req.file.originalname.split(".")[0].replace(/\s+/g , '_');
//         //     const extension = "." + req.file.originalname.split(".").pop();
//         //     FileUploadLocation = `ebookImage/${filename}_${helperString}${extension}`;
//         //     // console.log(req.file.mimetype)
//         //     let fileLocHelper = await ebookUploadFile(req.file.path, FileUploadLocation , req.file.mimetype);
//         //     fileUrl = fileLocHelper;
//         //   }
//           const fileUrl = await getSignUrl();
//           return res.json({
//             status : true ,
//             data : fileUrl ,
//             msg :  'Image uploaded'
//           })

//     }catch(error){
//         console.log(error);
//         return res.json({
//             status : false ,
//             data : null ,
//             msg : error.message ,
//             error: error
//         })
//     }
// })

Ebook.post("/postEbook", upload.fields([
  {
    name: "banner",
    maxCount: 1,
  },
  {
    name: "demoBooks",
    maxCount: 10,
  },
  {
    name: 'preview',
    maxCount: 1,
  }
]), isAdmin, async (req, res) => {
  const { title, category, description, tags, keyFeatures, language, metaTitle, metaDesc, regularPrice, salePrice, isActive, isPaid } = req.body;
  if (isNaN(regularPrice) || parseInt(regularPrice) < 0) {
    return res.json({
      status: false,
      data: null,
      msg: "Regular always positive number",
    });
  }

  if (isNaN(salePrice) || parseInt(salePrice) < 0) {
    return res.json({
      status: false,
      data: null,
      msg: "Sale Price always positive number",
    });
  }
  if (parseInt(regularPrice) < parseInt(salePrice)) {
    return res.json({
      status: false,
      data: null,
      msg: `Sale Price always less than regular Price`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }
    let slug = await generateSlug(title);
    let bannerObj = {};
    let bannerUrl = "";
    let previewObj = {};
    let demoBookObj = [];
    if (req.files) {
      if (req.files.banner?.length > 0) {
        let size = req.files.banner[0].size / (1024);
        if (size > 100) {
          return res.json({
            status: false,
            data: null,
            msg: 'Maximum banner size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = (req.files.banner[0].originalname.split(".")[0]).replace(/\s+/g, '_');
        const extension =
          "." + req.files.banner[0].originalname.split(".").pop();
        FileUploadLocation = `ebookImage/${title?.replace(/\s+/g, '_')}/${filename?.replace(/\s+/g, '_')}_${helperString}${extension}`;
        let fileLocHelper = await uploadFile(
          req.files.banner[0].path,
          FileUploadLocation,
          // req.files.banner[0].mimetype

        );
        bannerUrl = fileLocHelper;
        // bannerObj = {
        //     fileUrl: fileLocHelper,
        //     fileName: filename,
        //     fileSize: `${(req.files.banner[0].size / 1000000).toFixed(2)} MB`,
        //     bannerfileType: bannerfileType,
        // };
      }
      if (req.files.preview?.length > 0) {
        const helperString = Math.floor(Date.now() / 1000);
        const filename = (req.files.preview[0].originalname.split(".")[0]).replace(/\s+/g, '_');
        const extension = "." + req.files.preview[0].originalname.split(".").pop();
        FileUploadLocation = `ebookPreview/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;;
        let fileLocHelper = await ebookUploadFile(
          req.files.preview[0].path,
          FileUploadLocation,
          req.files.preview[0].mimetype
        );
        previewObj = fileDetails(req.files.preview[0], fileLocHelper);
      }
      if (req.files.demoBooks?.length > 0) {
        for (const file of req?.files?.demoBooks) {
          let size = file.size / (1024 * 1024);
          if (size > 10) {
            return res.json({
              status: false,
              data: null,
              msg: 'Maximum pdf size 10 MB allowed'
            })
          }
          const helperString = Math.floor(Date.now() / 1000);
          const filename = file.originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension = "." + file.originalname.split(".").pop();
          FileUploadLocation = `ebook/sampleBook/${filename}_${helperString}${extension}`;
          let fileLocHelper = await ebookUploadFile(file.path, FileUploadLocation, file.mimetype);
          let details = fileDetails(file, fileLocHelper);
          demoBookObj.push(details)

          // videoArray.push(fileLocHelper);
        }
        // planner = fileDetails(req.files.file1[0], fileLocHelper);
      }
    }
    // console.log( bannerUrl , previewObj , demoBookObj) 
    let categoriesId = category?.filter(item => item != "");

    const newBook = new ebookTable({
      title,
      admin: admin?._id,
      slug,
      banner: bannerUrl,
      demoBooks: demoBookObj,
      preview: previewObj,
      category: categoriesId,
      description,
      tags,
      keyFeatures,
      language,
      metaTitle,
      metaDesc,
      regularPrice,
      salePrice,
      isActive,
      isPaid
    })
    const saveBook = await newBook.save();
    let link = `https://www.sdcampus.com?route=${`ebookbyid`}&rootId=${saveBook?._id}&childId=null`
    let details = {
      "link": link ?? "",
      "utmSource": "sdcampus_app",
      "utmMedium": "refer",
      "utmCampaign": "share_course",
      "utmTerm": "",
      "utmContent": "",
      "socialTitle": title ?? "",
      "socialDescription": "",
      "socialImageLink": saveBook.banner ?? ""
    }
    let data1 = await genrateDeepLink(details);
      const data = {
        title: title,
        message: `New Ebook ${title} launched`,
        fileUrl: bannerUrl,
        route: "ebookbyid",
        rootId: `${saveBook?._id}`,
        childId: ""
    };
    // await sendCustomNotification('all', data); 
    // console.log()
    await ebookTable.findByIdAndUpdate(saveBook?._id, { shareLink: { link: data1.shortLink, text: title } })
    return res.json({
      status: true,
      data: null,
      msg: `New Ebook saved`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


Ebook.get("/getEbooks", isAdmin, async (req, res) => {
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }

    const ebooks = await ebookTable.find({}).populate('category', '_id title').populate('admin', '_id FullName Role').sort({ createdAt: -1 });
    return res.json({
      status: true,
      data: await Promise.all(ebooks?.map(async (item, index) => {
        return {
          sno: index + 1,
          id: item?._id,
          admin: { name: item?.admin?.FullName ?? "NA", role: item?.admin?.Role ?? "NA" },
          banner: await getSignUrl(item?.banner),
          tags: item?.tags,
          title: item?.title,
          regularPrice: item?.regularPrice,
          salePrice: item?.salePrice,
          language: item.language,
          isActive: item?.isActive,
          chapterCount: item?.chapterCount,
          category: item?.category?.map((item2) => { return { title: item2?.title } }),
          categoriesForExport: item?.category?.map((item2) => { return `${item2?.title}(${item2?._id})` }),
          createdAt: moment(item.createdAt).format('DD-MM-YYYY')

        }
      })),
      msg: 'All E-Books fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

Ebook.post("/addChapter", isAdmin, async (req, res) => {
  const { ebookId, chapterNumber, description, title, paid, isActive } = req.body;
  // if( !)
  console.log(req.body)
  if (!ebookId || !description || !title || !paid || [undefined, "", null]?.includes(isActive)) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Ebook Id , chapter Number , title , description , paid status , status`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }
    const isEbook = await ebookTable.findOne({ _id: ebookId });
    if (!isEbook) {
      return res.json({
        status: false,
        data: null,
        msg: `Ebook not found`
      })
    }

    const chapters = await chapterTable.find({ ebook: ebookId });
    let chapterCount = chapterNumber || chapters.length + 1;
    const newChapter = new chapterTable({
      admin: admin?._id,
      title,
      ebook: ebookId,
      description,
      paid,
      isActive,
      chapterNumber
    })
    await newChapter.save();
    await ebookTable.findByIdAndUpdate(isEbook?._id, { chapterCount: chapterCount })
    return res.json({
      status: true,
      data: null,
      msg: 'New chapter added'
    })

    // increase chapterCount in Ebook

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

Ebook.post("/addTopic", upload.single('file'), isAdmin, async (req, res) => {
  const { chapterId, topicNumber, title, isActive } = req.body;
  // if( !)
  // console.log(req.body)
  if (!chapterId || !title || [undefined, "", null]?.includes(isActive)) {
    return res.json({
      status: false,
      data: null,
      msg: `Required chapter Id , title , description , status`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }
    const isChapter = await chapterTable.findOne({ _id: chapterId });
    if (!isChapter) {
      return res.json({
        status: false,
        data: null,
        msg: `Chapter not found`
      })
    }
    let topicObj = {};
    if (req.file) {
      const helperString = Math.floor(Date.now() / 1000);
      const filename = (req.file.originalname.split(".")[0]).replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `ebookTopic/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;;
      let fileLocHelper = await ebookUploadFile(
        req.file.path,
        FileUploadLocation,
        req.file.mimetype
      );
      topicObj = fileDetails(req.file, fileLocHelper);
    } else {
      return res.json({
        status: false,
        data: null,
        msg: 'Required topics pdf file'
      })
    }
    const topics = await topicTable.find({ chapter: chapterId });
    let topicCount = topicNumber || topics.length + 1;
    const newTopic = new topicTable({
      admin: admin?._id,
      title,
      details: topicObj,
      chapter: chapterId,
      isActive,
      topicNumber: topicCount
    })
    await newTopic.save();
    await chapterTable.findByIdAndUpdate(isChapter?._id, { topicCount: topicCount })
    return res.json({
      status: true,
      data: null,
      msg: 'New topic added'
    })

    // increase chapterCount in Ebook

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

Ebook.get("/getAllEbooks", ValidateTokenForWeb, async (req, res) => {
  let { text, limit, category, categorySlug, language, page, pageSize, priceMin, priceMax, priceSort } = req.query;
  page = parseInt(page) || 1;
  pageSize = parseInt(pageSize) || 15;
  priceMin = parseInt(priceMin) || 0;
  priceMax = parseInt(priceMax) || 999;
  let query = {
    isActive: true,
    chapterCount: { $gt: 0 }
  };
  // console.log(req.query)
  if (text) {
    let categoriesId = await getStoreCategoryByText(text); 
    // console.log(categoriesId)
    query.$or = [
      { title: { $regex: text, $options: "i" } },
      { description: { $regex: text, $options: "i" } },
      { tags: { $in: [text] } },
      { category : { $in : categoriesId}}
    ];
  }
  if (priceMin && priceMax) {
    query.salePriceNum = { $gte: priceMin, $lte: priceMax }
  }
  let sortObject = { createdAt: -1 }
  if (priceSort && priceSort == 'low') {
    sortObject = { salePriceNum: 1, createdAt: -1 }
  }
  if (priceSort && priceSort == 'high') {
    sortObject = { salePriceNum: -1, createdAt: -1 }
  }
  if (language) {
    query.language = language;
  }
  const user = await findUserByUserId(req?.userId);
  // remove that ebook which in mybook section
  const myEbooks = await myEbookTable.find({ user: user?._id }).select('ebook');
  if (myEbooks.length > 0) {
    query._id = { $nin: myEbooks.map((item) => { return mongoose.Types.ObjectId(item.ebook) }) }
  }
  // console.log(query);
  try {
    let isCategory;
    if (category || categorySlug) {
      if (category) {
        isCategory = await productCategoryTable.findOne({ _id: category });
      } else if (categorySlug) {
        isCategory = await productCategoryTable.findOne({ slug: categorySlug });
      }
      // console.log(isCategory , category , categorySlug);

      if (!isCategory) {
        return res.json({
          status: false,
          data: null,
          msg: `this category not exist.`,
        });
      }
      let categoryArray = [];
      categoryArray.push(mongoose.Types.ObjectId(isCategory._id));
      const subCategory = await productCategoryTable.find({ parentCategory: isCategory._id });
      for (let cat of subCategory) {
        categoryArray.push(mongoose.Types.ObjectId(cat._id));
      }
      query.category = { $in: categoryArray }
    }
    // consol
    // const allCategories = await productCategoryTable.find({ isActive : true }).select("_id title") ; 
    const allEbooks = await ebookTable.aggregate([
      {
        $facet: {
          ebooks: [
            {
              $addFields: {
                salePriceNum: { $toInt: "$salePrice" }
              }
            },
            {
              $match: query,
            },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              // $sort: { "createdAt": -1 }
              $sort: { ...sortObject }
            },
            {
              $lookup: {
                from: 'productcategorytables',
                localField: 'category',
                foreignField: '_id',
                as: 'categories',
              },
            },
            {
              $lookup: {
                from: "ebookreviewtables",
                let: { ebook: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$ebook", "$$ebook"],
                      },
                    },
                  },
                ],
                as: "reviews",
              },
            },

            {
              $addFields: {
                reviews: { $ifNull: ["$reviews", []] },
              },
            },

            {
              $project: {
                ebook: "$$ROOT",
                // categoryDetails: '$categoryDetails',
                categories: '$categories',
                reviewCount: { $size: '$reviews' },
                averageRating: {
                  $cond: [
                    { $gt: [{ $size: "$reviews" }, 0] },
                    {
                      $toDouble: {
                        $divide: [
                          {
                            $reduce: {
                              input: "$reviews.rating",
                              initialValue: 0,
                              in: { $sum: ["$$value", { $toDouble: "$$this" }] },
                            },
                          },
                          { $size: "$reviews.rating" },
                        ],
                      },
                    },
                    0,
                  ],
                },
              },
            }],
          totalCounts: [
            {
              $addFields: {
                salePriceNum: { $toInt: "$salePrice" }
              }
            },
            { $match: query },
            { $group: { _id: null, count: { $sum: 1 } } },
          ]
        }
      },
      {
        $project: {
          ebooks: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

        }
      }
    ])
    // let categoryId = new Set();
    const ebooks = await Promise.all(allEbooks[0]?.ebooks.map(async (item) => {
      // console.log(item)
      return {
        id: item.ebook._id ?? "",
        title: item.ebook.title ?? "",
        chapterCount: `${item.ebook.chapterCount}` ?? 0,
        keyFeatures: item.ebook.keyFeatures,
        // categoryDetails: item.categoryDetails[0],
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item?.categories?.map((category) => {
          // if( !categoryId.has(category?._id?.toString())){
          //   categoryId.add(category?._id?.toString())
          // }
          return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" }
        }) ?? [],
        parentCategory: isCategory?.title ?? "",
        slug: item.ebook.slug ?? "",
        preview: await getSignUrl(item.ebook.preview.fileLoc),
        // banner: await getSignUrl(item.ebook.banner) ?? "",
        banner: item.ebook.banner ?? "",
        shareLink: { link: item?.ebook?.shareLink?.link ?? "", text: item?.ebook?.shareLink?.text ?? "" },
        regularPrice: item.ebook.regularPrice != "" ? `${parseInt(item.ebook.regularPrice)}` : "0",
        language: item.ebook.language ?? "",
        isPaid: item.ebook.isPaid ?? true,
        salePrice: item.ebook.salePrice != "" ? `${parseInt(item.ebook.salePrice)}` : "0",
        averageRating: item.averageRating.toFixed(1) || "0.0",
        reviewCount: `${item?.reviewCount}` || "0"
      };
    }));
    const allCategories = await productCategoryTable.find({ isActive: true, parentCategory: { $eq: null } }).select("_id title slug");
    const result = [];
    await Promise.all(allCategories.map(async (item) => {
      const childCategories = await productCategoryTable.find({
        isActive: true,
        parentCategory: item._id
      }).sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
      const categoryIds = [item?._id, ...childCategories.map((child) => { return child?._id })];
      const ebooks = await ebookTable.find({ category: { $in: categoryIds }, isActive: true })
      if (ebooks.length > 0) {
        let obj = {
          id: item._id ?? "",
          title: item.title ?? "",
          slug: item.slug ?? "",
          childCat: childCategories?.map(child => ({
            id: child._id ?? "",
            title: child.title ?? "",
            slug: child.slug ?? "",
          })) ?? []
        };
        result.push(obj);
      }
    }));

    if (allEbooks[0].ebooks) {
      return res.json({
        status: true,
        data: {
          categories: result,
          // categories : allCategories?.map((category) => {
          //  return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
          ebooks: ebooks,
          totalCounts: allEbooks[0]?.totalCounts?.count
        },
        msg: "All Ebooks fetched",
      });
    }
  } catch (error) {
    // console.log(error.message)
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

Ebook.get("/getSpecficEbook", ValidateTokenForWeb, async (req, res) => {
  const { id, slug } = req.query;
  try {
    let query = {
      isActive: true
    }
    if (slug && slug != "") {
      query.slug = slug
    } else {
      query._id = mongoose.Types.ObjectId(id)
    }
    // console.log(query)
    // faqs should be needed
    const result = await ebookTable.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "ebookreviewtables",
          let: { ebook: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$ebook", "$$ebook"],
                },
              },
            },
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
              $project: {
                _id: 1,
                rating: 1,
                title: 1,
                user: {
                  // id: '$user._id',
                  name: "$user.FullName",
                  profilePhoto: "$user.profilePhoto",
                },
              },
            },
          ],
          as: "reviews",
        },
      },

      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'category',
          foreignField: '_id',
          as: 'categories',
        },
      },
      {
        $lookup: {
          from: 'faqstables',
          localField: 'faqs',
          foreignField: '_id',
          as: 'faqs',
        },
      },

      {
        $project: {
          ebook: "$$ROOT",
          categories: '$categories',
          // reviews : 1,
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              {
                $toDouble: {
                  $divide: [
                    {
                      $reduce: {
                        input: "$reviews.rating",
                        initialValue: 0,
                        in: { $sum: ["$$value", { $toDouble: "$$this" }] },
                      },
                    },
                    { $size: "$reviews.rating" },
                  ],
                },
              },
              0,
            ],
          },
          ratingCount: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              {
                $let: {
                  vars: {
                    ratingCounts: {
                      $map: {
                        input: ["1", "2", "3", "4", "5"],
                        as: "rating",
                        in: {
                          k: "$$rating",
                          v: {
                            $sum: {
                              $map: {
                                input: "$reviews.rating",
                                as: "review",
                                in: {
                                  $cond: [
                                    // { $eq: ["$$review", "$$rating"] },
                                    { $eq: [{ $toString: "$$review" }, { $toString: "$$rating" }] },
                                    1,
                                    0,
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  in: {
                    $arrayToObject: "$$ratingCounts",
                  },
                },
              },
              {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
              },
            ],
          },
          reviewsWithContent: {
            $filter: {
              input: "$reviews",
              as: "review",
              cond: {
                $and: [
                  { $ne: ["$$review.rating", ""] },
                  { $ne: ["$$review.title", ""] },
                ],
              },
            },
          },
        },
      },
    ]);
    if (result?.length == 0) {
      return res.json({
        status: false,
        data: null,
        msg: 'Ebook Not Exist'
      })
    }
    const user = await findUserByUserId(req?.userId);
    //   console.log(result[0])
    // console.log(result[0].reviews)
    const ebook = {
      id: result[0].ebook._id ?? "",
      title: result[0].ebook.title ?? "",
      description: result[0].ebook.description ?? "",
      // category: { id: result[0].categoryDetails[0]?._id ?? "", title: result[0].categoryDetails[0]?.title ?? "", slug: result[0].categoryDetails[0]?.slug ?? "" },
      category: { id: result[0].categories[0]?._id ?? "", title: result[0].categories[0]?.title ?? "", slug: result[0].categories[0]?.slug ?? "" },
      categories: result[0]?.categories?.map((category) => { return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
      slug: result[0].ebook.slug ?? "",
      faqs: result[0].ebook.faqs?.map((item) => {
        return {
          question: item?.question,
          answer: item?.answer
        }
      }) ?? [],
      metaTitle: result[0].ebook.metaTitle ?? "",
      metaDesc: result[0].ebook.metaDesc ?? "",
      keyFeature: result[0].ebook.keyFeature ?? [],
      featuredImage: result[0].ebook.banner ?? "",
      // featuredImage: await getSignUrl(result[0].ebook.banner) ?? "",
      shareLink: { link: result[0]?.ebook?.shareLink?.link ?? "", text: result[0]?.ebook?.shareLink?.text ?? "" },
      preview: await getSignUrl(result[0].ebook.preview.fileLoc) ?? "",
      tags: result[0].ebook.tags ?? [],
      samplePdfs: await Promise.all(result[0].ebook.demoBooks?.map(async (item) => { return { fileLoc: await getSignUrl(item?.fileLoc), name: item?.fileName, size: item?.fileSize } })),
      regularPrice: result[0].ebook.regularPrice != "" ? `${parseInt(result[0].ebook?.regularPrice)}` : "0",
      salePrice: result[0].ebook.salePrice != "" ? `${parseInt(result[0].ebook?.salePrice)}` : "0",
      isPaid: result[0].ebook.isPaid ?? true,
      language: result[0].ebook.language ?? "",
      reviews: result[0].reviewsWithContent ?? [],
      totalReviews: `${result[0].reviewsWithContent?.length}` ?? "0",
      averageRating: result[0].averageRating.toFixed(1) || "0.0",
      ratingCounts: result[0].ratingCount ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalRatings: `${Object.values(result[0].ratingCount).reduce(
        (acc, value) => acc + value,
        0
      )}`,
    };
    if (ebook) {
      return res.json({
        status: true,
        data: ebook,
        msg: `ebook fetched.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product not fetched`,
    });
  }
});

// getAllMybook ,
Ebook.get("/getMyEbooks", ValidateTokenForWeb, async (req, res) => {
  try {
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not An User'
      })
    }

    const myBooks = await myEbookTable.find({ user: user?._id, isActive: true }).populate('ebook', '_id language title banner slug keyFeatures chapterCount language shareLink').sort({ createdAt: -1 });
    return res.json({
      status: true,
      data: myBooks?.filter((item) => ![null , undefined].includes(item?.ebook?._id)).map((item) => {
        let diffInDays =  moment(item?.expireDate).diff(moment()  , 'days')
        return {
          myEbookId: item?._id ?? "",
          ebookId: item?.ebook?._id ?? '',
          ebookSlug: item?.ebook?.slug ?? "",
          title: item?.ebook?.title ?? "",
          keyFeatures: item?.ebook?.keyFeatures ?? [],
          // banner: await getSignUrl(item?.ebook.banner) ?? "",
          banner: item?.ebook?.banner ?? "",
          expireIn : diffInDays ?? 0 , 
          chapterCount: `${item?.ebook?.chapterCount}` ?? 0,
          language: item?.ebook?.language ?? "",
          shareLink: { link: item?.ebook?.shareLink?.link ?? "", text: item?.ebook?.shareLink?.text ?? "" },

        }
      }),
      msg: `All My books fetched`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
// getmyBookspefic with chapter and its topics name,
Ebook.get("/getMyEbookById/:ebookId", ValidateTokenForWeb, async (req, res) => {
  const { ebookId } = req.params;
  if (!ebookId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required eBookId `
    })
  }
  try {
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not An User'
      })
    }

    const myBook = await myEbookTable.findOne({ user: user?._id, isActive: true, ebook: ebookId }).populate('ebook', '_id title banner description slug keyFeatures tags language chapterCount shareLink');
    if (!myBook) {
      return res.json({
        status: false,
        data: null,
        msg: `Not authorized to access`
      })
    }
    const chapterWithTopics = await chapterTable.aggregate([
      { $match: { ebook: mongoose.Types.ObjectId(ebookId), isActive: true } },
      // { $sort : { chapterNumber : -1 }} , 
      {
        $lookup:
        {
          from: 'topictables',
          foreignField: 'chapter',
          localField: '_id',
          as: 'topics'
        }
      },
      //    { $sort : { chapterNumber : 1 , 'topics.topicNumber' : 1  }} , 
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          chapterCount: 1,
          topics: 1
        }
      }
    ])

    return res.json({
      status: true,
      data: {
        title: myBook?.ebook?.title,
        // banner: await getSignUrl(myBook?.ebook?.banner),
        banner: myBook?.ebook?.banner,
        shareLink: { link: myBook?.ebook?.shareLink?.link ?? "", text: myBook?.ebook?.shareLink?.text ?? "" },
        description: myBook?.ebook?.description,
        language: myBook?.ebook?.language,
        keyFeatures: myBook?.ebook?.keyFeatures,
        tags: myBook?.ebook?.tags,
        chapterCount: `${myBook?.ebook?.chapterCount}`,
        chapterWithTopics: chapterWithTopics?.map((item) => {
          return {
            chapterId: item?._id,
            chapterTitle: item?.title,
            chapterDescription: item?.description,
            topics: item?.topics?.map((item2) => {
              return {
                topicId: item2?._id,
                topicTitle: item2?.title,
                details: { size: item2?.details?.fileSize ?? 0, name: item2?.details?.fileName ?? "" }
              }
            })
          }
        })
      },
      msg: ` My Ebook Details fetched  `
    })

  } catch (error) {
    // console.log(error)
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

Ebook.get("/getTopic", ValidateTokenForWeb, async (req, res) => {
  const { topicId, ebookId } = req.query;
  if (!topicId || !ebookId) {
    return res.json({
      status: false,
      data: null,
      msg: `Required topic Id ebookId`
    })
  }
  try {
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not An User'
      })
    }
    const isMyEbook = await myEbookTable.findOne({ isActive: true, user: user?._id, ebook: ebookId });
    if (!isMyEbook) {
      return res.json({
        status: false,
        data: null,
        msg: `Not Authorized to access`
      })
    }
    const topic = await topicTable.findOne({ _id: topicId });

    return res.json({
      status: true,
      data:
      {
        fileDetails: { fileUrl: await getSignUrl(topic?.details?.fileLoc), name: topic?.details?.fileName, size: topic?.details?.fileSize },
        title: topic?.title,
      }
      ,
      msg: `Topic Fetched`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


// getSpecficmybook chapter with including thier chapter 
//  getSpeficChapterTopics -- not required 
// getSepfictopicUrl
// postReview 
Ebook.post("/postReview", ValidateTokenForWeb, async (req, res) => {
  // const { id , slug  } = req.query;
  const { ebookId, ebookSlug, title, rating } = req.body;
  try {
    if (![1, 2, 3, 4, 5]?.includes(parseInt(rating))) {
      return res.json({
        status: false,
        data: null,
        msg: `Required rating`
      })
    }
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    let query = {
      isActive: true
    }
    if (ebookSlug && ebookSlug != "") {
      query.slug = ebookSlug
    } else if (ebookId && ebookId != "") {
      query._id = ebookId
    } else {
      return res.json({
        status: false,
        data: null,
        msg: `Required Ebook Id Or Slug `
      })
    }

    const isEbook = await ebookTable.findOne({ ...query });
    if (!isEbook) {
      return res.json({
        status: false,
        data: null,
        msg: `Ebook not found`
      })
    }
    const newReview = new ebookReviewTable({
      user: user?._id,
      ebook: isEbook?._id,
      rating,
      title
    })
    await newReview.save();
    return res.json({
      status: true,
      data: null,
      msg: `Review Sumbited `
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product not fetched`,
    });
  }
});

Ebook.get("/getEbookReviews", async (req, res) => {
  let { id, slug, page, pageSize } = req.query;
  try {
    // let query = {} ;
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 15;


    let book = {};
    if (!slug) {
      book = await ebookTable.findOne({ _id: id }).select('_id')
    } else {
      book = await ebookTable.findOne({ slug: slug }).select('_id')
    }
    if (!book?._id) {
      return res.json({
        status: false,
        data: null,
        msg: `Ebook not found`
      })

    }
    const allReviews = await ebookReviewTable.aggregate([
      {
        $facet: {
          reviews: [{
            $match: { ebook: book?._id },

          },
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


          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $sort: { "createdAt": -1 }
          }
          ],
          totalCounts: [
            { $match: { ebook: book?._id } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ]
        }
      },
      {
        $project: {
          reviews: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

        }
      }
    ])
    console.log(allReviews)
    let response = [];
    allReviews[0].reviews?.map((item) => {
      // console.log(item)
      if (item?.title != "") {
        let obj = {
          id: item?._id,
          title: item?.title,
          rating: item?.rating,
          reviewAt: moment(item?.createdAt).fromNow(),
          user: { name: item?.user?.FullName ?? "", profilePhoto: item?.user?.profilePhoto ?? "" }

        }
        response.push(obj);
      }
      // return {
      //    id : item?._id ,

      // }
    })


    return res.json({
      status: true,
      data: { reviews: response, totalCounts: allReviews[0]?.totalCounts?.count },
      msg: `Ebook Reviews fetched`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
// verify Coupon 


// Cashfree.XClientId = "TEST10165043e3f80d0b40f13f9c8fc234056101";
// Cashfree.XClientSecret = "cfsk_ma_test_c15401ff3c103f667499cdc62004b103_680b2673";
// Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

Cashfree.XClientId = "66129630ef184636105090a697692166";
Cashfree.XClientSecret = "cfsk_ma_prod_ba491010ea0edc8b930e3d3efcdf8e24_b9be4403";
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;


//  payment GateWay --> cashfree

Ebook.post("/ebook_initiate_payment", ValidateToken, async (req, res) => {
  const { ebookId, couponId, totalAmount } = req.body;
  // console.log(req.body);
  if (!totalAmount || !ebookId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required!, amount & ebookId"
    });
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decode?.studentId);
    if (!userDetails) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not An User'
      })
    }
    //   check already purchased or not 
    const isMyEbook = await myEbookTable.findOne({ user: userDetails?._id, ebook: ebookId });
    if (isMyEbook) {
      return res.json({
        status: false,
        data: null,
        msg: 'Already puchased'
      })
    }

    if (couponId) {
      const checkCouponId = await couponTable.findOne({ _id: couponId, is_active: true })
      if (!checkCouponId) {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code Not Exists"
        })
      }
    }
    // check amount with coupon discount and deliveryCharge
    let genOrderId = "0001";
    const latestOrder = await ebookOrderTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    const genTxnId = generateRandomTransactionId()
    const userNN = userDetails.FullName.replace(/\s/g, '');
    const userEmail = userDetails.email.replace(/\s/g, '');
    let date = new Date();
    // console.log(req.body);
    const ebookOrderObj = new ebookOrderTable({
      user: userDetails._id,
      orderId: genOrderId,
      ebookId,
      couponId,
      totalAmount,
      txnId: genTxnId,
      paymentStatus: 'pending',
      isPaid: false,
      purchaseDate: date
    })
    const saveOrder = await ebookOrderObj.save()
    const request = {
      "order_amount": totalAmount,
      "order_currency": "INR",
      "order_id": saveOrder?._id,
      "customer_details": {
        "customer_id": userDetails._id ?? "",
        "customer_name": userNN ?? "Admin",
        "customer_email": userEmail ?? "admin@sdempire.co.in",
        "customer_phone": userDetails?.mobileNumber ?? "9983904397"
      },
      "order_meta": {
        //   "return_url": `${process.env.STORE_BASE_URL}/ordersstatus/${saveOrder?._id}/${userDetails?._id}`
        "return_url": `https://www.sdcampus.com`
      }
    };
    // console.log(Cashfree);
    Cashfree.PGCreateOrder("2023-08-01", request).then(async (response) => {
      return res.json({
        status: true,
        data: {
          orderId: saveOrder?._id,
          orderAmount: response.data.order_amount,
          sessionId: response.data.payment_session_id,
          orderStatus: response.data.order_status
        },
        msg: "Order Created successfully"
      })
    }).catch((error) => {
      // console.error('Error:', error.response.data);
      return res.json({
        status: false,
        data: error.response.data,
        msg: error.response.data.message
      })
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

//verifyOrder
Ebook.post("/verify_ebook_payment", async (req, res) => {
  const { orderId } = req.query;
  if (!orderId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! orderId"
    });
  }
  try {
    Cashfree.PGFetchOrder("2022-09-01", orderId).then(async (response) => {
      // console.log('Order fetched successfully:', response.data?.order_status);
      if (response?.data?.order_status == 'PAID') {
        // invoice gennration
        const order = await ebookOrderTable.findOneAndUpdate({ _id: orderId }, { paymentStatus: 'success', isPaid: true }, { new: true, lean: true }).populate('ebookId', '_id title banner');
        // console.log(order?.ebookId)
        //   add into my Ebook if payment status true 
        const myBook = new myEbookTable({
          user: order?.user,
          ebook: order?.ebookId?._id,
          amount: order?.totalAmount,
          isActive: true
        })
        const saveBook = await myBook.save();
        let data2 = {
          title: order?.ebookId?.title,
          message: `${order?.ebookId?.title} added in your ebooks.`,
          fileUrl: order?.ebookId?.banner,
          route: "myebookbyid",
          rootId: `${order?.ebookId?._id}`,
          childId: ""
        };
        // console.log(data2 , order?.user);

        await sendCustomNotification([order?.user], data2);
        return res.json({
          status: true,
          data: order?.paymentStatus,
          msg: 'Your Ordered Succesfully '
        })
      } else {
        // consider other case like ACTIVE , EXPIRED , TERMINATED , TERMINATION_REQUESTED
        return res.json({
          status: false,
          data: null,
          msg: "Something Went Wrong"
        })
      }
    }).catch((error) => {
      // console.error('Error:', error.response.data.message);
      return res.json({
        status: false,
        data: error,
        msg: error?.response?.data?.message
      })
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});


Ebook.get("/getChapters/:ebookId", isAdmin, async (req, res) => {
  const { ebookId } = req.params;
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }

    const chapters = await chapterTable.find({ ebook: ebookId }).populate('admin', '_id FullName Role').sort({ chapterNumber: 1, createdAt: -1 });
    return res.json({
      status: true,
      data: chapters?.map((item, index) => {
        return {
          sno: index + 1,
          id: item?._id,
          admin: { name: item?.admin?.FullName ?? "NA", role: item?.admin?.Role ?? "NA" },
          title: item?.title,
          paid: item?.paid,
          isActive: item?.isActive,
          chapterNumber: item?.chapterNumber,
          topicCount: item?.topicCount,
          createdAt: moment(item.createdAt).format('DD-MM-YYYY')
        }
      }),
      msg: 'All chapter fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

Ebook.get("/getTopicsForAdmin/:chapterId", isAdmin, async (req, res) => {
  const { chapterId } = req.params;
  try {
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }

    const topic = await topicTable.find({ chapter: chapterId }).populate('admin', '_id FullName Role').sort({ topicNumber: 1, createdAt: -1 });
    return res.json({
      status: true,
      data: await Promise.all(topic?.map(async (item, index) => {
        return {
          sno: index + 1,
          id: item?._id,
          admin: { name: item?.admin?.FullName ?? "NA", role: item?.admin?.Role ?? "NA" },
          title: item?.title,
          fileDetails: { name: item?.details?.fileName, size: item?.details?.fileSize, url: await getSignUrl(item?.details?.fileLoc) },
          // paid: item?.isPaid,
          isActive: item?.isActive,
          topicNumber: item?.topicNumber,
          createdAt: moment(item.createdAt).format('DD-MM-YYYY')
        }
      })),
      msg: 'All Topic  fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


Ebook.post("/freeEbookPurchase", ValidateToken, async (req, res) => {
  const { ebookId } = req.query;
  if (!ebookId) {
    return res.json({
      status: false,
      data: null,
      msg: 'Ebook Required'
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decode?.studentId);
    if (!userDetails) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not An User'
      })
    }
    const ebook = await ebookTable.findOne({ _id: ebookId, salePrice: "0", regularPrice: '0', isPaid: false, isActive: true });
    if (!ebook) {
      return res.json({
        status: false,
        data: null,
        msg: 'Ebook not found'
      })
    }
    const isMyEbook = await myEbookTable.findOne({ user: userDetails?._id, ebook: ebookId });
    if (isMyEbook) {
      return res.json({
        status: false,
        data: null,
        msg: 'Already purchased'
      })
    }

    let genOrderId = "0001";
    const latestOrder = await ebookOrderTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    const genTxnId = generateRandomTransactionId()
    let date = new Date();
    // console.log(req.body);
    const ebookOrderObj = new ebookOrderTable({
      user: userDetails._id,
      orderId: genOrderId,
      ebookId: ebook?._id,
      couponId: null,
      totalAmount: 0,
      txnId: genTxnId,
      paymentStatus: 'success',
      isPaid: true,
      purchaseDate: date
    })
    const saveOrder = await ebookOrderObj.save();
    const myBook = new myEbookTable({
      user: saveOrder?.user,
      ebook: saveOrder?.ebookId,
      amount: saveOrder?.totalAmount,
      isActive: true
    })
    const saveBook = await myBook.save();
    return res.json({
      status: true,
      data: null,
      msg: `Purchased successfully`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

Ebook.post("/ebookAssign" , isAdmin , async(req , res) =>{
  const { ebookId , studentId , transactionId , expireDate , amount } = req.body ;
  if( !ebookId || !studentId || !transactionId || !expireDate || !amount){
    return res.json({
      status : false ,
      data : null ,
      msg : "Required ebookId  , studentId  ,transactionId , expireDate ,  amount"
    })
  }
  try{
    // check ebook exist or not 
    const ebookExist = await ebookTable.findOne({ _id : ebookId });
    if( !ebookExist){
      return res.json({
        status : false ,
        data : null ,
        msg : `Ebook not exist`
      })
    }
    // check already enrolled 
    const isAlreadyEnroll =  await myEbookTable.findOne({ ebook : ebookId , user : studentId});
    if( isAlreadyEnroll){
      return res.json({
        status : false ,
        data : null ,
        msg : 'Student Already Enrolled'
      })
    }

    // genrate ebookOrder
    let genOrderId = "0001";
    const latestOrder = await ebookOrderTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    // const genTxnId = generateRandomTransactionId()
    let date = new Date();
    // console.log(req.body);
    const ebookOrderObj = new ebookOrderTable({
      user: studentId,
      orderId: genOrderId,
      ebookId: ebookExist?._id,
      couponId: null,
      totalAmount: amount,
      txnId: transactionId,
      paymentStatus: 'success',
      isPaid: true,
      purchaseDate: date
    })
    const saveOrder = await ebookOrderObj.save();

     // add in myEbook with expire Date 
    const myBook = new myEbookTable({
      user: saveOrder?.user,
      ebook: saveOrder?.ebookId,
      amount: saveOrder?.totalAmount,
      isActive: true ,
      expireDate : new Date(expireDate)
    })
    const saveBook = await myBook.save();
    
    return res.json({
      status : true ,
      data : null ,
      msg : `Ebook Assign to student`
    })

  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg : error.message
    })
  }
})

Ebook.get("/getPaidStudentOfEbook/:ebookId" , isAdmin , async(req , res) =>{
  const { ebookId } = req.params ;
  if( !ebookId){
    return res.json({
      status : false ,
      data : null ,
      msg :  'Required EbookId'
    })
  }
  try{
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }
    const students =  await ebookOrderTable.find({ ebookId :  ebookId }).populate('user' , "_id FullName mobileNumber email profilePhoto username").populate("couponId" , "couponCode couponType couponValue")
    return res.json({
      status : true ,
      data :  await Promise.all( students?.map(async(item , index) =>{
        let myEbook =  await myEbookTable.findOne({ ebook :  item?.ebookId , user :  item?.user?._id}).select('expireDate isActive _id')
        return {
          expireDate : moment(myEbook.expireDate).format('DD-MM-YYYY') , 
          sno : index+1 ,
          id : item?._id ,
          user_id :  item?.user?._id , 
          namePhoto : { name : item?.user?.FullName ?? "" , profilePhoto : item?.user?.profilePhoto ?? "" } ,
          phone : item?.user?.mobileNumber ?? "" ,
          username : item?.user?.username ?? "" ,
          email : item?.user?.email ?? "" ,
          totalAmount : item?.totalAmount ?? 0,
          couponDetails :  {
            code :  item?.couponId?.couponCode ?? "" ,
            value :  item?.couponId?.couponValue ?? "" ,
            type :  item?.couponId?.couponType ?? "" ,
          } , 
          txnId : item?.txnId ?? "" ,
          createdAt : moment(item?.createdAt).format('DD-MM-YYYY') ,
          assignedAt : moment(item?.createdAt).format('DD-MM-YYYY'),
          myEbookId : myEbook?._id ,
          isActive : myEbook?.isActive ,
        }
      })),
      msg : 'Ebook Student Fetched'
    })
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg :  error.message
    })
  }
})

Ebook.put("/changeAccessOfStudentForEbook/:myEbookId" , isAdmin , async(req , res) =>{
  const { myEbookId } = req.params ;
  if( !myEbookId){
    return res.json({
      status : false ,
      data : null ,
      msg :  'Required My Ebook Id'
    })
  }
  try{
    const decode = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not A Admin'
      })
    }

    const isMyEbook = await myEbookTable.findOne({ _id : myEbookId});
    if( !isMyEbook){
      return res.json({
        status : false ,
        data : null ,
        msg : 'My Ebook not exist'
      })
    }
    
    let isActive = !isMyEbook.isActive ;
    await myEbookTable.findByIdAndUpdate({ _id :  isMyEbook?._id } , { isActive : isActive});
    return res.json({
      status : true ,
      data : null ,
      msg : `Status changed into ${isActive == true ? 'Active' : 'InActive'}`
    })

  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg :  error.message
    })
  }
})

module.exports = Ebook


