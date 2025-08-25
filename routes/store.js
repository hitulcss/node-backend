const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const xlsjs = require("xlsjs");
const moment = require("moment");
const { uploadFile } = require("../aws/UploadFile");
const {
  findAdminTeacherUsingUserId,
} = require("../HelperFunctions/adminTeacherFunctions");
const { getMostSaleProducts } = require('../HelperFunctions/storeFunction');
const { isAdmin, ValidateToken } = require("../middleware/authenticateToken");
const jwt = require("jsonwebtoken");

const { findUserByUserId } = require("../HelperFunctions/userFunctions");
const { savePanelEventLogs } = require("../HelperFunctions/storeLogs");
const { productCategoryTable } = require("../models/productCategory");
const { storeBannerTable } = require("../models/storeBanner");
const { storeFeatureVideosTable } = require("../models/storeFeatureVideos");
const { storeProductTable } = require("../models/storeProduct");
const { generateSlug } = require("../HelperFunctions/generateSlug");
const { productReviewsTable } = require("../models/productReviews");

const { storeCartTable } = require("../models/storeCart");
const { storeWishlistTable } = require("../models/storeWishlist");
const { storeUserAddressTable } = require("../models/storeUserAddress");
const { storeOrdesTable } = require("../models/storeOrders");
const { storeTxnTable } = require("../models/storePaymentTxn");
const { CartTable } = require("../models/cart");
const { storeAlertTable } = require("../models/storeAlert");
const apicache = require("apicache");
const { sendEmail } = require("../ContactUser/NodeMailer");
const { UserTable } = require("../models/userModel");
const { blogsTable } = require("../models/blog");
const { storeReturnTable } = require("../models/storeReturn");
const { Cashfree } = require('cashfree-pg');
const { userStoreLogsTable } = require("../models/userStoreLogs");
const { parentPort } = require("worker_threads");
const { recentViewedTable } = require("../models/recentView");
const { couponTable } = require("../models/Coupon");
// import apicache from 'apicache'
let cache = apicache.middleware


const store = express.Router();

const upload = multer({ dest: "uploads/storeRouter" });

async function ValidateTokenForWeb(req, res, next) {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (token) {
      try {
        const decodedData = jwt.verify(token, process.env.SECRET_KEY);
        req.userId = decodedData?.studentId;
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          req.userId = "";
        } else {
          throw error; // rethrow other errors
        }
      }
    } else {
      req.userId = "";
    }
    next();
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Something Went Wrong",
    });
  }
}

// Cashfree.XClientId = "TEST10165043e3f80d0b40f13f9c8fc234056101";
// Cashfree.XClientSecret = "cfsk_ma_test_c15401ff3c103f667499cdc62004b103_680b2673";
// Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

Cashfree.XClientId = "66129630ef184636105090a697692166";
Cashfree.XClientSecret = "cfsk_ma_prod_ba491010ea0edc8b930e3d3efcdf8e24_b9be4403";
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

// add store Product Category
store.post(
  "/addProductCategory",
  upload.single("file"),
  isAdmin,
  async (req, res) => {
    const { title, parentCategory, isActive, metaTitle, metaDesc } = req.body;
    try {
      const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails) {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not an admin",
        });
      }
      const cateSlug = await generateSlug(title);
      let fileLoc = [];
      if (req.file) {
        size = req.file.size / (1024);
        if (size > 100) {
          return res.json({
            status: false,
            data: null,
            msg: 'Maximum category icon size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
        const extension = "." + req.file.originalname.split(".").pop();
        FileUploadLocation = `productCategory/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
        let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        fileLoc.push(helperfileLoc);
      }
      const newProdCat = new productCategoryTable({
        admin: adminDetails?._id,
        title,
        slug: cateSlug,
        parentCategory: parentCategory ?? null,
        icon: fileLoc[0],
        isActive,
        metaTitle,
        metaDesc
      });
      const saveProdCat = await newProdCat.save();
      return res.json({
        status: true,
        data: saveProdCat,
        msg: `New Product Category added successfully.`,
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Product Category not Added`,
      });
    }
  }
);

store.post("/categoryOrder/:id", isAdmin, async (req, res) => {
  const { id } = req.params
  const { order } = req.body;
  if (!id || !order) {
    return res.json({
      status: false,
      data: null,
      msg: "Required id & order!"
    })
  }
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.status(401).json({
        status: false,
        data: null,
        msg: err,
      });
    } else {
      const admin = await findAdminTeacherUsingUserId(
        Data.studentId
      );
      if (!admin) {
        return res.json({
          status: false,
          data: null,
          msg: "Invalid Access"
        })
      }
      const category = await productCategoryTable.findOne({ _id: id });
      if (!category) {
        return res.json({
          status: false,
          data: null,
          msg: "category Not Exists"
        })
      }

      const orderExist = await productCategoryTable.findOne({ order: order });
      if (orderExist) {
        return res.json({
          status: false,
          data: null,
          msg: ' this order already exist'
        })
      }
      const allCategory = await productCategoryTable.find({});
      if (order > allCategory.length) {
        return res.json({
          status: false,
          data: null,
          msg: "order greater than number of total category"
        })
      }
      await productCategoryTable.findByIdAndUpdate({ _id: category._id }, {
        order
      })
      return res.json({
        status: true,
        data: { order },
        msg: `${catgeory.title} batch order chnaged ${order}.`
      })

    }
  });
})
// get All for store
store.get("/getAllProductCategory", async (req, res) => {
  try {
    const allProdCat = await productCategoryTable
      .find({ isActive: true, parentCategory: { $eq: null } })
      .sort({ order: 1 })
      .collation({ locale: "en_US", numericOrdering: true });

    if (allProdCat) {
      const result = await Promise.all(allProdCat.map(async (item) => {
        const childCategories = await productCategoryTable.find({
          isActive: true,
          parentCategory: item._id
        }).sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });

        return {
          id: item._id ?? "",
          title: item.title ?? "",
          icon: item.icon ?? "",
          slug: item.slug ?? "",
          metaTitle: item?.metaTitle ?? "",
          shareLink: { link: item?.shareLink?.link ?? "", text: item?.shareLink?.text ?? "" },
          childCat: childCategories?.map(child => ({
            id: child._id ?? "",
            title: child.title ?? "",
            icon: child.icon ?? "",
            slug: child.slug ?? "",
            metaTitle: item?.metaTitle ?? ""
          })) ?? []
        };
      }));

      return res.json({
        status: true,
        data: result,
        msg: `All Product Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product Category not fetched`,
    });
  }
});

// getSub Category 
store.get("/getAllProductSubCategory", async (req, res) => {
  try {
    const allProdCat = await productCategoryTable
      .find({ isActive: true, parentCategory: { $ne: null } })
      .populate("parentCategory", "_id title icon").sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    if (allProdCat) {
      return res.json({
        status: true,
        data: allProdCat.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            // icon: item.icon ?? "",
            slug: item.slug ?? "",
          };
        }),
        msg: `All Product Sub Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product Sub Category not fetched`,
    });
  }
});

store.get("/getProductSubCatByCategoryId/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required Id'
    })
  }
  try {
    const isCategory = await productCategoryTable.findOne({ _id: id });
    if (!isCategory) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent Category not exists`
      })
    }
    const allProdCat = await productCategoryTable
      .find({ isActive: true, parentCategory: isCategory._id })
      .populate("parentCategory", "_id title icon").sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    if (allProdCat) {
      return res.json({
        status: true,
        data: allProdCat.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            // icon: item.icon ?? "",
            slug: item.slug ?? "",
          };
        }),
        msg: `All Product Sub Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product Sub Category not fetched`,
    });
  }
});

store.get("/getProductSubCatByCategorySlug/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required slug'
    })
  }
  try {
    const isCategory = await productCategoryTable.findOne({ slug: slug });
    if (!isCategory) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent Category not exists`
      })
    }
    const allProdCat = await productCategoryTable
      .find({ isActive: true, parentCategory: isCategory._id })
      .populate("parentCategory", "_id title slug icon").sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    if (allProdCat) {
      return res.json({
        status: true,
        data: allProdCat.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            // icon: item.icon ?? "",
            parentCategory: { id: item?.parentCategory?._id ?? "", title: item?.parentCategory?.title ?? "", slug: item?.parentCategory?.slug ?? "" },
            slug: item.slug ?? "",
          };
        }),
        msg: `All Product Sub Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product Sub Category not fetched`,
    });
  }
});

store.get("/getProductCatWithAllSubCatByCategorySlug/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.json({
      status: false,
      data: null,
      msg: 'Required slug'
    })
  }
  try {
    const isCategory = await productCategoryTable.findOne({ slug: slug });
    if (!isCategory) {
      return res.json({
        status: false,
        data: null,
        msg: `Parent Category not exists`
      })
    }
    const allProdCat = await productCategoryTable
      .find({ isActive: true, parentCategory: isCategory._id })
      .populate("parentCategory", "_id title icon").sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    if (allProdCat) {
      return res.json({
        status: true,
        data: {
          category: { id: isCategory?._id, title: isCategory?.title, slug: isCategory?.slug, metaTitle: isCategory?.metaTitle ?? "", metaDesc: isCategory?.metaDesc ?? "" },
          subCategories: allProdCat.map((item) => {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              // icon: item.icon ?? "",
              slug: item.slug ?? "",
              metaTitle: item?.metaTitle ?? "",
              metaDesc: item?.metaDesc ?? ""
            };
          })
        },
        msg: `All Product Sub Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product Sub Category not fetched`,
    });
  }
});
// getAll for Admin
// get one by id for Admin
//getAllProductCategoryAdmin

store.get("/getAllStoreProductCategory", isAdmin, async (req, res) => {
  try {
    const allProdCat = await productCategoryTable
      .find({})
      .populate('admin', "_id FullName Role")
      .populate("parentCategory", "_id title icon slug").sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    if (allProdCat) {
      return res.json({
        status: true,
        data: allProdCat.map((item) => {
          return {
            _id: item._id ?? "",
            id: item._id ?? "",
            value: item?._id ?? "",
            label: item?.title ?? "",
            title: item.title ?? "",
            url: !item?.parentCategory ? `${process.env.STORE_BASE_URL}/c/${item?.slug}` : `${process.env.STORE_BASE_URL}/c/${item?.parentCategory?.slug}/${item?.slug}`,
            slug: item.slug ?? "",
            icon: item.icon ?? "",
            isActive: item.isActive ?? "",
            shareLink: { link: item?.shareLink?.link ?? "", text: item?.shareLink?.text ?? "" },
            order: item.order ?? "",
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            parentCategory: {
              id: item?.parentCategory?._id ?? "",
              title: item?.parentCategory?.title ?? "",
              icon: item?.parentCategory?.icon ?? "",
              slug: item?.parentCategory?.slug ?? "",
            },
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
            updatedAt:
              `${moment(item.updatedAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        }),
        msg: `All Product Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Product Category not fetched",
    });
  }
});

store.get("/getAllStoreParentCategory", isAdmin, async (req, res) => {
  try {
    const allProdCat = await productCategoryTable
      .find({ parentCategory: null })
    // console.log(allProdCat.length);
    if (allProdCat) {
      return res.json({
        status: true,
        data: allProdCat.map((item) => {
          return {
            _id: item._id ?? "",
            id: item._id ?? "",
            title: item.title ?? "",
            slug: item.slug ?? "",
            icon: item.icon ?? "",
            isActive: item.isActive ?? "",
            // parentCategory: {
            //   id: item?.parentCategory?._id ?? "",
            //   title: item?.parentCategory?.title ?? "",
            //   icon: item?.parentCategory?.icon ?? "",
            // },
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
            updatedAt:
              `${moment(item.updatedAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        }),
        msg: `All Parent Category fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Parent Category not fetched",
    });
  }
});

// get productby id to the admin
store.get("/getProductCategoryByIdAdmin/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: "Product category ID not provided",
      });
    }
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }

    const prodCat = await productCategoryTable
      .findById(id)
      .populate("parentCategory", "_id title icon");
    if (!prodCat) {
      return res.json({
        status: false,
        data: null,
        msg: "Product category not found",
      });
    }

    return res.json({
      status: true,
      data: {
        id: prodCat._id ?? "",
        title: prodCat.title ?? "",
        slug: prodCat.slug ?? "",
        icon: prodCat.icon ?? "",
        isActive: prodCat.isActive ?? "",
        order: prodCat.order ?? "",
        metaTitle: prodCat?.metaTitle ?? "",
        metaDesc: prodCat?.metaDesc ?? "",
        parentCategory: {
          id: prodCat?.parentCategory?._id ?? "",
          title: prodCat?.parentCategory?.title ?? "",
          icon: prodCat?.parentCategory?.icon ?? "",
        },
        createdAt:
          `${moment(prodCat.createdAt)
            .add(5, "hours")
            .add(30, "minutes")
            .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        updatedAt:
          `${moment(prodCat.updatedAt)
            .add(5, "hours")
            .add(30, "minutes")
            .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
      },
      msg: `Product Category  fetched successfully.`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Error fetching Product Category",
    });
  }
});

// edit of ProductCatgeory
store.put(
  "/updateProductCategory/:id",
  upload.single("file"),
  isAdmin,
  async (req, res) => {
    let { title, parentCategory, isActive, order, slug, metaTitle, metaDesc } = req.body;
    const { id } = req.params;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: `ProductCatgeory id not found`,
      });
    }
    try {

      const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails) {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not an admin",
        });
      }
      const regex = /^[A-Za-z0-9\s\-]+$/;
      let isValid = regex.test(slug);
      // console.log(slug);
      if (slug && !isValid) {
        return res.json({
          status: false,
          data: null,
          msg: 'Slug can contain only characters & number '
        })
      }

      const isExistSlug = await productCategoryTable.findOne({ _id: { $ne: id }, slug: slug });
      if (isExistSlug) {
        return res.json({
          status: false,
          data: null,
          msg: "Category Slug already exist"
        })
      }
      const proCat = await productCategoryTable.findOne({ _id: id });
      if (!proCat) {
        return res.json({
          status: false,
          data: null,
          msg: `Product Category not found`,
        });
      }
      if (title) {
        // not case Sensitive
        const isExist = await productCategoryTable.findOne({ _id: { $ne: id }, title });
        if (isExist) {
          return res.json({
            status: false,
            data: null,
            msg: `Product Category title already exists.`,
          });
        }
      }
      if (!["", null, undefined]?.includes(order)) {
        const orderExist = await productCategoryTable.findOne({ _id: { $ne: proCat._id }, order: order });
        if (orderExist) {
          return res.json({
            status: false,
            data: null,
            msg: ' this order already exist'
          })
        }
      }

      // const cateSlug = title ? await generateSlug(title) : proCat.slug;
      // title = title ? title : proCat.title;
      let cateSlug = await generateSlug(slug);
      let icon = "";
      if (parentCategory == 'null') {
        if (req.file) {
          // <----------- Delete from S3 Existing one ----------->
          let size = req.file.size / (1024);
          if (size > 100) {
            return res.json({
              status: false,
              data: null,
              msg: 'Maximum category icon size 100KB allowed'
            })
          }
          const helperString = Math.floor(Date.now() / 1000);
          const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension = "." + req.file.originalname.split(".").pop();
          FileUploadLocation = `productCategory/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
          let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
          icon = helperfileLoc;
          // console.log(icon);
        } else {
          if (proCat?.icon == '') {
            return res.json({
              status: false,
              data: null,
              msg: `Please Select Category icon`
            })
          } else {
            icon = proCat?.icon;
          }

        }
      }

      const updatedCat = await productCategoryTable.findByIdAndUpdate(
        id,
        {
          title: title,
          icon: icon,
          parentCategory: parentCategory == 'null' ? null : parentCategory,
          slug: cateSlug,
          order: order,
          isActive: isActive,
          metaTitle,
          metaDesc,
        },
        { new: true, lean: true }
      );
      return res.json({
        status: true,
        data: updatedCat,
        msg: `Product Category updated successfully.`,
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Product Category not Added`,
      });
    }
  }
);
// delete of product Category
store.delete("/deleteProductCategory/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `ProductCatgeory id not found`,
    });
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const isCategoryAssociated = await storeProductTable.find({ categories: { $in: id } });
    if (isCategoryAssociated && isCategoryAssociated?.length > 0) {
      return res.json({
        status: false,
        data: null,
        msg: 'This Category Associated with products.'
      })
    }
    const data = await productCategoryTable.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        data: null,
        msg: "Product Category not found",
      });
    }
    await savePanelEventLogs(
      adminDetails?._id,
      "deleteProductCategory",
      "delete",
      data
    )

    res.json({
      status: true,
      data: data,
      msg: "Product Category deleted",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Category not deleted",
    });
  }
});
// < -----Store Banner ---->
// add
store.post(
  "/addStoreBanner",
  upload.single("file"),
  isAdmin,
  async (req, res) => {
    const { title, bannerType, link, linkWith, isActive } = req.body;
    try {
      const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails) {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not an admin",
        });
      }
      let fileLoc = [];
      if (req.file) {
        let size = req.file.size / (1024);
        if (size > 150) {
          return res.json({
            status: false,
            data: null,
            msg: 'Maximum banner size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = req.file.originalname.split(".")[0].replace(/\s+/g, '_');
        const extension = "." + req.file.originalname.split(".").pop();
        FileUploadLocation = `storeBanner/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
        let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        fileLoc.push(helperfileLoc);
      }
      const newBanner = new storeBannerTable({
        admin: adminDetails?._id,
        title,
        icon: fileLoc[0],
        bannerType,
        link: link ?? "none",
        linkWith: linkWith ?? "",
        isActive,
      });
      const saveBanner = await newBanner.save();
      return res.json({
        status: true,
        data: saveBanner,
        msg: `New Store Banner added successfully.`,
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Store Banner not Added`,
      });
    }
  }
);


// getAll
store.get("/getAllStoreBanner", async (req, res) => {
  const { bannerType, category } = req.query;
  let query = {
    isActive: true,
  };
  if (bannerType) {
    query.bannerType = bannerType;
  }
  if (!['', null, undefined].includes(category)) {
    query.linkWith = category;
    query.link = 'category';
  }
  try {
    const allBanner = await storeBannerTable.find(query).sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    // linkWith population pending
    if (allBanner) {
      let responseData = await Promise.all(
        allBanner.map(async (item) => {
          if (item.link == "product") {
            const product = await storeProductTable.findById(item.linkWith);
            if (!product) {
              return {
                id: item._id ?? "",
                title: item.title ?? "",
                icon: item.icon ?? "",
                bannerType: item.bannerType ?? "",
                order: item.order ?? "",
                link: item.link ?? "None",
                linkWith: { id: "NA", title: "NA", slug: "NA" },
              };
            }
            return {
              id: item._id ?? "",
              // title: item.title ?? "",
              icon: item.icon ?? "",
              bannerType: item.bannerType ?? "",
              link: item.link ?? "None",
              order: item.order ?? "",
              linkWith: {
                id: product._id ?? "NA",
                title: product.title ?? "NA",
                slug: product.slug ?? "NA"
              },
            };
          } else if (item.link == "category") {
            const category = await productCategoryTable.findOne({
              _id: item.linkWith,
            });
            if (!category) {
              return {
                id: item._id ?? "",
                title: item.title ?? "",
                icon: item.icon ?? "",
                order: item.order ?? "",
                bannerType: item.bannerType ?? "",
                link: item.link ?? "None",
                linkWith: { id: "NA", title: "NA", slug: "NA" },
              };
            }
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              icon: item.icon ?? "",
              order: item.order ?? "",
              bannerType: item.bannerType ?? "",
              link: item.link ?? "None",
              linkWith: {
                id: category._id ?? "NA",
                title: category.title ?? "NA",
                slug: category.slug ?? "NA"
              },

            };
          } else if (item.link === 'link') {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              icon: item.icon ?? "",
              order: item.order ?? "",
              bannerType: item.bannerType ?? "",
              link: item.link ?? "None",
              linkWith: {
                id: item.linkWith ?? "NA",
                title: item.linkWith ?? "NA",
                slug: item.linkWith ?? "NA"
              },
            };

          }
          else {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              icon: item.icon ?? "",
              order: item.order ?? "",
              bannerType: item.bannerType ?? "",
              link: item.link ?? "None",
              linkWith: { id: "NA", title: "NA", slug: "NA" },
            };
          }
        })
      );
      if (responseData) {
        return res.json({
          status: true,
          data: responseData,
          msg: "Banner fetched.",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store Banner not fetched`,
    });
  }
});

// getAll for admin
// get one by Id for admin
// edit for admin
store.put(
  "/updateStoreBanner/:id",
  upload.single("file"),
  isAdmin,
  async (req, res) => {
    let { title, bannerType, link, linkWith, isActive, order } = req.body;
    const { id } = req.params;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: `Store Banner id not found`,
      });
    }
    try {
      if (
        typeof link != "undefined" &&
        link !== "none" &&
        (linkWith == "" ||
          linkWith == "NA" ||
          linkWith == "none" ||
          typeof linkWith == "undefined")
      ) {
        return res.json({
          status: false,
          data: null,
          msg: "Please select linkWith also!",
        });
      }
      const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails) {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not an admin",
        });
      }
      const banner = await storeBannerTable.findOne({ _id: id });
      if (!banner) {
        return res.json({
          status: false,
          data: null,
          msg: `Store Banner not found`,
        });
      }
      if (link == 'product') {
        const isProduct = await storeProductTable.findOne({ _id: linkWith });
        if (!isProduct) {
          return res.json({
            status: false,
            data: null,
            msg: `Please provide correct product`
          })
        }
      }
      if (link == 'category') {
        const isCategory = await productCategoryTable.findOne({ _id: linkWith });
        if (!isCategory) {
          return res.json({
            status: false,
            data: null,
            msg: `Please provide correct category`
          })
        }
      }

      title = title ? title : banner.title;
      // const orderExist = await storeBannerTable.findOne({ _id: { $ne: id }, order: order });
      // if (orderExist) {
      //   return res.json({
      //     status: false,
      //     data: null,
      //     msg: ' this order already exist'
      //   })
      // }
      let icon;
      if (req.file) {
        // <----------- Delete from S3 Existing one ----------->
        let size = req.file.size / (1024);
        if (size > 100) {
          return res.json({
            status: false,
            data: null,
            msg: 'Maximum banner size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
        const extension = "." + req.file.originalname.split(".").pop();
        FileUploadLocation = `productBanner/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
        let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        icon = helperfileLoc;
      } else {
        icon = banner?.icon;
      }
      // console.log(bannerType);
      const updatedBan = await storeBannerTable.findByIdAndUpdate(
        id,
        {
          title: title ? title : banner.title,
          icon,
          bannerType: bannerType ? bannerType : banner.bannerType,
          link: link,
          order: order ?? 0,
          linkWith: linkWith,
          isActive: isActive ? isActive : banner.isActive,
        },
        { new: true, lean: true }
      );
      return res.json({
        status: true,
        data: updatedBan,
        msg: `Store Banner updated successfully.`,
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Store Banner not updated`,
      });
    }
  }
);
// delete for Admin
store.delete("/deleteStoreBanner/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Store Banner id not found`,
    });
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
    const data = await storeBannerTable.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        data: null,
        msg: "Store Banner not found",
      });
    }
    await savePanelEventLogs(
      adminDetails?._id,
      "deleteStoreBanner",
      "delete",
      data
    )

    res.json({
      status: true,
      data: data,
      msg: "Store Banner deleted",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Store banner not deleted",
    });
  }
});
//get all storeBaneer for admin
store.get("/getAllStoreBannerAdmin", isAdmin, async (req, res) => {
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
    const allBanner = await storeBannerTable.find({}).populate("admin", "_id FullName Role").sort({ order: 1 }).collation({ locale: "en_US", numericOrdering: true });
    if (allBanner) {
      let responseData = await Promise.all(
        allBanner.map(async (item) => {
          let link = "";
          let linkWith = { id: "NA", title: "NA" }
          if (item.link == "product") {
            const product = await storeProductTable.findOne({ _id: item.linkWith });
            if (!product) {
              link = item.link ?? "none"
              linkWith = { id: "NA", title: "NA" }
            }
            link = item.link ?? "none",
              linkWith = { id: product?._id ?? "", title: product?.title ?? "" }
          } else if (item.link == "category") {
            const category = await productCategoryTable.findOne({ _id: item.linkWith })
            if (!category) {
              link = item.link ?? "none"
              linkWith = { id: "NA", title: "NA" }
            }
            link = item.link ?? "none"
            linkWith = { id: category?._id ?? "", title: category?.title ?? "" }
          } else if (item.link == 'link') {
            link = item.link ?? "none"
            linkWith = { id: item.linkWith, title: item.linkWith }
          }
          else {
            link = item.link ?? "none"
            linkWith = { id: "NA", title: "NA" }
          }
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            icon: item.icon ?? "",
            order: item.order ?? "",
            bannerType: item.bannerType ?? "",
            link: link,
            linkWith: linkWith,
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            isActive: item.isActive ?? "",
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
            updatedAt:
              `${moment(item.updatedAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        })
      );
      if (responseData) {
        return res.json({
          status: true,
          data: responseData,
          msg: "Banner fetched.",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store Banner not fetched`,
    });
  }
});
//get all storeBaneerBy Id for admin
store.get("/getStoreBannerByIdAdmin/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: "store banner not found",
      });
    }
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const item = await storeBannerTable.findById(id);

    if (item) {
      let link = "";
      let linkWith = { id: "NA", title: "NA" }
      if (item.link == "product") {
        const product = await storeProductTable.findOne({ _id: item.linkWith });
        if (!product) {
          link = item.link ?? "none"
          linkWith = { id: "NA", title: "NA" }
        }
        link = item.link ?? "none",
          linkWith = { id: product?._id ?? "", title: product?.title ?? "" }
      } else if (item.link == "category") {
        const category = await productCategoryTable.findOne({ _id: item.linkWith })
        if (!category) {
          link = item.link ?? "none"
          linkWith = { id: "NA", title: "NA" }
        }
        link = item.link ?? "none"
        linkWith = { id: category?._id ?? "", title: category?.title ?? "" }
      } else if (item.link == 'link') {
        link = item.link ?? "none"
        linkWith = { id: item?.linkWith, title: item?.linkWith }
      }
      else {
        link = item.link ?? "none"
        linkWith = { id: "NA", title: "NA" }
      }

      return res.json({
        status: true,
        data: {
          id: item._id ?? "",
          title: item.title ?? "",
          icon: item.icon ?? "",
          order: item.order ?? "",
          bannerType: item.bannerType ?? "",
          link: link,
          linkWith: linkWith,
          isActive: item.isActive ?? "",
          createdAt:
            `${moment(item.createdAt)
              .add(5, "hours")
              .add(30, "minutes")
              .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          updatedAt:
            `${moment(item.updatedAt)
              .add(5, "hours")
              .add(30, "minutes")
              .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: `Store Banner  fetched successfully.`,
      });
    }
    else {
      return res.json({
        status: false,
        data: null,
        msg: `Store Banner  not found.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Error fetching Store Banner by ID`,
    });
  }
});
// < ------ Store FeatureVideo ----- >
// add
store.post(
  "/addFeatureVideo",
  upload.fields([
    {
      name: "icon",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  isAdmin,
  async (req, res) => {
    const { title, videoType, isActive, url } = req.body;
    // if video - upload the case not handled
    try {
      const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails) {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not an admin",
        });
      }
      let fileLoc = [];
      let DemoVideoLoc;
      if (req.files) {
        if (req.files.icon) {
          const helperString = Math.floor(Date.now() / 1000);
          const filename = req.files.icon[0].originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension =
            "." + req.files.icon[0].originalname.split(".").pop();
          FileUploadLocation = `storeFeatureVideos/icon/${filename}_${helperString}${extension}`;
          let fileLocHelper = await uploadFile(
            req.files.icon[0].path,
            FileUploadLocation
          );

          fileLoc = {
            fileLoc: fileLocHelper,
            fileName: filename,
            fileSize: `${(req.files.icon.size / 1000000).toFixed(2)} MB`,
          };
        }
        if (req.files.video && videoType == "upload") {
          // for (let j = 0; j < req.files.answerTemplate.length; j++) {
          // console.log(req.files.demoVideo[j].originalname);
          const helperString1 = Math.floor(Date.now() / 1000);
          const filename1 = req.files.video[0].originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension1 =
            "." + req.files.video[0].originalname.split(".").pop();
          DemoVideoUploadLocation = `storeFeatureVideos/uploads/${filename1}_${helperString1}${extension1}`;
          let fileLocHelper1 = await uploadFile(
            req.files.video[0].path,
            DemoVideoUploadLocation
          );
          // console.log(fileLocHelper1)

          let helperDemoVideoLoc = {
            fileLoc: fileLocHelper1,
            fileName: filename1,
            fileSize: `${(req.files.video[0].size / 1000000).toFixed(2)} MB`,
          };
          DemoVideoLoc = helperDemoVideoLoc;
          // }
        }
      }

      const newFeatureVid = new storeFeatureVideosTable({
        admin: adminDetails._id,
        title,
        videoType,
        isActive,
        icon: fileLoc?.fileLoc ?? "",
        url: DemoVideoLoc ? DemoVideoLoc?.fileLoc : url ? url : "",
      });

      const saveFeatureVid = await newFeatureVid.save();
      return res.json({
        status: true,
        data: saveFeatureVid,
        msg: "New featured video added",
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Featured vide not Added`,
      });
    }
  }
);
// get
store.get("/getAllFeatureVideo", async (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit) || 10;
  try {
    const allVideo = await storeFeatureVideosTable
      .find({ isActive: true })
      .limit(n);
    if (allVideo) {
      return res.json({
        status: true,
        data: allVideo.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            icon: item.icon ?? "",
            videoType: item.videoType ?? "",
            url: item.url ?? "",
          };
        }),
        msg: "All Feature video Fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Feature video not fetched`,
    });
  }
});

//getAll video feature to the admin
store.get("/getAllFeatureVideoAdmin", isAdmin, async (req, res) => {
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
    const allVideo = await storeFeatureVideosTable.find({}).populate("admin", "_id FullName Role");
    if (allVideo) {
      return res.json({
        status: true,
        data: allVideo.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            icon: item.icon ?? "",
            videoType: item.videoType ?? "",
            url: item.url ?? "",
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            isActive: item.isActive ?? "",
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
            updatedAt:
              `${moment(item.updatedAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        }),
        msg: "All Feature video Fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Feature video not fetched`,
    });
  }
});

// Get a specific feature video by ID
store.get("/getFeatureVideoByIdAdmin/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: "Feature video is not found",
      });
    }
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const featureVideo = await storeFeatureVideosTable.findById(id);
    if (featureVideo) {
      return res.json({
        status: true,
        data: {
          id: featureVideo._id ?? "",
          title: featureVideo.title ?? "",
          icon: featureVideo.icon ?? "",
          videoType: featureVideo.videoType ?? "",
          url: featureVideo.url ?? "",
          isActive: featureVideo.isActive ?? "",
          createdAt:
            `${moment(featureVideo.createdAt)
              .add(5, "hours")
              .add(30, "minutes")
              .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          updatedAt:
            `${moment(featureVideo.updatedAt)
              .add(5, "hours")
              .add(30, "minutes")
              .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: `Feature video fetched successfully.`,
      });
    } else {
      return res.json({
        status: false,
        data: null,
        msg: `Feature video  not found.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Error fetching Feature video by ID`,
    });
  }
});
//  edit by admin
store.put(
  "/updateFeatureVideo/:id",
  upload.fields([
    {
      name: "icon",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  isAdmin,
  async (req, res) => {
    const { title, videoType, isActive, url } = req.body;
    const { id } = req.params;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: `Store Banner id not found`,
      });
    }
    try {
      const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails) {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not an admin",
        });
      }
      const feature = await storeFeatureVideosTable.findOne({ _id: id });
      if (!feature) {
        return res.json({
          status: false,
          data: null,
          msg: `Feature Video not found.`,
        });
      }
      let fileLoc;
      let DemoVideoLoc;
      if (req.files) {
        if (req.files.icon) {
          const helperString = Math.floor(Date.now() / 1000);
          const filename = req.files.icon[0].originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension =
            "." + req.files.icon[0].originalname.split(".").pop();
          FileUploadLocation = `storeFeatureVideos/icon/${filename}_${helperString}${extension}`;
          let fileLocHelper = await uploadFile(
            req.files.icon[0].path,
            FileUploadLocation
          );

          // fileLoc = {
          //   fileLoc: fileLocHelper,
          //   fileName: filename,
          //   fileSize: `${(
          //     req.files.icon.size / 1000000
          //   ).toFixed(2)} MB`,
          fileLoc = fileLocHelper;
        } else {
          fileLoc = feature.icon;
        }
        if (req.files.video && videoType == "upload") {
          // for (let j = 0; j < req.files.answerTemplate.length; j++) {
          // console.log(req.files.demoVideo[j].originalname);
          const helperString1 = Math.floor(Date.now() / 1000);
          const filename1 = req.files.video[0].originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension1 =
            "." + req.files.video[0].originalname.split(".").pop();
          DemoVideoUploadLocation = `storeFeatureVideos/uploads/${filename1}_${helperString1}${extension1}`;
          let fileLocHelper1 = await uploadFile(
            req.files.video[0].path,
            DemoVideoUploadLocation
          );
          // console.log(fileLocHelper1)

          let helperDemoVideoLoc = {
            fileLoc: fileLocHelper1,
            fileName: filename1,
            fileSize: `${(req.files.video[0].size / 1000000).toFixed(2)} MB`,
          };
          DemoVideoLoc = helperDemoVideoLoc;
        } else {
          DemoVideoLoc = feature.url;
        }
      }

      const newFeatureVid = await storeFeatureVideosTable.findByIdAndUpdate(
        feature.id,
        {
          title: title ? title : feature.title,
          videoType: videoType ? videoType : feature.videoType,
          isActive: isActive ? isActive : feature.isActive,
          icon: fileLoc ?? "",
          url: DemoVideoLoc ? DemoVideoLoc?.fileLoc : url ? url : "",
        },
        { new: true, lean: true }
      );

      return res.json({
        status: true,
        data: newFeatureVid,
        msg: "New featured video added",
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Featured vide not Added`,
      });
    }
  }
);
// delete for admin
store.delete("/deleteFeatureVideo/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `FeatureVideo id not found`,
    });
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const data = await storeFeatureVideosTable.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        data: null,
        msg: "Feature Video not found",
      });
    }
    await savePanelEventLogs(
      adminDetails?._id,
      "deleteFeaturedVideo",
      "delete",
      data
    )

    res.json({
      status: true,
      data: data,
      msg: "Feature Video deleted",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "FeatureVideo not deleted",
    });
  }
});

// <------- New Store Product ------->
store.post(
  "/addStoreProduct",
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    const {
      title,
      category,
      tags,
      code,
      desc,
      badge,
      categories,
      language,
      isActive,
      featuredImage,
    } = req.body;
    try {
      // console.log(categories);
      if ([[], undefined, null, '']?.includes(categories)) {
        return res.json({
          status: false,
          data: null,
          msg: 'Please Select Categories of Product'
        })
      }
      if (!["NEW ARRIVAL", "TOP TRENDING", "PRICE DROP", "FREEDOM SALE"]?.includes(badge.trim())) {
        return res.json({
          status: false,
          data: null,
          msg: 'Please Select Correct badge'
        })
      }
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
        let size = req.file.size / (1024);
        if (size > 100) {
          return res.json({
            status: false,
            data: null,
            msg: 'Maximum Image size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
        const extension = "." + req.file.originalname.split(".").pop();
        FileUploadLocation = `storeProduct/productGallery/${filename}_${helperString}${extension}`;
        let fileLocHelper = await uploadFile(req.file.path, FileUploadLocation);
        fileUrl = fileLocHelper;
      } else {
        fileUrl = featuredImage;
      }
      const slug = await generateSlug(title);
      const isExist = await storeProductTable.findOne({ code: code });
      if (isExist) {
        return res.json({
          status: false,
          data: null,
          msg: 'This is code already exist'
        })
      }
      let categoriesId = categories?.filter(item => item != "");
      const newProduct = new storeProductTable({
        admin: adminDetails._id,
        title,
        category,
        slug,
        featuredImage: fileUrl,
        tags,
        code,
        desc,
        badge: badge.trim(),
        language,
        isActive,
        categories: categoriesId
      });
      const saveProduct = await newProduct.save();
      return res.json({
        status: true,
        data: saveProduct,
        msg: " New Product added successfully",
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Product not added`,
      });
    }
  }
);


store.post("/addStoreProductSecond/:id", upload.single("file"), isAdmin, async (req, res) => {
  const { id } = req.params;
  const { productType, groupedProduct, deliveryType, keyFeature, inStock, maxPurchaseQty, marketingCat, publication } =
    req.body;
  // console.log(req.body);
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
  }
  if (
    productType == "grouped" &&
    (!groupedProduct || groupedProduct.length == 0)
  ) {
    return res.json({
      status: false,
      data: null,
      msg: "Please add product for grouped",
    });
  }
  if (parseInt(inStock) < parseInt(maxPurchaseQty)) {
    return res.json({
      status: false,
      data: null,
      msg: "Max Purchase qty always less than inStock",
    });
  }
  if (parseInt(inStock) < 0 || isNaN(inStock)) {
    return res.json({
      status: false,
      data: null,
      msg: "In Stock always positive number",
    });
  }
  if (parseInt(maxPurchaseQty) < 0 || isNaN(maxPurchaseQty)) {
    // console.log()
    console.log(isNaN(maxPurchaseQty), parseInt(maxPurchaseQty))
    return res.json({
      status: false,
      data: null,
      msg: "Max Purchase always positive number",
    });
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
    const isExist = await storeProductTable.findOne({ _id: id });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: "Product not found",
      });
    }
    let fileUrl = '';
    if (req.file) {
      let size = req.file.size / (1024 * 1024);
      if (size > 10) {
        return res.json({
          status: false,
          data: null,
          msg: 'Maximum Image size 100MB allowed'
        })
      }
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `storeProduct/productGalleryPreview/${filename}_${helperString}${extension}`;
      let fileLocHelper = await uploadFile(req.file.path, FileUploadLocation);
      fileUrl = fileLocHelper;
    }
    const updateProduct = await storeProductTable.findByIdAndUpdate(
      isExist._id,
      {
        productType,
        groupedProduct,
        preview: fileUrl,
        deliveryType,
        publication,
        inStock: parseInt(inStock),
        keyFeature,
        marketingCat,
        maxPurchaseQty: parseInt(maxPurchaseQty),
      },
      { new: true, lean: true }
    );
    return res.json({
      status: true,
      data: updateProduct,
      msg: `Product Details added`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product details not added`,
    });
  }
});

store.post("/addStoreProductThird/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    regularPrice,
    salePrice,
    Schedule,
    metaTitle,
    metaDesc,
    saleExpire,
    isCoinApplicable,
    maxAllowedCoins,
  } = req.body;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
  }
  if (parseInt(regularPrice) < 0 || isNaN(regularPrice)) {
    return res.json({
      status: false,
      data: null,
      msg: "Regular always positive number",
    });
  }
  if ([true, 'true']?.includes(isCoinApplicable) && (parseInt(maxAllowedCoins) < 0 || isNaN(maxAllowedCoins))) {
    return res.json({
      status: false,
      data: null,
      msg: "Max Allowed Coins always positive number",
    });
  }
  if (parseInt(salePrice) < 0 || isNaN(salePrice)) {
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
      msg: "Sale always less than Or equal regularPrice",
    });
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
    const isExist = await storeProductTable.findOne({ _id: id });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: "Product not found",
      });
    }
    let maxCoins = isNaN(parseInt(maxAllowedCoins)) ? 0 : parseInt(maxAllowedCoins);
    // console.log(maxCoins)

    const updateProduct = await storeProductTable.findByIdAndUpdate(
      isExist._id,
      { regularPrice: parseInt(regularPrice), salePrice: parseInt(salePrice), Schedule, saleExpire: new Date(saleExpire), isCoinApplicable, maxAllowedCoins: maxCoins, metaTitle, metaDesc },
      { new: true, lean: true }
    );
    return res.json({
      status: true,
      data: updateProduct,
      msg: `Product Details added`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product details not added`,
    });
  }
});

store.post(
  "/addStoreProductFourth/:id",
  isAdmin,
  // upload.array("files"),
  upload.fields([
    {
      name: 'files',
      maxCount: 10
    },
    {
      name: 'videos',
      maxCount: 10
    }
  ]),
  async (req, res) => {
    const { id } = req.params;

    // <----------------product images can came from s3 upload file or new FIle Both ---------------------->
    const { images, videoUrls, videoType } = req.body;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: "Product Id not found",
      });
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
      const isExist = await storeProductTable.findOne({ _id: id });
      if (!isExist) {
        return res.json({
          status: false,
          data: null,
          msg: "Product not found",
        });
      }
      let fileArray = [];
      for (let img of images) {
        if (img != "") {
          fileArray.push(img)
        }
      }
      let videoArray = [];
      for (let video of videoUrls) {
        if (video != "") {
          videoArray.push(video)
        }
      }
      if (req?.files?.files?.length > 0) {
        for (const file of req?.files?.files) {
          let size = file.size / (1024);
          if (size > 100) {
            return res.json({
              status: false,
              data: null,
              msg: 'Maximum Image size 100KB allowed'
            })
          }
          const helperString = Math.floor(Date.now() / 1000);
          const filename = file.originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension = "." + file.originalname.split(".").pop();
          FileUploadLocation = `storeProduct/productGallery/${filename}_${helperString}${extension}`;
          let fileLocHelper = await uploadFile(file.path, FileUploadLocation);
          fileArray.push(fileLocHelper);
        }
      } if (req?.files?.videos?.length > 0) {
        for (const file of req?.files?.videos) {
          let size = file.size / (1024 * 1024);
          if (size > 10) {
            return res.json({
              status: false,
              data: null,
              msg: 'Maximum Image size 10 MB allowed'
            })
          }
          const helperString = Math.floor(Date.now() / 1000);
          const filename = file.originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension = "." + file.originalname.split(".").pop();
          FileUploadLocation = `storeProduct/productGalleryVideo/${filename}_${helperString}${extension}`;
          let fileLocHelper = await uploadFile(file.path, FileUploadLocation);
          videoArray.push(fileLocHelper);
        }
      }

      const updateProduct = await storeProductTable.findByIdAndUpdate(
        isExist._id,
        {
          images:
            fileArray.length > 0
              ? fileArray
              : isExist.images
                ? isExist.images
                : [],
          videos: videoArray,
          videoType: videoType
        },
        { new: true, lean: true }
      );
      return res.json({
        status: true,
        data: updateProduct,
        msg: `Product Details added`,
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Product details not added`,
      });
    }
  }
);
store.post(
  "/changeImageOrder/:id",
  isAdmin,
  upload.array("files"),
  async (req, res) => {
    const { id } = req.params;

    // <----------------product images can came from s3 upload file or new FIle Both ---------------------->
    const { images } = req.body;
    if (!id) {
      return res.json({
        status: false,
        data: null,
        msg: "Product Id not found",
      });
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
      const isExist = await storeProductTable.findOne({ _id: id });
      if (!isExist) {
        return res.json({
          status: false,
          data: null,
          msg: "Product not found",
        });
      }
      let fileArray = [...images];
      if (req.files.length > 0) {
        for (const file of req.files) {
          const helperString = Math.floor(Date.now() / 1000);
          const filename = file.originalname.split(".")[0]?.replace(/\s+/g, '_');
          const extension = "." + file.originalname.split(".").pop();
          FileUploadLocation = `storeProduct/productGallery/${filename}_${helperString}${extension}`;
          let fileLocHelper = await uploadFile(file.path, FileUploadLocation);
          fileArray.push(fileLocHelper);
        }
      }

      const updateProduct = await storeProductTable.findByIdAndUpdate(
        isExist._id,
        {
          images: fileArray
        },
        { new: true, lean: true }
      );
      return res.json({
        status: true,
        data: updateProduct,
        msg: `Product Details added`,
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || `Product details not added`,
      });
    }
  }
);

store.post("/addStoreProductFiveth/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { attributes, variations } = req.body;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
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
    const isExist = await storeProductTable.findOne({ _id: id });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: "Product not found",
      });
    }
    if (
      isExist?.productType == "variable" &&
      (attributes.length == 0 || variations.length == 0)
    ) {
      return res.json({
        status: false,
        data: null,
        msg: "Attributes & Variations required!",
      });
    }

    const updateProduct = await storeProductTable.findByIdAndUpdate(
      isExist._id,
      { attributes, variations },
      { new: true, lean: true }
    );
    return res.json({
      status: true,
      data: updateProduct,
      msg: `Product Details added`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product details not added`,
    });
  }
});

store.post("/updateStoreProduct/:id", upload.single("file"), isAdmin, async (req, res) => {
  const { id } = req.params;
  let {
    title,
    category,
    tags,
    code,
    desc,
    slug,
    badge,
    language,
    isActive,
    featuredImage,
    categories,
  } = req.body;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
  }
  try {
    if ([[], undefined, null, '']?.includes(categories)) {
      return res.json({
        status: false,
        data: null,
        msg: 'Please Select Categories of Product'
      })
    }
    if (!["NEW ARRIVAL", "TOP TRENDING", "PRICE DROP", "FREEDOM SALE"]?.includes(badge.trim())) {
      return res.json({
        status: false,
        data: null,
        msg: 'Please Select Correct badge'
      })
    }
    // console.log(categories)
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const regex = /^[A-Za-z0-9\s\-]+$/;
    let isValid = regex.test(slug);
    // console.log(slug);
    if (!isValid && slug) {
      return res.json({
        status: false,
        data: null,
        msg: 'Slug can contain only characters & number '
      })
    }
    const isExist = await storeProductTable.findOne({ _id: id });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: "Product not found",
      });
    }
    let query = {
      _id: { $ne: isExist?._id },
      $or: [
        { slug: slug },
        { code: code }
      ]
    }
    // const isExistSlug = await storeProductTable.findOne({ _id: { $ne: isExist?._id }, slug: slug });
    const isExistSlug = await storeProductTable.findOne({ ...query });

    if (isExistSlug) {
      return res.json({
        status: false,
        data: null,
        msg: "Product Slug Or Code already exist"
      })
    }

    // const slug = title ? await generateSlug(title) : isExist?.slug;
    let genSlug = await generateSlug(slug);
    // console.log(slug);
    title = title ? title : proCat.title;
    let fileUrl;
    if (req.file) {
      let size = req.file.size / (1024);
      if (size > 100) {
        return res.json({
          status: false,
          data: null,
          msg: 'Maximum Image size 100KB allowed'
        })
      }
      const helperString = Math.floor(Date.now() / 1000);
      const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
      const extension = "." + req.file.originalname.split(".").pop();
      FileUploadLocation = `StoreProduct/productGallery/${title}/${filename}_${helperString}${extension}`;
      let fileLocHelper = await uploadFile(req.file.path, FileUploadLocation);
      fileUrl = fileLocHelper;
    }
    if (featuredImage) {
      fileUrl = featuredImage;
    }
    let categoriesId = categories?.filter(item => item != "");

    const updateProduct = await storeProductTable.findByIdAndUpdate(
      isExist._id,
      {
        title,
        // category,
        categories: categoriesId,
        slug: genSlug,
        featuredImage: fileUrl,
        tags,
        code,
        desc,
        badge: badge.trim(),
        language,
        isActive,
      },
      { new: true, lean: true }
    );
    return res.json({
      status: true,
      data: updateProduct,
      msg: `Product Details added`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product details not added`,
    });
  }
});

store.post("/setBulkPriceForProducts", isAdmin, async (req, res) => {
  const { products, regularPrice, salePrice } = req.body;
  // console.log(products);
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
    for (let id of products) {
      await storeProductTable.findByIdAndUpdate(id, { regularPrice, salePrice }, { new: true });
    }
    return res.json({
      status: true,
      data: {},
      msg: 'Price & sale Price update for given product'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
store.post("/saleDateBulkUpdate", isAdmin, async (req, res) => {
  const { products, saleExpire } = req.body;
  // console.log(products);
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
    await storeProductTable.updateMany({ _id: { $in: products } }, { saleExpire: new Date(saleExpire) }, { new: true });
    return res.json({
      status: true,
      data: {},
      msg: 'Sale Expire Date update for given product'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.post("/setBulkAttributesForProducts", isAdmin, async (req, res) => {
  const { products, attributes } = req.body;
  // console.log(products);
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
    for (let id of products) {
      let product = await storeProductTable.findById(id);
      let newAttributes = product?.attributes ? [...product?.attributes, ...attributes] : [...attributes];
      await storeProductTable.findByIdAndUpdate(id, { attributes: newAttributes }, { new: true });
    }
    return res.json({
      status: true,
      data: {},
      msg: 'Attributes updated for given product'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
store.put("/updateMarketCat/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { marketingCat } = req.body;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
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
    const isExist = await storeProductTable.findOne({ _id: id });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: "Product not found",
      });
    }



    const updateProduct = await storeProductTable.findByIdAndUpdate(
      isExist._id,
      // {},
      {
        marketingCat
      },
      { new: true, lean: true }
    );
    return res.json({
      status: true,
      data: {},
      msg: `Product's MarketigCat updated`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product details not added`,
    });
  }
})

// getAllforAdmin
store.get("/getAllStoreProduct", isAdmin, async (req, res) => {
  const { text } = req.query;
  try {
    // let query = { 
    //   isTrash : false ,
    // }
    let query = {};
    if (text) {
      query.isActive = true;
      query.$or = [
        { code: { $regex: text, $options: 'i' } },
        { title: { $regex: text, $options: 'i' } },
      ]
    }
    // console.log(query);
    const allProduct = await storeProductTable
      .find({ isTrash: false, ...query })
      .populate("admin", "_id FullName Role")
      .populate("categories", "_id title slug").sort({ createdAt: -1 });
    if (allProduct) {
      return res.json({
        status: true,
        data: allProduct.map((item) => {
          // console.log(item);
          return {
            _id: item._id ?? "",
            id: item._id ?? "",
            value: item?._id ?? "",
            label: item?.title ?? "",
            title: item.title ?? "",
            categories: item?.categories?.map((item2) => { return { id: item2?._id ?? "", title: item2?.title ?? "", slug: item2.slug ?? "" } }),
            category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
            urls: { store: `${process.env.STORE_BASE_URL}/p/${item?.slug}`, publication: `${process.env.PUBLICATION_BASE_URL}/product/${item?.slug}` },
            url: `${process.env.STORE_BASE_URL}/p/${item?.categories[0]?.slug}/${item.slug}`,
            slug: item.slug ?? "",
            featuredImage: item.featuredImage ?? "",
            images: item.images ?? [],
            videos: item.videos ?? [],
            code: item.code ?? "",
            desc: item.desc ?? "",
            tags: item.tags ?? "",
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            marketingCat: item.marketingCat ?? "",
            productType: item.productType ?? "",
            regularPrice: item.regularPrice != "" ? item.regularPrice : "0",
            salePrice: item.salePrice != "" ? item.salePrice : "0",
            inStock: item.inStock ?? "",
            maxPurchaseQty: item.maxPurchaseQty ?? "",
            deliveryType: item.deliveryType ?? "",
            language: item.language ?? "",
            badge: item.badge ?? "",
            attributes: item.attributes ?? [],
            variations: item.variations ?? [],
            isActive: item.isActive ?? "",
            isCoinApplicable: item.isCoinApplicable ?? "",
            maxAllowedCoins: item.maxAllowedCoins ?? "",
            isTrash: item.isTrash ?? "",
            metaTitle: item.metaTitle ?? "",
            metaDesc: item.metaDesc ?? "",
            keyFeature: item?.keyFeature ?? "",
            preview: item?.preview ?? "",
            categoriesForExport: item?.categories?.map((item2) => { return `${item2.title}-${item2?._id}` }),
            createdAt: `${moment(item.createdAt)
              .add(5, "hours")
              .add(30, "minutes")
              .format("DD-MM-YYYY HH:mm:ss")}` ?? `${moment().add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}`

          }
        }),
        msg: `All Products fetched.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

store.get("/getAllTrashProduct", isAdmin, async (req, res) => {
  try {
    const allProduct = await storeProductTable
      .find({ isTrash: true })
      .populate("admin", "_id FullName Role")
      .populate("categories", "_id title slug");
    if (allProduct) {
      return res.json({
        status: true,
        data: allProduct.map((item, index) => {
          // console.log(item);
          return {
            serialNumber: index + 1,
            _id: item._id ?? "",
            id: item._id ?? "",
            title: item.title ?? "",
            category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
            categories: item?.categories?.map((item2) => { return { id: item2?._id ?? "", title: item2?.title ?? "", slug: item2.slug ?? "" } }),
            url: `${process.env.STORE_BASE_URL}/p/${item?.category?.slug}/${item.slug}`,
            slug: item.slug ?? "",
            featuredImage: item.featuredImage ?? "",
            images: item.images ?? [],
            videos: item?.videos ?? [],
            code: item.code ?? "",
            desc: item.desc ?? "",
            tags: item.tags ?? "",
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            marketingCat: item.marketingCat ?? "",
            productType: item.productType ?? "",
            regularPrice: item.regularPrice != "" ? item.regularPrice : "0",
            salePrice: item.salePrice != "" ? item.salePrice : "0",
            inStock: item.inStock ?? "",
            maxPurchaseQty: item.maxPurchaseQty ?? "",
            deliveryType: item.deliveryType ?? "",
            language: item.language ?? "",
            badge: item.badge ?? "",
            attributes: item.attributes ?? [],
            variations: item.variations ?? [],
            isActive: item.isActive ?? "",
            isCoinApplicable: item.isCoinApplicable ?? "",
            maxAllowedCoins: item.maxAllowedCoins ?? "",
            isTrash: item.isTrash ?? "",
            createdAt: `${moment(item.createdAt)
              .add(5, "hours")
              .add(30, "minutes")
              .format("DD-MM-YYYY HH:mm:ss")}` ?? `${moment().add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}`

          }
        }),
        msg: `All Products fetched.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

// getById for Admin
store.get("/getStoreProductById/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
  }
  try {
    const product = await storeProductTable
      .findOne({ _id: id }).populate('categories', '_id title');
    // .populate("category", "_id title");
    // console.log(product)

    if (product) {
      return res.json({
        status: true,
        data: { ...product?._doc, saleExpire: product?.saleExpire, preview: product?.preview, videos: product?.videos ?? [], categories: product?.categories?.map((item) => { return { value: item?._id, label: item?.title } }) },
        msg: `Product fetched.`,
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

// import from excel 
store.post("/importProductsFromExcel", upload.single('file'), isAdmin, async (req, res) => {

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
    const file = req.file;
    if (!file) {
      return res.json({
        status: false,
        data: null,
        msg: "No file uploaded",
      });
    }
    const allowedFileTypes = ['.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname);
    if (!allowedFileTypes.includes(fileExtension)) {
      return res.json({
        status: false,
        data: null,
        msg: `"Invalid file type. Only Excel files (.xls, .xlsx) are allowed."`,
      });
    }
    const workbook = xlsjs.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const workSheet = workbook.Sheets[sheetName];
    const data = xlsjs.utils.sheet_to_json(workSheet, { header: 1 });
    const actualColumns = Object.values(data[0]);
    const expectedColumns = [
      // 'category',
      'categories',
      'title',
      'slug',
      'code',
      'desc',
      'publication',
      'regularPrice',
      'salePrice',
      // 'schedule' ,
      'tags',
      'inStock',
      'deliveryType',
      'featuredImage',
      'images',
      'language',
      'productType',
      // 'groupedProduct' ,
      'marketingCat',
      'maxPurchaseQty',
      'badge',
      'isCoinApplicable',
      'maxAllowedCoins',
      // 'attributes',
      // 'variations',
      'isActive',
    ];
    const missingColumns = expectedColumns.filter((column) => !actualColumns.includes(column));
    if (missingColumns.length > 0) {
      return res.json({
        status: false,
        data: null,
        msg: `Missing columns in the Excel file: ${missingColumns.join(", ")}`
      })
    }
    let products = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      // for( let j =  0 ; j < row.length ; j++){
      //   console.log(row[j]?.trim())
      // }
      row = row.map((cell) => cell.toString().trim());
      if (row.filter((cell) => cell !== "").length === 0) {
        continue;
      }
      let images = row[12] ? row[12].split(",").map((item) => item.trim()) : [];
      let tags = row[8] ? row[8].split(",").map((item) => item.trim()) : [];
      let categories = row[0] ? row[0].split(",")?.filter((item) => { return (item != "") }).map((item) => item.trim()) : [];
      // console.log(categories);
      let product = {
        admin: adminDetails?._id,
        //  category : row[0],
        categories: categories,
        title: row[1],
        //  slug : row[2],
        slug: await generateSlug(row[1]),
        code: row[3],
        desc: row[4],
        publication: row[5],
        regularPrice: row[6],
        salePrice: row[7],
        //  schedule : row[8],
        tags: tags,
        inStock: row[9],
        deliveryType: row[10],
        featuredImage: row[11],
        //  images : row[12],
        images: images,
        language: row[13],
        productType: row[14],
        //  groupedProduct : row[15],
        marketingCat: row[15],
        maxPurchaseQty: row[16],
        badge: row[17],
        isCoinApplicable: row[18],
        maxAllowedCoins: row[19],
        //  attributes : row[21],
        //  variations : row[22],
        //  isActive : row[20],
        isActive: false,
        category: null,
        videos: [],
      }
      products.push(product);
    }
    const saveProducts = await storeProductTable.insertMany(products);
    // console.log(saveProducts);
    return res.json({
      status: true,
      data: saveProducts,
      msg: `All Products imported succesfully`,
    });

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

store.post("/updateProductsFromExcel", upload.single('file'), isAdmin, async (req, res) => {
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
    const file = req.file;
    if (!file) {
      return res.json({
        status: false,
        data: null,
        message: "No file uploaded",
      });
    }
    const allowedFileTypes = ['.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname);
    if (!allowedFileTypes.includes(fileExtension)) {
      return res.json({
        status: false,
        data: null,
        msg: `"Invalid file type. Only Excel files (.xls, .xlsx) are allowed."`,
      });
    }
    const workbook = xlsjs.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const workSheet = workbook.Sheets[sheetName];
    const data = xlsjs.utils.sheet_to_json(workSheet, { header: 1 });
    let actualColumns = Object.values(data[0]);
    actualColumns = actualColumns.map((item) => item.trim());
    const expectedColumns = [
      'id',
      'title',
      'marketingCat',
      'code',
      'inStock',
      'maxPurchaseQty',
      'regularPrice',
      'salePrice',
      'badge',
      'tags',
      'isCoinApplicable',
      'maxAllowedCoins',
      'isActive',
    ];
    const missingColumns = expectedColumns.filter((column) => !actualColumns.includes(column));
    if (missingColumns.length > 0) {
      return res.json({
        status: false,
        data: null,
        msg: `Missing columns in the Excel file: ${missingColumns.join(", ")}`
      })
    }
    // let products = [];
    let successCount = [];
    let failureCount = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      row = row.map((cell) => cell.toString()?.trim());
      if (row.filter((cell) => cell !== "").length === 0) {
        continue;
      }
      let id = row[12].trim();
      if (!['POPULAR', 'BOOK', 'SA', 'HDC', 'HDP'].includes(row[1].trim())) {
        return res.json({
          status: false,
          data: null,
          msg: `All Product marketing should be one of them ['POPULAR', 'BOOK', 'SA', 'HDC', 'HDP'].`
        })
      }
      if (parseInt(row[6]) > parseInt(row[5])) {
        return res.json({
          status: false,
          data: null,
          msg: `All Product's sale price always less than regular price`
        })
      }

      let tags = row[8] ? row[8].split(",").map((item) => item.trim()) : [];
      let product = {
        admin: adminDetails?._id,
        title: row[0],
        marketingCat: row[1],
        code: row[2],
        inStock: row[3],
        maxPurchaseQty: row[4],
        regularPrice: row[5],
        salePrice: row[6],
        badge: row[7],
        tags: tags,
        isCoinApplicable: row[9],
        maxAllowedCoins: row[10],
        isActive: false,
        category: null,
      }
      // products.push(product);
      let slug = await generateSlug(product?.title)
      // console.log(product);
      let updateProduct = "";
      updateProduct = await storeProductTable.findByIdAndUpdate(id, { ...product, slug }, { new: true });
      if (!updateProduct) {
        failureCount.push({ id: product?.id, title: product?.title });
      } else {
        successCount.push({ id: product?.id, title: product?.title });
      }

    }
    // console.log(saveProducts);
    return res.json({
      status: true,
      data: { totalProducts: data.length - 1, successCount, failureCount },
      msg: `All Products updated succesfully`,
    });

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

// recommended
store.get("/recommendProducts", ValidateTokenForWeb, async (req, res) => {
  // const { productIds } = req.body;
  const { limit } = req.query;
  const n = parseInt(limit) || 20;
  try {
    const Currentuser = await findUserByUserId(req?.userId);
    // if (!Currentuser) {
    //   return res.json({
    //     status: false,
    //     data: null,
    //     msg: `Not a user`,
    //   });
    // }
    const wishListEntries = await storeWishlistTable.find({ user: Currentuser?._id });
    const productIds = wishListEntries[0]?.products;
    // console.log(productIds);
    let aggregation = {};
    if (productIds && productIds.length > 0) {
      const pros = await storeProductTable.find({ _id: { $in: productIds } });
      const categoryIds = pros.map((item) => { return mongoose.Types.ObjectId(item.category) })
      // console.log(categoryIds);
      const query = categoryIds && {
        // category: {
        //   $in: categoryIds
        // },
        categories: {
          $in: categoryIds
        },
        _id: { $nin: productIds?.map((item) => mongoose.Types.ObjectId(item)) },
        isActive: true,
        isTrash: false,
        inStock: { $gte: "1" }
      }

      aggregation.$match = query;


    } else {
      const productids = await getMostSaleProducts();
      aggregation.$match = { _id: { $in: productids }, isActive: true, isTrash: false, inStock: { $gte: "1" } };
    }
    // console.log(aggregation);
    const allProduct = await storeProductTable.aggregate([
      aggregation,
      {
        $limit: n,
      },
      {
        $sort: { "createdAt": -1 }
      },
      // {
      //   $lookup: {
      //     from: 'productcategorytables',
      //     localField: 'category',
      //     foreignField: '_id',
      //     as: 'categoryDetails',
      //   },
      // },
      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: "productreviewstables",
          let: { product: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$product"],
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
          product: "$$ROOT",
          // categoryDetails: '$categoryDetails',
          categories: '$categories',
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
      },


    ]);


    // map
    const user = await findUserByUserId(req?.userId);
    const currentDate = new Date();
    const products = await Promise.all(allProduct.map(async (item) => {


      const isSaleLive =
        currentDate >= new Date(item.product.schedule.startDate) &&
        currentDate <= new Date(item.product.schedule.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item?.product?._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item.product._id ?? "",
        title: item.product.title ?? "",
        slug: item.product.slug ?? "",
        // category: { id: item.categoryDetails[0]?._id ?? "", title: item.categoryDetails[0]?.title ?? "", slug: item.categoryDetails[0]?.slug ?? "" },
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item.categories?.map((cat) => { return { id: cat?._id ?? "", title: cat?.title ?? "", slug: cat?.slug ?? "" } }),
        featuredImage: item.product.featuredImage ?? "",
        images: item.product.images ?? [],
        // videos : item?.product?.videos ?? [],
        code: item.product.code ?? "",
        regularPrice: item.product.regularPrice != "" ? `${parseInt(item.product.regularPrice)}` : "0",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        isSaleLive: isSaleLive,
        maxPurchaseQty: item.product.maxPurchaseQty ?? "",
        language: item.product.language ?? "",
        salePrice: item.product.salePrice != "" ? `${parseInt(item.product.salePrice)}` : "0",
        badge: item.product.badge ?? "",
        saleExpire: moment(item?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));
    if (products) {
      return res.json({
        status: true,
        data: products,
        msg: "Recommend product fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Recommend product not fetched`,
    });
  }
});

// similiar product
store.get("/similiarProducts", ValidateTokenForWeb, async (req, res) => {

  const { limit } = req.query;
  const n = parseInt(limit) || 20;


  try {
    const currentUser = await findUserByUserId(req?.userId);
    // if (!currentUser) {
    //   return res.json({
    //     status: false,
    //     data: null,
    //     msg: `Not a user`,
    //   });
    // }
    const userCartProducts = await storeCartTable.aggregate([
      {
        $match: { user: currentUser?._id },
      },
      {
        $project: {
          productIds: "$products.productId",
        },
      },
    ]);
    const productIds = userCartProducts.length > 0 ? userCartProducts[0].productIds : [];
    let aggregation = {};
    if (productIds && productIds.length > 0) {
      const pros = await storeProductTable.find({ _id: { $in: productIds } });
      const categoryIds = pros.map((item) => { return mongoose.Types.ObjectId(item.category) });
      // console.log(categoryIds);
      const query = categoryIds && {
        // category: {
        //   $in: categoryIds
        // },
        categories: {
          $in: categoryIds
        },
        _id: { $nin: productIds?.map((item) => mongoose.Types.ObjectId(item)) },
        isActive: true,
        isTrash: false,
        inStock: { $gte: "1" }
      }
      aggregation.$match = query;
    } else {
      let productids = await getMostSaleProducts();
      // console.log(productids)
      // _id : { $in : productids} 
      aggregation.$match = { _id: { $in: productids }, isActive: true, isTrash: false, inStock: { $gte: "1" } };
    }
    // console.log(aggregation)
    const allProduct = await storeProductTable.aggregate([
      // {
      //   $match: {
      //     _id: { $ne: isProduct._id },
      //     category: mongoose.Types.ObjectId(isProduct?.category),
      //   },
      // },
      aggregation,
      {
        $limit: n,
      },
      {
        $sort: { "createdAt": -1 }
      },
      // {
      //   $lookup: {
      //     from: 'productcategorytables',
      //     localField: 'category',
      //     foreignField: '_id',
      //     as: 'categoryDetails',
      //   },
      // },
      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: "productreviewstables",
          let: { product: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$product"],
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
          product: "$$ROOT",
          // categoryDetails: '$categoryDetails',
          categories: '$categories',
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
      },

    ]);
    // map
    const user = await findUserByUserId(req?.userId);
    const currentDate = new Date();
    const products = await Promise.all(allProduct.map(async (item) => {
      const isSaleLive =
        currentDate >= new Date(item.product.schedule.startDate) &&
        currentDate <= new Date(item.product.schedule.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item.product._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item.product._id ?? "",
        title: item.product.title ?? "",
        slug: item.product.slug ?? "",
        // category: { id: item.categoryDetails[0]?._id ?? "", title: item.categoryDetails[0]?.title ?? "", slug: item.categoryDetails[0]?.slug ?? "" },
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item.categories?.map((cat) => { return { id: cat?._id ?? "", title: cat?.title ?? "", slug: cat?.slug ?? "" } }),
        featuredImage: item.product.featuredImage ?? "",
        images: item.product.images ?? [],
        // videos : item?.product?.videos ?? [],
        code: item.product.code ?? "",
        regularPrice: item.product.regularPrice != "" ? `${parseInt(item.product.regularPrice)}` : "0",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        isSaleLive: isSaleLive,
        maxPurchaseQty: item.product.maxPurchaseQty ?? "",
        language: item.product.language ?? "",
        salePrice: item.product.salePrice != "" ? `${parseInt(item.product.salePrice)}` : "0",
        badge: item.product.badge ?? "",
        saleExpire: moment(item?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));
    if (products) {
      return res.json({
        status: true,
        data: products,
        msg: "Similiar product fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Similiar product not fetched`,
    });
  }
});

// getAllFor store website
store.get("/getStoreProducts", ValidateTokenForWeb, async (req, res) => {
  let { text, limit, category, categorySlug, language, year, productType, page, pageSize, priceMin, priceMax, priceSort, minDiscount, type } = req.query;
  page = parseInt(page) || 1;
  pageSize = parseInt(pageSize) || 15;
  priceMin = parseInt(priceMin) || 0;
  priceMax = parseInt(priceMax) || 999;
  const n = parseInt(limit) || 10;

  let query = {
    isActive: true,
    isTrash: false,
    inStock: { $gte: "1" },
  };
  if (priceMin && priceMax) {
    query.salePriceNum = { $gte: priceMin, $lte: priceMax }
  }
  // console.log(req.query)
  if (text) {
    query.$or = [
      { title: { $regex: text, $options: "i" } },
      { desc: { $regex: text, $options: "i" } },
      { code: { $regex: text, $options: "i" } },
      { tags: { $in: [text] } },
      { badge: { $regex: text, $options: "i" } },
    ];
  }
  // add New Arrival Products
  // if (type && type == "NEW ARRIVAL") {

  if (type && ["NEW ARRIVAL", "TOP TRENDING", "PRICE DROP", "FREEDOM SALE"].includes(type.trim())) {
    query.badge = type
  }
  // add minDiscount condition
  if (minDiscount && parseInt(minDiscount)) {
    query.percentage = { $gte: parseInt(minDiscount) }
  }
  if (productType) {
    query.productType = productType;
  }

  if (language) {
    query.language = language;
  }
  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  // console.log(query)


  // console.log(queryForCount)
  try {
    let isCategory;
    if (category || categorySlug) {
      // const id = mongoose.Types.ObjectId(category);

      if (category) {
        isCategory = await productCategoryTable.findOne({ _id: category });
      } else if (categorySlug) {
        isCategory = await productCategoryTable.findOne({ slug: categorySlug });
      }

      if (!isCategory) {
        return res.json({
          status: false,
          data: null,
          msg: `this category not exist.`,
        });
      }
      let categoryArray = [];
      categoryArray.push(mongoose.Types.ObjectId(isCategory._id));
      // const subCategory = await productCategoryTable.find({ parentCategory: isCategory._id });
      // for (let cat of subCategory) {
      //   categoryArray.push(mongoose.Types.ObjectId(cat._id));
      // }
      query.categories = { $in: categoryArray }
    }
    let queryForCount = { ...query };
    // delete queryForCount['salePriceNum'];
    // delete queryForCount['percentage'];
    let sortObject = { createdAt: -1 }
    if (priceSort && priceSort == 'low') {
      sortObject = { salePriceNum: 1, createdAt: -1 }
    }
    if (priceSort && priceSort == 'high') {
      sortObject = { salePriceNum: -1, createdAt: -1 }
    }

    // console.log(sortObject);

    const allProduct1 = await storeProductTable.aggregate([
      {
        $facet: {
          products: [
            {
              $addFields: {
                salePriceNum: { $toInt: "$salePrice" },
                regularPriceNum: { $toInt: "$regularPrice" },
                percentage: { $divide: [{ $multiply: [{ $abs: { $subtract: [{ $toInt: "$salePrice" }, { $toInt: "$regularPrice" }] } }, 100] }, { $toInt: "$regularPrice" }] },
              }
            },

            {
              $match: query,
            },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              $sort: { ...sortObject }
            },

            {
              $lookup: {
                from: 'productcategorytables',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
              },
            },
            {
              $lookup: {
                from: "productreviewstables",
                let: { product: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$product", "$$product"],
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
                product: "$$ROOT",
                // categoryDetails: '$categoryDetails',
                categories: '$categories',
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
                salePriceNum: { $toInt: "$salePrice" },
                regularPriceNum: { $toInt: "$regularPrice" },
                percentage: { $divide: [{ $multiply: [{ $abs: { $subtract: [{ $toInt: "$salePrice" }, { $toInt: "$regularPrice" }] } }, 100] }, { $toInt: "$regularPrice" }] },
              }
            },
            { $match: queryForCount },
            { $group: { _id: null, count: { $sum: 1 } } },
          ]
        }
      },
      {
        $project: {
          products: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

        }
      }
    ])

    // console.log(allProduct1[0])
    // map
    // console.log("Use1", req.userId)
    const user = await findUserByUserId(req?.userId);
    // console.log("User", user)
    const currentDate = new Date();
    const products = await Promise.all(allProduct1[0]?.products.map(async (item) => {
      const isSaleLive =
        currentDate >= new Date(item.product.schedule.startDate) &&
        currentDate <= new Date(item.product.schedule.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item.product._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item.product._id ?? "",
        title: item.product.title ?? "",
        // categoryDetails: item.categoryDetails[0],
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item?.categories?.map((category) => { return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
        parentCategory: isCategory?.title ?? "",
        slug: item.product.slug ?? "",
        featuredImage: item.product.featuredImage ?? "",
        images: item.product.images ?? [],
        shareLink: { link: item?.product?.shareLink?.link ?? "", text: item?.product?.shareLink?.text ?? "" },
        // videos : item?.product?.videos ?? [],
        code: item.product.code ?? "",
        regularPrice: item.product.regularPrice != "" ? `${parseInt(item.product.regularPrice)}` : "0",
        isSaleLive: isSaleLive,
        maxPurchaseQty: item.product.maxPurchaseQty ?? "",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        language: item.product.language ?? "",
        salePrice: item.product.salePrice != "" ? `${parseInt(item.product.salePrice)}` : "0",
        badge: item.product.badge ?? "",
        saleExpire: moment(item?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));

    if (allProduct1[0].products) {
      return res.json({
        status: true,
        data: products,
        data1: { products: products, totalCounts: allProduct1[0]?.totalCounts?.count ?? 0 },
        // data : allProduct,
        msg: "All product details response fetch",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

// marketingCategory
store.get("/getMarketingCategory", ValidateTokenForWeb, async (req, res) => {
  let { category, limit, page, pageSize } = req.query;
  if (!(['POPULAR', 'BOOK', 'SA', 'HDC', 'HDP'].includes(category))) {
    return res.json({
      status: false,
      data: null,
      msg: "Invalid Parameters"
    })
  }
  const n = parseInt(limit) || 5;
  let query = {
    isActive: true,
    isTrash: false,
    inStock: { $gte: "1" },
    marketingCat: category
  };
  try {
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 15;
    const allProduct1 = await storeProductTable.aggregate([
      {
        $facet: {
          products: [{
            $match: query,
          },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $sort: { "createdAt": -1 }
          },
          {
            $lookup: {
              from: 'productcategorytables',
              localField: 'categories',
              foreignField: '_id',
              as: 'categories',
            },
          },
          {
            $lookup: {
              from: "productreviewstables",
              let: { product: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$product", "$$product"],
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
              product: "$$ROOT",
              // categoryDetails: '$categoryDetails',
              categories: '$categories',
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
            { $match: query },
            { $group: { _id: null, count: { $sum: 1 } } },
          ]
        }
      },
      {
        $project: {
          products: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

        }
      }
    ])
    const user = await findUserByUserId(req?.userId);
    const currentDate = new Date();
    const products = await Promise.all(allProduct1[0].products.map(async (item) => {
      // console.log(item?.categories[0]);
      const isSaleLive =
        currentDate >= new Date(item.product.schedule.startDate) &&
        currentDate <= new Date(item.product.schedule.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item.product._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item.product._id ?? "",
        title: item.product.title ?? "",
        // categoryDetails: item.categoryDetails[0],
        // category: { id: item.categoryDetails[0]?._id ?? "", title: item.categoryDetails[0]?.title ?? "", slug: item.categoryDetails[0]?.slug ?? "" },
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item?.categories?.map((category) => { return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
        slug: item.product.slug ?? "",
        featuredImage: item.product.featuredImage ?? "",
        images: item.product.images ?? [],
        // videos : item?.product?.videos ?? [],
        code: item.product.code ?? "",
        regularPrice: item.product.regularPrice != "" ? `${parseInt(item.product.regularPrice)}` : "0",
        isSaleLive: isSaleLive,
        marketingCat: item.product.marketingCat ?? "",
        maxPurchaseQty: item.product.maxPurchaseQty ?? "",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        language: item.product.language ?? "",
        salePrice: item.product.salePrice != "" ? `${parseInt(item.product.salePrice)}` : "0",
        badge: item.product.badge ?? "",
        saleExpire: moment(item?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));

    if (allProduct1[0]?.products) {
      return res.json({
        status: true,
        data: products,
        data1: { products: products, totalCounts: allProduct1[0].totalCounts?.count },
        msg: "All product details response fetch",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

// getproductById for store website
store.get("/getProductById/:id", ValidateTokenForWeb, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Product Id not found",
    });
  }
  try {
    const result = await storeProductTable.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
          isActive: true,
          isTrash: false,
        },
      },
      {
        $lookup: {
          from: "productreviewstables",
          let: { product: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$product"],
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
                description: 1,
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
      // {
      //   $lookup: {
      //     from: 'productcategorytables',
      //     localField: 'category',
      //     foreignField: '_id',
      //     as: 'categoryDetails',
      //   },
      // },
      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
      // {
      //   $addFields: {
      //     reviews: {
      //       $map: {
      //         input: '$reviews',
      //         as: 'review',
      //         in: {
      //           id: '$$review._id',
      //           user: '$$review.user',
      //           rating: '$$review.rating',
      //           title: '$$review.title',
      //           description: '$$review.description',
      //         },
      //       },

      //     },
      //   },
      // },
      {
        $project: {
          product: "$$ROOT",
          // categoryDetails: '$categoryDetails',
          categories: '$categories',
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
                                    { $eq: ["$$review", "$$rating"] },
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
        msg: 'Product Not Exist'
      })
    }
    const user = await findUserByUserId(req?.userId);
    const currentDate = new Date();
    const isSaleLive =
      currentDate >= new Date(result[0].product.schedule.startDate) &&
      currentDate <= new Date(result[0].product.schedule.endDate);
    const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: result[0]?.product?._id } })
    const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: result[0]?.product?._id } });
    let couponQuery = {
      couponCode: { $nin: ["OFFER5", "OFFER10", "OFFER15"] },
      link: { $in: ['product', 'productCategory'] },
      linkWith: { $in: ['all', result[0].product._id, ...result[0]?.categories.map((item) => { return item?._id })] },
      is_active: true,
      expirationDate: { $gt: currentDate }

    }
    let coupons = await couponTable.find(couponQuery).sort({ createdAt: -1 }).select('_id couponCode couponType couponValue');
    const product = {
      id: result[0].product._id ?? "",
      title: result[0].product.title ?? "",
      // category: { id: result[0].categoryDetails[0]?._id ?? "", title: result[0].categoryDetails[0]?.title ?? "", slug: result[0].categoryDetails[0]?.slug ?? "" },
      category: { id: result[0].categories[0]?._id ?? "", title: result[0].categories[0]?.title ?? "", slug: result[0].categories[0]?.slug ?? "" },
      categories: result[0]?.categories?.map((category) => { return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
      slug: result[0].product.slug ?? "",
      metaTitle: result[0].product.metaTitle ?? "",
      metaDesc: result[0].product.metaDesc ?? "",
      keyFeature: result[0].product.keyFeature ?? "",
      featuredImage: result[0].product.featuredImage ?? "",
      images: result[0].product.images ?? [],
      videoType: result[0].product.videoType ?? "",
      shareLink: { link: result[0]?.product?.shareLink?.link ?? "", text: result[0]?.product?.shareLink?.text ?? "" },
      videos: result[0]?.product?.videos ?? [],
      preview: result[0].product.preview ?? "",
      code: result[0].product.code ?? "",
      desc: result[0].product.desc ?? "",
      tags: result[0].product.tags ?? "",
      regularPrice: result[0].product.regularPrice != "" ? `${parseInt(result[0].product?.regularPrice)}` : "0",
      isSaleLive: isSaleLive,
      offers: coupons,
      salePrice: result[0].product.salePrice != "" ? `${parseInt(result[0].product?.salePrice)}` : "0",
      inStock: result[0].product.inStock ?? "",
      maxPurchaseQty: result[0].product.maxPurchaseQty ?? "",
      deliveryType: result[0].product.deliveryType ?? "",
      language: result[0].product.language ?? "",
      badge: result[0].product.badge ?? "",
      attributes: result[0].product.attributes ?? [],
      variations: result[0].product.variations ?? [],
      isWishList: isWishList ? true : false,
      isAddToCart: isAddToCart ? true : false,
      isCoinApplicable: result[0].product.isCoinApplicable ?? "",
      maxAllowedCoins: result[0].product.maxAllowedCoins ?? "",
      reviews: result[0].reviewsWithContent ?? [],
      saleExpire: moment(result[0]?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
      totalReviews: result[0].reviewsWithContent?.length ?? 0,
      averageRating: result[0].averageRating.toFixed(1) || "0.0",
      ratingCounts: result[0].ratingCount ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalRatings: Object.values(result[0].ratingCount).reduce(
        (acc, value) => acc + value,
        0
      ),
    };
    if (product) {
      return res.json({
        status: true,
        data: product,
        msg: `Product fetched.`,
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

// getProductBySlug for store
store.get("/getProductBySlug/:slug", ValidateTokenForWeb, async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.json({
      status: false,
      data: null,
      msg: "Product not found",
    });
  }
  try {
    const result = await storeProductTable.aggregate([
      {
        $match: {
          slug: slug,
          isActive: true,
          isTrash: false,
        },
      },
      {
        $lookup: {
          from: "productreviewstables",
          let: { product: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$product"],
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
                description: 1,
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
      // {
      //   $lookup: {
      //     from: 'productcategorytables',
      //     localField: 'category',
      //     foreignField: '_id',
      //     as: 'categoryDetails',
      //   },
      // },
      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },

      {
        $project: {
          product: "$$ROOT",
          // categoryDetails: '$categoryDetails',
          categories: '$categories',
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
                                    { $eq: ["$$review", "$$rating"] },
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
    // console.log(result[0])
    if (result?.length == 0) {
      return res.json({
        status: false,
        data: null,
        msg: 'Product Not Exist'
      })
    }
    const user = await findUserByUserId(req?.userId);
    const currentDate = new Date();
    const isSaleLive =
      currentDate >= new Date(result[0]?.product?.schedule.startDate) &&
      currentDate <= new Date(result[0]?.product?.schedule.endDate);
    const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: result[0].product._id } })
    const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: result[0]?.product?._id } });
    // console.log(result)
    let couponQuery = {
      couponCode: { $nin: ["OFFER5", "OFFER10", "OFFER15"] },
      link: { $in: ['product', 'productCategory'] },
      linkWith: { $in: ['all', result[0].product._id, ...result[0]?.categories.map((item) => { return item?._id })] },
      is_active: true,
      expirationDate: { $gt: currentDate }

    }
    let coupons = await couponTable.find(couponQuery).sort({ createdAt: -1 }).select('_id couponCode couponType couponValue');
    const product = {
      id: result[0].product._id ?? "",
      title: result[0].product.title ?? "",
      category: { id: result[0].categories[0]?._id ?? "", title: result[0].categories[0]?.title ?? "", slug: result[0].categories[0]?.slug ?? "" },
      categories: result[0]?.categories?.map((category) => { return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
      slug: result[0].product.slug ?? "",
      metaTitle: result[0]?.product?.metaTitle ?? "",
      metaDesc: result[0]?.product?.metaDesc ?? "",
      keyFeature: result[0]?.product?.keyFeature ?? "",
      featuredImage: result[0].product.featuredImage ?? "",
      images: result[0].product.images ?? [],
      videos: result[0].product.videos ?? [],
      videoType: result[0].product.videoType ?? "",
      preview: result[0].product.preview ?? "",
      code: result[0].product.code ?? "",
      desc: result[0].product.desc ?? "",
      tags: result[0].product.tags ?? "",
      saleExpire: moment(result[0]?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
      regularPrice: result[0].product.regularPrice != "" ? `${parseInt(result[0].product.regularPrice)}` : "0",
      isSaleLive: isSaleLive,
      salePrice: result[0].product.salePrice != "" ? `${parseInt(result[0].product.salePrice)}` : "0",
      inStock: result[0].product.inStock ?? "",
      maxPurchaseQty: result[0].product.maxPurchaseQty ?? "",
      deliveryType: result[0].product.deliveryType ?? "",
      language: result[0].product.language ?? "",
      badge: result[0].product.badge ?? "",
      attributes: result[0].product.attributes ?? [],
      variations: result[0].product.variations ?? [],
      isWishList: isWishList ? true : false,
      isAddToCart: isAddToCart ? true : false,
      offers: coupons,
      isCoinApplicable: result[0].product.isCoinApplicable ?? "",
      maxAllowedCoins: result[0].product.maxAllowedCoins ?? "",
      reviews: result[0].reviewsWithContent ?? [],
      totalReviews: result[0].reviewsWithContent?.length ?? 0,
      averageRating: result[0].averageRating.toFixed(1) || "0.0",
      ratingCounts: result[0].ratingCount ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalRatings: Object.values(result[0].ratingCount).reduce(
        (acc, value) => acc + value,
        0
      ),
    };
    if (product) {
      return res.json({
        status: true,
        data: product,
        msg: `Product fetched.`,
      });
    }
  } catch (error) {
    // console.log(error);
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Product not fetched`,
    });
  }
});

// getNewArrivalProduct
store.get("/getNewArrival", async (req, res) => {
  let { text, limit, category, language, year, productType, page, pageSize } = req.query;
  const n = parseInt(limit) || 5;
  page = parseInt(page) || 1;
  pageSize = parseInt(pageSize) || 15;
  let query = {
    isActive: true,
    isTrash: false,
    inStock: { $gte: 1 },
  };
  if (text) {
    query.$or = [
      { title: { $regex: text, $options: "i" } },
      { desc: { $regex: text, $options: "i" } },
      { code: { $regex: text, $options: "i" } },
      { tags: { $in: [text] } },
      { badge: { $regex: text, $options: "i" } },
    ];
  }
  if (productType) {
    query.productType = productType;
  }

  if (language) {
    query.language = language;
  }
  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  try {
    if (category) {
      const isCategory = await productCategoryTable.findOne({ _id: catgeory });
      if (!isCategory) {
        return res.json({
          status: false,
          data: null,
          msg: "Category not found",
        });
      }
      query.categories = { $in: [mongoose.Types.ObjectId(category)] };
    }
    const products = await storeProductTable
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    if (products) {
      return res.json({
        status: true,
        data: products.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            // desc:item.desc ?? '',
            featuredImage: item.featuredImage ?? "",
            // images : item.images ?? [],
          };
        }),
        msg: "New Arrival product fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `New Arrival not fetched`,
    });
  }
});
// get all images of product gallery

// delete for admin
store.delete("/deleteStoreProduct/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Store Product id not found.`,
    });
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const data = await storeProductTable.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        data: null,
        msg: "Store Product not found Or not deleted",
      });
    }
    await savePanelEventLogs(
      adminDetails?._id,
      "deleteStoreProduct",
      "delete",
      data
    )

    res.json({
      status: true,
      data: data,
      msg: "Store Product deleted",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "FeatureVideo not deleted",
    });
  }
});

store.delete("/trashStoreProduct/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Store Product id not found.`,
    });
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const isProduct = await storeProductTable.findOne({ _id: id });
    if (!isProduct) {
      return res.json({
        status: false,
        data: null,
        msg: 'Product not exist'
      })
    }
    let trash = isProduct?.isTrash == false ? true : false;
    const data = await storeProductTable.findByIdAndUpdate(id, { isTrash: trash }, { new: true });
    if (!data) {
      return res.status(404).json({
        status: false,
        data: null,
        msg: "Store Product's Trash status not changed",
      });
    }
    await savePanelEventLogs(
      adminDetails?._id,
      "trashStoreProduct",
      "trash",
      data
    )

    res.json({
      status: true,
      data: data,
      msg: "Store Product's Trash status changed",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "FeatureVideo not deleted",
    });
  }
});
// Get a specific store product by ID

// < ------- Store Orders ------- >
store.post("/addStoreOrders", ValidateTokenForWeb, async (req, res) => {
  const { totalAmount, isPaid, products, couponId, paymentStatus, addressId, purchaseDate, orderId } = req.body;
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const address = await storeUserAddressTable.findOne({ _id: addressId });
    if (!address) {
      return res.json({
        status: false,
        data: null,
        msg: `Address Required`
      })
    }
    let shippingAddress = {
      id: address._id ?? "",
      name: address?.name ?? "",
      email: address?.email ?? "",
      phone: address?.phone ?? "",
      streetAddress: address?.streetAddress ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      country: address?.country ?? "",
      pinCode: address?.pinCode ?? "",
    }
    const newOrders = new storeOrdesTable({
      user: user._id,
      totalAmount,
      isPaid,
      addressId,
      paymentStatus,
      couponId,
      products,
      orderId,
      purchaseDate,
      shippingAddress,
    });
    await newOrders.save();
    return res.json({
      status: true,
      data: {},
      msg: `New orders added succesfully`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Orders added in user's account`,
    });
  }
});

store.get("/getOrders", ValidateTokenForWeb, async (req, res) => {
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const allOrders = await storeOrdesTable
      .find({ user: user._id })
      .populate({
        path: "products.productId", select: "_id title featuredImage slug images salePrice regularPrice", populate: {
          path: "categories",
          select: "_id , title icon slug"
        }
      })
      .populate('couponId')
      .populate('addressId').sort({ createdAt: -1 });// not populated coupon
    let responseArr = await Promise.all(allOrders.map(async (item) => {
      let isReturn = 'notCancelled';
      if (item?.deliveryStatus == 'userCancelled' && item?.isPaid) {
        let returnExist = await storeReturnTable.findOne({ user: user?._id, storeOrderId: item?._id });
        if (returnExist?._id) {
          isReturn = 'exist'
        } else {
          isReturn = 'notExist'
        }
      }
      let payStatus = item?.paymentStatus;
      let paidStatus = item?.isPaid;
      if (item?.paymentStatus == 'pending') {
        Cashfree.PGFetchOrder("2022-09-01", item?._id).then(async (response) => {
          // console.log('Order fetched successfully:', response.data);
          if (response?.data.order_status == 'PAID') {
            const order = await storeOrdesTable.findOneAndUpdate({ _id: item?._id }, { paymentStatus: 'success', isPaid: true }, { new: true, lean: true });
            let productIdsToDelete = order?.products?.map((item) => item.productId);
            await storeCartTable.deleteMany({
              user: order?.user,
              'products.productId': { $in: productIdsToDelete }
            });
            payStatus = order?.paymentStatus;
            paidStatus = order?.isPaid;
          } else {
            payStatus = item?.paymentStatus;
            paidStatus = item?.isPaid;
          }
        }).catch((error) => {
          payStatus = item?.paymentStatus;
          paidStatus = item?.isPaid;
        })
      }
      // console.log(paidStatus , payStatus)
      let productsAmount = item?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0)
      let allAmount = item?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.regularPrice) * parseInt(currentValue?.quantity)), 0)
      // console.log( productsAmount , allAmount);

      let amount = parseFloat(parseFloat(productsAmount) - parseFloat(item?.deliveryCharges));
      let discount = 0;
      if (item?.couponId?._id) {
        if (item?.couponId?.couponType == 'fixed') {
          discount = parseFloat(item?.couponId?.couponValue);
        } else {
          discount = parseFloat(((parseFloat(productsAmount) * parseFloat(item?.couponId?.couponValue)) / 100))
        }
      }
      // console.log( moment(new Date(item?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY') == "Invalid date");
      let purchaseDate = moment(new Date(item?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY HH:mm:ss') != "Invalid date" ? moment(new Date(item?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY HH:mm:ss') : moment(item?.createdAt).format('DD-MM-YYYY HH:mm:ss') ?? "";

      return {
        id: item._id ?? "",
        storeOrderId: item?._id ?? "",
        couponId: item?.couponId?._id ?? "",
        products: item?.products?.map((item) => {
          return {
            id: item?.productId?._id ?? "",
            title: item?.productId?.title ?? "",
            featuredImage: item?.productId?.featuredImage ?? "",
            quantity: item?.quantity ?? "",
            slug: item?.productId?.slug ?? "",
            salePrice: parseFloat(item?.productId?.salePrice) ?? "",
            productAmount: parseFloat(parseFloat(item?.quantity) * parseFloat(item?.productId?.salePrice))?.toFixed(2),
            images: item?.productId?.images ?? [],
            category: { id: item?.productId?.categories[0]?._id ?? "", title: item?.productId?.categories[0]?.title ?? "", slug: item?.productId?.categories[0]?.slug ?? "", icon: item?.productId?.categories[0]?.icon ?? "" }
          }
        }),
        allAmount: parseFloat(allAmount)?.toFixed(2),
        productDiscount: parseFloat(parseFloat(allAmount) - parseFloat(productsAmount))?.toFixed(2),
        totalAmount: parseFloat((item?.totalAmount))?.toFixed(2) ?? "",
        orderId: item?.orderId ?? "",
        orderType: item?.orderType ?? "",
        deliveryCharges: parseFloat(item?.deliveryCharges)?.toFixed(2) ?? '0',
        isPaid: paidStatus ?? "",
        shippingAddress: item?.shippingAddress,
        // shippingAddress: {
        //   id: item?.addressId?._id ?? "",
        //   name: item?.addressId?.name ?? "",
        //   email: item?.addressId?.email ?? "",
        //   phone: item?.addressId?.phone ?? "",
        //   streetAddress: item?.addressId?.streetAddress ?? "",
        //   city: item?.addressId?.city ?? "",
        //   state: item?.addressId?.state ?? "",
        //   country: item?.addressId?.country ?? "",
        //   pinCode: item?.addressId?.pinCode ?? "",
        // } ?? {
        //   id: "",
        //   name: "",
        //   email: "",
        //   phone: "",
        //   streetAddress: "",
        //   city: "",
        //   state: "",
        //   country: "",
        //   pinCode: "",
        // },
        isRated: true,
        rating: "4",
        // paymentStatus: item?.paymentStatus ?? "",
        paymentStatus: payStatus ?? "",
        deliveryStatus: item?.deliveryStatus,
        invoice: item?.invoice ?? "",
        couponDiscount: parseFloat(parseFloat(discount))?.toFixed(2),
        purchaseDate: purchaseDate,
        // purchaseDate: moment(new Date(item?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY') != "Invalid Date" ? moment(new Date(item?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY') ?? "",
        deliveredDate: item?.deliveredDate ? moment(new Date(item?.deliveredDate)).format('DD-MM-YYYY HH:mm:ss') : "",
        returnDate: item?.returnDate ? moment(new Date(item?.returnDate)).format('DD-MM-YYYY HH:mm:ss') : "",
        dispatchDate: item?.dispatchDate ? moment(new Date(item?.dispatchDate)).format('DD-MM-YYYY HH:mm:ss') : "",
        cancelDate: item?.cancelDate ? moment(new Date(item?.cancelDate)).format('DD-MM-YYYY HH:mm:ss') : "",
        invoiceDate: item?.invoiceDate ? moment(new Date(item?.invoiceDate)).format('DD-MM-YYYY HH:mm:ss') : "",
        platform: item?.platform ?? "store",
        isReturn,
        awbNumber: item?.awbNumber ?? "",
        trackingId: item?.trackingId ?? "",
        trackingLink: item?.trackingLink ?? "",
      };
    }))
    return res.json({
      status: true,
      data: responseArr,
      // data : allOrders,
      msg: "All orders fetched for user",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Orders not fetched`,
    });
  }
});

store.get("/getStoreOrderById/:id", ValidateTokenForWeb, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Orders id not found.`,
    });
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const order = await storeOrdesTable
      .findOne({ _id: id })
      .populate('couponId')
      .populate("products.productId", "_id title featuredImage salePrice regularPrice").populate('addressId');
    if (order) {
      let productsAmount = order?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0)
      let allAmount = order?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.regularPrice) * parseInt(currentValue?.quantity)), 0)
      // console.log( productsAmount , allAmount);

      let amount = parseFloat(parseFloat(productsAmount) - parseFloat(order?.deliveryCharges));
      let discount = 0;
      if (order?.couponId?._id) {
        if (order?.couponId?.couponType == 'fixed') {
          discount = parseFloat(order?.couponId?.couponValue);
        } else {
          discount = parseFloat(((parseFloat(productsAmount) * parseFloat(order?.couponId?.couponValue)) / 100))
        }
      }
      // console.log(discount);
      // console.log(order?.deliveryCharges);
      return res.json({
        status: true,
        data: {
          id: order._id ?? "",
          products: order?.products?.map((item) => {
            return {
              id: item?.productId?._id ?? "",
              title: item?.productId?.title ?? "",
              featuredImage: item?.productId?.featuredImage ?? "",
              quantity: item?.quantity ?? "",
              salePrice: item?.productId?.salePrice ?? "",
              productAmount: parseFloat(parseFloat(item?.quantity) * parseFloat(item?.productId?.salePrice))?.toFixed(2)
            }
          }),
          // couponDetails: {
          //   couponCode: order?.couponId?.couponCode ?? "",
          //   couponType : order.couponId.couponType ?? "",
          //   couponValue : order?.couponId?.couponValue ?? "",
          //   expirationDate : order?.couponId?.expirationDate ??"" ,
          // },
          allAmount: parseFloat(allAmount)?.toFixed(2),
          productDiscount: parseFloat(parseFloat(allAmount) - parseFloat(productsAmount))?.toFixed(2),
          totalAmount: parseFloat((order?.totalAmount))?.toFixed(2) ?? "",
          couponId: order?.couponId?._id ?? "",
          orderId: order?.orderId ?? "",
          isPaid: order.isPaid ?? "",
          shippingAddress: order?.shippingAddress,
          // shippingAddress: {
          //   id: order?.addressId?._id ?? "",
          //   name: order?.addressId?.name ?? "",
          //   email: order?.addressId?.email ?? "",
          //   phone: order?.addressId?.phone ?? "",
          //   streetAddress: order?.addressId?.streetAddress ?? "",
          //   city: order?.addressId?.city ?? "",
          //   state: order?.addressId?.state ?? "",
          //   country: order?.addressId?.country ?? "",
          //   pinCode: order?.addressId?.pinCode ?? "",
          // } ?? {
          //   id: "",
          //   name: "",
          //   email: "",
          //   phone: "",
          //   streetAddress: "",
          //   city: "",
          //   state: "",
          //   country: "",
          //   pinCode: "",
          // },
          couponDiscount: parseFloat(parseFloat(discount))?.toFixed(2),
          paymentStatus: order?.paymentStatus ?? "",
          isRated: true,
          rating: "4",
          purchaseDate: moment(new Date(order?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY HH:mm:ss') ?? "",
          deliveredDate: order?.deliveredDate ? moment(new Date(order?.deliveredDate)).format('DD-MM-YYYY HH:mm:ss') : "",
          returnDate: order?.returnDate ? moment(new Date(order?.returnDate)).format('DD-MM-YYYY HH:mm:ss') : "",
          dispatchDate: order?.dispatchDate ? moment(new Date(order?.dispatchDate)).format('DD-MM-YYYY HH:mm:ss') : "",
          cancelDate: order?.cancelDate ? moment(new Date(order?.cancelDate)).format('DD-MM-YYYY HH:mm:ss') : "",
          invoiceDate: order?.invoiceDate ? moment(new Date(order?.invoiceDate)).format('DD-MM-YYYY HH:mm:ss') : "",
          invoice: order?.invoice ?? "",
          orderType: order?.orderType ?? "",
          deliveryCharges: parseFloat(order?.deliveryCharges)?.toFixed(2) ?? "",
          deliveryStatus: order?.deliveryStatus ?? "",
          awbNumber: order?.awbNumber ?? "",
          trackingId: order?.trackingId ?? "",
          trackingLink: order?.trackingLink ?? "",
          platform: order?.platform ?? 'store',
        },
        msg: `Order fetched successfully.`,
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Orders not found`,
    });
  }
});


store.get('/getAllOrder', isAdmin, async (req, res) => {
  const { type, orderType } = req.query;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    let query = {};
    if (type) {
      query = { deliveryStatus: type }
    }
    // if( type == 'processing'){
    //   query.orderType = 'COD';
    // }
    if (orderType) {
      query.orderType = orderType
    }
    const result = await storeOrdesTable.find({ ...query }).populate('couponId', 'couponCode couponType couponValue').populate('user', "_id FullName email mobileNumber").populate({
      path: 'addressId',
      populate: {
        path: 'user',
        select: '_id FullName email mobileNumber ',
      },
    }
    ).populate("products.productId", "_id title code").sort({ createdAt: -1 })
    const orders = await result?.map((item) => {
      // console.log(item.updatedAt);
      return {
        id: item._id ?? "",
        user: { id: item.user?._id ?? "", name: item.user?.FullName ?? "", email: item.user?.email ?? "", phone: item.user?.mobileNumber, },
        buyerDetails: { name: item.addressId?.name ?? "", email: item.addressId?.email ?? "", mobileNumber: item.addressId?.phone ?? "" },
        shippingAddress: `streetAddress-${item.shippingAddress?.streetAddress} city - ${item?.shippingAddress?.city} state-${item?.shippingAddress?.state} country-${item?.shippingAddress?.country} PinCode-${item?.shippingAddress?.pinCode}`,
        productDetails: item.products.map((item) => {
          return {
            id: item?.productId?._id ?? "",
            title: item?.productId?.title ?? "",
            code: item?.productId?.code ?? "",
            quantity: item?.quantity ?? "",
          }
        }),
        orderId: item?.orderId ?? "",
        deliveryStatus: item?.deliveryStatus ?? "",
        orderType: item?.orderType ?? "",
        deliveryCharges: item?.deliveryCharges ?? '0',
        totalAmount: item?.totalAmount ?? "",
        paymentStatus: item?.paymentStatus ?? "",
        isPaid: item?.isPaid ?? "",
        awbNumber: item?.awbNumber ?? "",
        trackingId: item?.trackingId ?? "",
        platform: item?.platform ?? "store",
        trackingLink: item?.trackingLink ?? "",
        couponDetails: { code: item?.couponId?.couponCode ?? "NA", type: item?.couponId?.couponType ?? "NA", value: item?.couponId?.couponValue ?? "NA" },
        // purchaseDate: moment(item?.purchaseDate , "DD-MM-YYYY HH:mm:ss").format('DD MMM YYYY HH:mm A') ?? "",
        // purchaseDate : `${moment(item?.createdAt).add(5, "hours")
        // .add(30, "minutes").format("DD-MMM-YYYY HH:mm A")}` ?? "",
        purchaseDate: `${moment(item?.createdAt).format("DD-MMM-YYYY HH:mm A")}` ?? "",
        updatedAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",

      }
    })

    res.json({
      status: true,
      data: orders,
      msg: "Store Orders fetched",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Orders not fetched",
    });
  }
})

store.put('/updateOrder/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: "Id Required!"
    })
  }
  const { deliveryStatus, awbNumber, trackingId, trackingLink, isPaid, txnId } = req.body;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const isOrder = await storeOrdesTable.findOne({ _id: id });
    if (!isOrder) {
      return res.json({
        status: false,
        data: null,
        msg: "Order not exist"
      })
    }
    // there is 
    let condition = {};
    if (deliveryStatus == 'delivered') {
      condition.deliveredDate = new Date();
    }
    if (deliveryStatus == 'cancelled') {
      condition.cancelDate = new Date();
    }
    const updateOrder = await storeOrdesTable.findByIdAndUpdate(id, { deliveryStatus, awbNumber, trackingId, trackingLink, isPaid, txnId, ...condition }, { new: true }).populate("user", "FullName email mobileNumber")
      .populate("products.productId", " title featuredImage regularPrice");

    let data = {
      orderId: updateOrder?.orderId,
      mobileNumber: updateOrder?.user?.mobileNumber,
      totalAmount: updateOrder?.totalAmount,
      product: updateOrder?.products?.map((item) => {
        return {
          title: item?.productId?.title ?? "",
          image: item?.productId?.featuredImage ?? "",
          qty: item?.quantity ?? "",
        }
      }),
      // orderStatus: updateOrder.deliveryStatus ?? "",
      orderStatus: (updateOrder?.deliveryStatus.charAt(0).toUpperCase() + updateOrder?.deliveryStatus.substring(1)).split(/(?=[A-Z])/).join(" ") ?? "",
      awbNumber: updateOrder?.awbNumber ?? "",
      trackingId: updateOrder?.trackingId ?? "",
      trackingLink: updateOrder?.trackingLink ?? "",
    }
    let to = updateOrder?.user?.email;
    let name = updateOrder?.user?.FullName;
    if (updateOrder?.deliveryStatus == deliveryStatus) {
      await sendEmail("orderDeliveryStatus", to, name, data);
    }

    res.json({
      status: true,
      data: updateOrder,
      msg: `Store Order delivery status changes into ${deliveryStatus} with gievn details`,
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Orders not fetched",
    });
  }
})

store.put("/cancelOrder/:id", ValidateTokenForWeb, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Orders id not found.`,
    });
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const isOrder = await storeOrdesTable.findOne({ _id: id }).populate("user", "FullName email mobileNumber");
    if (!isOrder) {
      return res.json({
        status: false,
        data: null,
        msg: `Order does not exist`
      })
    }
    if (isOrder.deliveryStatus != 'processing') {
      return res.json({
        status: false,
        data: null,
        msg: `Can't cancel order already ${(isOrder.deliveryStatus?.charAt(0).toUpperCase() + isOrder?.deliveryStatus?.substring(1)).split(/(?=[A-Z])/).join(" ") ?? ""}`
      })
    }
    const date = new Date();
    const updateOrder = await storeOrdesTable.findByIdAndUpdate(isOrder?._id, { deliveryStatus: "userCancelled", cancelDate: date }, { new: true, lean: true }).populate("user", "FullName email mobileNumber")
      .populate("products.productId", " title featuredImage regularPrice");
    let data = {
      orderId: updateOrder?.orderId,
      mobileNumber: updateOrder?.user?.mobileNumber,
      totalAmount: updateOrder?.totalAmount,
      product: updateOrder?.products?.map((item) => {
        return {
          title: item?.productId?.title ?? "",
          image: item?.productId?.featuredImage ?? "",
          qty: item?.quantity ?? "",
        }
      }),
      orderStatus: "Cancelled",
    }
    let to = updateOrder?.user?.email;
    let name = updateOrder?.user?.FullName;
    if (updateOrder.deliveryStatus == 'userCancelled') {
      await sendEmail("orderStatus", to, name, data)
      return res.json({
        status: true,
        data: null,
        msg: 'Order  cancelled'
      })
    }
    return res.json({
      status: false,
      data: null,
      msg: 'Order not cancelled'
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Orders not found`,
    });
  }
});

// < ------- Store Reviews ------- >
store.post("/postProductReview/:id", ValidateTokenForWeb, async (req, res) => {
  const { title, rating, description } = req.body;
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Product id not found`,
    });
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const product = await storeProductTable.findById(id);
    if (!product) {
      return res.json({
        status: false,
        data: null,
        msg: `Product not found`,
      });
    }

    const newReview = await productReviewsTable({
      user: user._id,
      product: product._id,
      title,
      rating,
      description,
    });
    const saveReview = await newReview.save();
    return res.json({
      status: true,
      data: saveReview,
      msg: "Review added in product section",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Review not added`,
    });
  }
});

store.get("/getProductReviews/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Product id not found`,
    });
  }
  try {
    const product = await storeProductTable.findById(id);
    if (!product) {
      return res.json({
        status: false,
        data: null,
        msg: `Product not found`,
      });
    }
    const allReviews = await productReviewsTable
      .find({ product: product._id })
      .populate("user", "FullName profilePhoto");
    return res.json({
      status: true,
      data: allReviews.map((item) => {
        return {
          // product : item.product ?? "",
          title: item.title ?? "",
          rating: item.rating ?? "",
          description: item.description ?? "",
          user: {
            FullName: item?.user?.FullName ?? "",
            profilePhoto: item?.user?.profilePhoto ?? "",
          },
        };
      }),
      msg: "All Reviews fetched for product",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Orders not fetched`,
    });
  }
});

// wishlist
store.post("/AddOrUpdateWishlist", ValidateTokenForWeb, async (req, res) => {
  const { productId, platform } = req.body;
  if (!['app', 'store', 'publication'].includes(platform)) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Platform`
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    if (!productId) {
      const wishlists = await storeWishlistTable
        .findOne({ user: user._id })
        .populate("products", "_id title featuredImage regularPrice salePrice");
      return res.json({
        status: true,
        // data: wishlists,
        data: wishlists?.products.map((item) => {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            featuredImage: item.featuredImage ?? "",
            salePrice: item.salePrice != "" ? `${parseInt(item.salePrice)}` : "0",
            regularPrice: item.regularPrice != "" ? `${parseInt(item.regularPrice)}` : "0",
            platform: item.platform ?? "",
          };
        }) ?? [],
        msg: "wishlist fetched",
      });
    } else {
      const id = mongoose.Types.ObjectId(productId);
      const validProduct = await storeProductTable.findOne({ _id: id });
      if (!validProduct) {
        return res.json({
          stratus: false,
          data: null,
          msg: "Product Not Found",
        });
      }
      const isWishlist = await storeWishlistTable.findOne({
        user: user._id,
        products: { $in: id },
      });
      if (isWishlist) {
        const result = await storeWishlistTable
          .findOneAndUpdate(
            { user: user._id },
            { $pull: { products: id }, },
            { new: true }
          )
          .populate(
            "products",
            "_id title featuredImage regularPrice salePrice"
          );
        return res.json({
          status: true,
          data: result?.products.map((item) => {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              regularPrice: item.regularPrice != "" ? `${parseInt(item.regularPrice)}` : "0",
              salePrice: item.salePrice != "" ? `${parseInt(item.salePrice)}` : "0",
              featuredImage: item.featuredImage ?? "",
              platform: item?.platform ?? "store",
            };
          }) ?? [], // return updated wishlist product
          // msg: "Wishlist updated"
          msg: "product removed from wishlist",
        });
      } else {
        const result = await storeWishlistTable
          .findOneAndUpdate(
            { user: user._id },
            { $push: { products: { $each: [id], $position: 0 } }, platform: platform },
            { upsert: true, new: true }
          )
          .populate(
            "products",
            "_id title featuredImage regularPrice salePrice"
          );

        return res.json({
          status: true,
          data: result?.products.map((item) => {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              regularPrice: item.regularPrice != "" ? `${parseInt(item.regularPrice)}` : "0",
              salePrice: item.salePrice != "" ? `${parseInt(item.salePrice)}` : "0",
              featuredImage: item.featuredImage ?? "",
              platform: item.platform ?? "store",
            };
          }) ?? [], // return updated wishlist product
          msg: "Product added to wishlist",
        });
      }
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Review not added`,
    });
  }
});

// delete form wishlist

// store cart

// add
store.post("/storeAddOrUpdateCart", ValidateTokenForWeb, async (req, res) => {
  let { productId, productQty, platform } = req.body;
  if (!['app', 'store', 'publication'].includes(platform)) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Platform`
    })
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    if (!productId && !productQty) {
      const result = await storeCartTable
        .findOne({ user: user._id })
        .populate({
          path: 'products.productId',
          select: "_id title featuredImage regularPrice salePrice maxPurchaseQty slug inStock",
          populate: {
            path: 'categories',
            select: "_id title slug"
          }

        })
      return res.json({
        status: true,
        data: result?.products.map((item) => {
          return {
            id: item?.productId?._id ?? "",
            title: item?.productId?.title ?? "",
            featuredImage: item?.productId?.featuredImage ?? "",
            slug: item?.productId?.slug ?? "",
            inStock: item?.productId?.inStock ?? "",
            salePrice: item?.productId?.salePrice != "" ? `${parseInt(item?.productId?.salePrice)}` : "0",
            regularPrice: item?.productId?.regularPrice != "" ? `${parseInt(item?.productId?.regularPrice)}` : "0",
            maxPurchaseQty: item?.productId?.maxPurchaseQty ?? "",
            category: { id: item?.productId?.categories[0]?._id ?? "", title: item?.productId?.categories[0]?.title ?? "", slug: item?.productId?.categories[0]?.slug ?? "" },
            categories: item?.productId?.categories?.map((cat) => { return { id: cat?._id ?? "", title: cat?.title ?? "", slug: cat?.slug ?? "" } }),
            quantity: item?.quantity ?? "",
            // platform  : item?.platform ?? 'store'
          };
        }) ?? [],
        msg: `Carts details fetched`,
      });
    }

    const validProduct = await storeProductTable.findOne({ _id: productId });
    if (parseInt(validProduct?.inStock) <= 0) {
      return res.json({
        stratus: false,
        data: null,
        msg: "Product is out of stock",
      });
    }
    if (parseInt(productQty) > parseInt(validProduct?.inStock)) {
      return res.json({
        stratus: false,
        data: null,
        msg: `This quantity is not in stock.`,
      });
    }
    if (!validProduct) {
      return res.json({
        stratus: false,
        data: null,
        msg: "Product Not Found",
      });
    }
    if (productQty) {
      if (parseInt(validProduct?.maxPurchaseQty) < parseInt(productQty)) {
        return res.json({
          status: false,
          data: null,
          msg: "Reached Maximum limit",
        });
      }
    }

    let cart = await storeCartTable.findOne({ user: user._id });
    if (!cart) {
      cart = new storeCartTable({ user: user._id, products: [], platform: platform });
    }
    const existingProducts = await cart?.products.find(
      (data) => data?.productId.toString() == productId
    );
    // console.log(existingProducts);
    // let productsArr = cart?.products;
    if (existingProducts && !productQty) {
      // existingProducts.quantity  = (parseInt(existingProducts.quantity) + parseInt(productQty)).toString();
      // existingProducts.quantity = parseInt(productQty).toString();
      return res.json({
        status: true,
        data: [],
        msg: 'Already exist in cart'
      })
    } else if (existingProducts && productQty) {
      // productsArr = productsArr?.map((item) =>{
      //   let quantity1 =  item?.quantity ;
      //   if( item?.productId?.toString() == productId?.toString()){
      //      quantity1 = parseInt(productQty).toString()
      //   }
      //   return {
      //     productId : item?.productId ,
      //     quantity : quantity1
      //   }
      // })
      existingProducts.quantity = parseInt(productQty).toString();
    } else if (!existingProducts && productQty && productId) {
      // productsArr.unshift({ productId: productId, quantity: productQty })
      cart.products.unshift({ productId: productId, quantity: productQty });
    }
    else {
      // productsArr.unshift({ productId: productId, quantity: "1" })
      cart.products.unshift({ productId: productId, quantity: "1" });
    }
    cart.platform = platform;
    // existingProducts.quantity  = (parseInt(productQty)).toString()
    await cart.save();
    // const newStoreCart = await storeCartTable.findOneAndUpdate( { _id : cart._id}, { $set : { products : productsArr}} , { new : true , lean : true }).populate({
    //   path: 'products.productId',
    //   select: "_id title featuredImage regularPrice salePrice maxPurchaseQty slug inStock",
    //   populate: {
    //     path: 'categories',
    //     select: "_id title slug"
    //   }

    // })
    const newStoreCart = await cart.populate({
      path: 'products.productId',
      select: "_id title featuredImage regularPrice salePrice maxPurchaseQty slug inStock",
      populate: {
        path: 'categories',
        select: "_id title slug"
      }

    })
    // console.log(newStoreCart)
    //   "products.productId",
    //   "_id title featuredImage regularPrice salePrice maxPurchaseQty slug"
    // );
    return res.json({
      status: true,
      data: newStoreCart?.products.map((item) => {
        return {
          id: item?.productId?._id ?? "",
          title: item?.productId?.title ?? "",
          featuredImage: item?.productId?.featuredImage ?? "",
          slug: item?.productId?.slug ?? "",
          inStock: item?.productId?.inStock ?? "",
          salePrice: item?.productId?.salePrice != "" ? `${parseInt(item?.productId?.salePrice)}` : "0",
          regularPrice: item?.productId?.regularPrice != "" ? `${parseInt(item?.productId?.regularPrice)}` : "0",
          category: { id: item?.productId?.categories[0]?._id ?? "", title: item?.productId?.categories[0]?.title ?? "", slug: item?.productId?.categories[0]?.slug ?? "" },
          categories: item?.productId?.categories?.map((cat) => { return { id: cat?._id ?? "", title: cat?.title ?? "", slug: cat?.slug ?? "" } }),
          maxPurchaseQty: item?.productId?.maxPurchaseQty ?? "",
          quantity: item?.quantity ?? "",
          // platform  : item?.platform ?? 'store'

        };
      }) ?? [],
      msg: "product added into Cart",
    });
  } catch (error) {
    // console.log(error.message);
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Cart operation not done`,
    });
  }
});

//delete From cart
store.delete(
  "/deleteProductFromCarts/:productId",
  ValidateTokenForWeb,
  async (req, res) => {
    const { productId } = req.params;
    if (!productId) {
      return res.json({
        status: false,
        data: null,
        msg: `ProductId  required`,
      });
    }
    try {
      const user = await findUserByUserId(req?.userId);
      if (!user) {
        return res.json({
          status: false,
          data: null,
          msg: `Not a user`,
        });
      }
      const userCart = await storeCartTable.findOne({ user: user._id, "products.productId": productId });

      if (!userCart) {
        return res.json({
          status: false,
          data: null,
          msg: `User Or product not found in cart`,
        });
      }
      const updatedCart = await storeCartTable
        .findOneAndUpdate(
          {
            user: user._id,
            "products.productId": productId,
          },
          {
            $pull: { products: { productId: productId } },
          },
          {
            new: true,
          }
        ).populate({
          path: 'products.productId',
          select: "_id title featuredImage regularPrice salePrice maxPurchaseQty slug",
          populate: {
            path: 'category',
            select: "_id title slug"
          }

        })

      // .populate(
      //   "products.productId",
      //   "_id title featuredImage regularPrice salePrice maxPurchaseQty"
      // );
      return res.json({
        status: true,
        data: updatedCart?.products.map((item) => {
          // console.log(item);
          return {
            id: item?.productId?._id ?? "",
            title: item?.productId?.title ?? "",
            featuredImage: item?.productId?.featuredImage ?? "",
            salePrice: item?.productId?.salePrice != "" ? `${parseInt(item?.productId?.salePrice)}` : "0",
            regularPrice: item?.productId?.regularPrice != "" ? `${parseInt(item?.productId?.salePrice)}` : "0",
            maxPurchaseQty: item?.productId?.maxPurchaseQty ?? "0",
            category: { id: item?.productId?.category?._id ?? "", title: item?.productId?.category?.title ?? "", slug: item?.productId?.category?.slug ?? "" },
            quantity: item?.quantity ?? "0",
          };
        }) ?? [],
        msg: "Product deleted from cart",
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || "Product not deleted from cart",
      });
    }
  }
);

store.post(
  "/addOrUpdateStoreAddress",
  ValidateTokenForWeb,
  async (req, res) => {
    const { addressId, name, email, phone, streetAddress, city, state, pinCode, country } =
      req.body;
    if (
      !name ||
      !email ||
      !phone ||
      !streetAddress ||
      !city ||
      !state ||
      !pinCode
      || !country
    ) {
      return res.json({
        status: false,
        data: null,
        msg: "Please provide required details",
      });
    }
    try {

      const user = await findUserByUserId(req?.userId);
      if (!user) {
        return res.json({
          status: false,
          data: null,
          msg: `Not a user`,
        });
      }
      // email update
      if (user?.email == "user@gmail.com" || user?.email == "") {
        let newUser = await UserTable.findByIdAndUpdate(user?._id, { email: email });
      }
      let phonenumber = /^\d{10}$/;
      if (!phone.match(phonenumber)) {
        return res.json({
          status: false,
          data: null,
          msg: "Please Check Your Phone Number",
        });
      }
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(email)) {
        return res.json({
          status: false,
          data: null,
          msg: `Please Enter a valid email!`
        })
      }

      if (addressId) {
        const isValid = await storeUserAddressTable.findOne({
          user: user._id,
          _id: addressId,
        });

        if (!isValid) {
          return res.json({
            status: false,
            data: null,
            msg: "Address not exist",
          });
        }

        const updatedAddress = await storeUserAddressTable.findOneAndUpdate(
          { user: user._id, _id: addressId },
          {
            name,
            email,
            phone,
            streetAddress,
            city,
            state,
            pinCode,
            country,
          },
          { new: true, lean: true }
        );
        return res.json({
          status: true,
          data: {
            id: updatedAddress._id ?? "",
            name: updatedAddress.name ?? "",
            email: updatedAddress.email ?? "",
            phone: updatedAddress.phone ?? "",
            streetAddress: updatedAddress.streetAddress ?? "",
            city: updatedAddress.city ?? "",
            state: updatedAddress.state ?? "",
            country: updatedAddress.country ?? "",
            pinCode: updatedAddress.pinCode ?? "",
          },
          msg: "Address updated successfully",
        });
      }
      const newAddress = new storeUserAddressTable({
        user: user._id,
        name,
        email,
        phone,
        streetAddress,
        city,
        state,
        pinCode,
        country,
      });
      const saveAddress = await newAddress.save();
      return res.json({
        status: true,
        data: {
          id: saveAddress._id ?? "",
          name: saveAddress.name ?? "",
          email: saveAddress.email ?? "",
          phone: saveAddress.phone ?? "",
          streetAddress: saveAddress.streetAddress ?? "",
          city: saveAddress.city ?? "",
          state: saveAddress.state ?? "",
          country: saveAddress.country ?? "",
          pinCode: saveAddress.pinCode ?? "",
        },
        msg: "Address saved successfully",
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || "Address not added",
      });
    }
  }
);

store.delete(
  "/deleteStoreAddress/:addressId",
  ValidateTokenForWeb,
  async (req, res) => {
    const { addressId } = req.params;
    if (!addressId) {
      return res.json({
        status: false,
        data: null,
        msg: "Address Id Required",
      });
    }
    try {
      const user = await findUserByUserId(req?.userId);
      if (!user) {
        return res.json({
          status: false,
          data: null,
          msg: `Not a user`,
        });
      }
      const isValid = await storeUserAddressTable.findOne({
        user: user._id,
        _id: addressId,
      });
      if (!isValid) {
        return res.json({
          status: false,
          data: null,
          msg: "Address not exist",
        });
      }

      // const deletedAddress = await storeUserAddressTable.findOneAndDelete({
      //   user: user._id,
      //   _id: addressId,
      // });
      const deletedAddress = await storeUserAddressTable.findOneAndUpdate({
        _id: addressId,
      }, { isActive: false });
      return res.json({
        status: true,
        data: deletedAddress,
        msg: "Address deleted successfully",
      });
    } catch (error) {
      return res.json({
        status: false,
        data: null,
        msg: error.message || "Address not Deleted",
      });
    }
  }
);

store.get("/getAllStoreAddress", ValidateTokenForWeb, async (req, res) => {
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const addresses = await storeUserAddressTable.find({ user: user._id, isActive: true });
    return res.json({
      status: true,
      data: addresses.map((item) => {
        return {
          id: item._id ?? "",
          name: item.name ?? "",
          email: item.email ?? "",
          phone: item.phone ?? "",
          streetAddress: item.streetAddress ?? "",
          city: item.city ?? "",
          state: item.state ?? "",
          country: item.country ?? "",
          pinCode: item.pinCode ?? "",
        };
      }) ?? [],
      msg: "Addresses fetched for user",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Address not fetched",
    });
  }
});

store.get("/getStoreAddressById/:addressId", ValidateTokenForWeb, async (req, res) => {
  const { addressId } = req.params;
  if (!addressId) {
    return res.json({
      status: false,
      data: null,
      msg: "Address Id Required",
    });
  }
  try {
    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not a user`,
      });
    }
    const address = await storeUserAddressTable.findOne({
      user: user._id,
      _id: addressId,
      isActive: true
    }, { __v: 0, createdAt: 0, updatedAt: 0 });
    return res.json({
      status: false,
      data: {
        id: address._id ?? "",
        name: address.name ?? "",
        email: address.email ?? "",
        phone: address.phone ?? "",
        streetAddress: address.streetAddress ?? "",
        city: address.city ?? "",
        state: address.state ?? "",
        country: address.country ?? "",
        pinCode: address.pinCode ?? "",
      },
      msg: "Address fetched",
    });

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Address not Deleted",
    });
  }
})

// Save Order Dettails

// storeAlert
// add alert
store.post("/addStoreAlert", isAdmin, async (req, res) => {
  const { title, link, linkWith, isActive } = req.body;
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
    if (link && link == 'product') {
      const validProduct = await storeProductTable.findOne({ _id: linkWith })
      if (!validProduct) {
        return res.json({
          status: false,
          data: null,
          msg: "Product not found.",
        });
      }
    }
    if (link && link == 'category') {
      const validCategory = await productCategoryTable.findOne({ _id: linkWith })
      if (!validCategory) {
        return res.json({
          status: false,
          data: null,
          msg: "Category not found.",
        });
      }
    }
    const newAlert = new storeAlertTable({
      admin: adminDetails._id,
      title,
      link,
      linkWith,
      isActive
    })
    const saveAlert = await newAlert.save();
    return res.json({
      status: true,
      data: saveAlert,
      msg: 'Store alert added successfully'
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store alert not added`
    })
  }
})
// update Alert
store.put("/updateStoreAlert/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id!`
    })
  }
  const { title, link, linkWith, isActive } = req.body;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    if (link && link == 'product') {
      const validProduct = await storeProductTable.findOne({ _id: linkWith })
      if (!validProduct) {
        return res.json({
          status: false,
          data: null,
          msg: "Product not found.",
        });
      }
    }
    if (link && link == 'category') {
      const validCategory = await productCategoryTable.findOne({ _id: linkWith })
      if (!validCategory) {
        return res.json({
          status: false,
          data: null,
          msg: "Category not found.",
        });
      }
    }
    const validAlert = await storeAlertTable.findOne({ _id: id });
    if (!validAlert) {
      return res.json({
        status: false,
        data: null,
        msg: 'Store Alert not found'
      })
    }
    const updatedAlert = await storeAlertTable.findByIdAndUpdate(validAlert?._id, {
      // admin: adminDetails._id ,
      title,
      link,
      linkWith,
      isActive
    }, { new: true, lean: true })
    return res.json({
      status: true,
      data: updatedAlert,
      msg: 'Store alert updated successfully'
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store alert not updated`
    })
  }
})
// getAll for store
store.get("/getAllStoreAlerts", async (req, res) => {
  try {
    const alerts = await storeAlertTable.find({ isActive: true });
    let responseData = await Promise.all(
      alerts.map(async (item) => {
        if (item.link == "product") {
          const product = await storeProductTable.findById(item?.linkWith);
          if (!product) {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              link: item.link ?? "None",
              linkWith: { id: "NA", title: "NA", slug: "NA" },
            };
          }
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            link: item.link ?? "None",
            linkWith: {
              id: product._id ?? "NA",
              title: product.title ?? "NA",
              slug: product.slug ?? "NA"
            },
          };
        } else if (item.link == "category") {
          const category = await productCategoryTable.findOne({
            _id: item?.linkWith,
          });
          if (!category) {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              link: item.link ?? "None",
              linkWith: { id: "NA", title: "NA", slug: "NA" },
            };
          }
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            link: item.link ?? "None",
            linkWith: {
              id: category._id ?? "NA",
              title: category.title ?? "NA",
              slug: category.slug ?? "NA"

            },
          };
        } else {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            link: "None",
            linkWith: { id: "NA", title: "NA", slug: "NA" },
          };
        }
      })
    );

    return res.json({
      status: true,
      data: responseData ?? [],
      msg: 'All store alert fetched'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || 'Store alerts not fetched'
    })
  }
})

// getAll store for Admin
store.get("/getStoreAlerts", isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const alerts = await storeAlertTable.find({}).populate("admin", "_id FullName Role");
    let responseData = await Promise.all(
      alerts.map(async (item) => {
        if (item.link == "product") {
          const product = await storeProductTable.findById(item?.linkWith);
          if (!product) {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              link: item.link ?? "None",
              linkWith: { id: "NA", title: "NA" },
              admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
              isActive: item.isActive ?? "",
              createdAt:
                `${moment(item.createdAt)
                  .add(5, "hours")
                  .add(30, "minutes")
                  .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
            };
          }
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            link: item.link ?? "None",
            linkWith: {
              id: product._id ?? "NA",
              title: product.title ?? "NA",
            },
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            isActive: item.isActive ?? "",
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        } else if (item.link == "category") {
          const category = await productCategoryTable.findOne({
            _id: item?.linkWith,
          });
          if (!category) {
            return {
              id: item._id ?? "",
              title: item.title ?? "",
              link: item.link ?? "None",
              linkWith: { id: "NA", title: "NA" },
              isActive: item.isActive ?? "",
              admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
              createdAt:
                `${moment(item.createdAt)
                  .add(5, "hours")
                  .add(30, "minutes")
                  .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
            };
          }
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            link: item.link ?? "None",
            linkWith: {
              id: category._id ?? "NA",
              title: category.title ?? "NA",
            },
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            isActive: item.isActive ?? "",
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        } else {
          return {
            id: item._id ?? "",
            title: item.title ?? "",
            link: item.link ?? "None",
            linkWith: { id: "NA", title: "NA" },
            isActive: item.isActive ?? "",
            admin: { name: item?.admin?.FullName ?? "", role: item?.admin?.Role ?? "" },
            createdAt:
              `${moment(item.createdAt)
                .add(5, "hours")
                .add(30, "minutes")
                .format("DD-MM-YYYY HH:mm:ss")}` ?? "",
          };
        }
      })
    );

    return res.json({
      status: true,
      data: responseData ?? [],
      msg: 'All store alert fetched'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || 'Store alerts not fetched'
    })
  }
})

// get storeAlert by Id
store.get("/getStoreAlertById/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id!`
    })
  }
  try {
    const alert = await storeAlertTable.findOne({ _id: id });
    if (!alert) {
      return res.json({
        status: false,
        data: null,
        msg: 'Alert not exists'
      })
    }
    if (alert.link == 'product') {
      const validProduct = await storeProductTable.findOne({ _id: alert?.linkWith })
      if (!validProduct) {
        return res.json({
          status: false,
          data: null,
          msg: "Product not found.",
        });
      }
      return res.json({
        status: true,
        data: {
          id: alert._id ?? "",
          title: alert.title ?? "",
          link: alert.link ?? "None",
          linkWith: { id: validProduct?._id ?? "NA", title: validProduct?.title ?? "NA" },
          createdAt: `${moment(alert.createdAt).add(5, "hours").add(30, "minutes").format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: 'Store Alert fetch'
      })
    }
    else if (alert.link == 'category') {
      const validCategory = await productCategoryTable.findOne({ _id: alert.linkWith })
      if (!validCategory) {
        return res.json({
          status: false,
          data: null,
          msg: "Category not found.",
        });
      }
      return res.json({
        status: true,
        data: {
          id: alert._id ?? "",
          title: alert.title ?? "",
          link: alert.link ?? "None",
          linkWith: { id: validCategory?._id ?? "NA", title: validCategory?.title ?? "NA" },
          createdAt: `${moment(alert.createdAt).add(5, "hours").add(30, "minutes").format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: 'Store Alert fetch'
      })
    }
    else {
      return res.json({
        status: true,
        data: {
          id: alert._id ?? "",
          title: alert.title ?? "",
          link: "None",
          type: "none",
          linkWith: { id: "NA", title: "NA" },
          createdAt: `${moment(alert.createdAt).add(5, "hours").add(30, "minutes").format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: 'Store Alert fetch'
      })
    }




  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store alert not updated`
    })
  }
})

store.get("/getStoreAlertForAdmin/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id!`
    })
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const alert = await storeAlertTable.findOne({ _id: id });
    if (!alert) {
      return res.json({
        status: false,
        data: null,
        msg: 'Alert not exists'
      })
    }
    if (alert.link == 'product') {
      const validProduct = await storeProductTable.findOne({ _id: alert?.linkWith })
      if (!validProduct) {
        return res.json({
          status: false,
          data: null,
          msg: "Product not found.",
        });
      }
      return res.json({
        status: true,
        data: {
          id: alert._id ?? "",
          title: alert.title ?? "",
          link: alert.link ?? "None",
          isActive: alert?.isActive ?? false,
          linkWith: { id: validProduct?._id ?? "NA", title: validProduct?.title ?? "NA" },
          createdAt: `${moment(alert.createdAt).add(5, "hours").add(30, "minutes").format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: 'Store Alert fetch'
      })
    }
    else if (alert.link == 'category') {
      const validCategory = await productCategoryTable.findOne({ _id: alert.linkWith })
      if (!validCategory) {
        return res.json({
          status: false,
          data: null,
          msg: "Category not found.",
        });
      }
      return res.json({
        status: true,
        data: {
          id: alert._id ?? "",
          title: alert.title ?? "",
          link: alert.link ?? "None",
          isActive: alert?.isActive ?? false,
          linkWith: { id: validCategory?._id ?? "NA", title: validCategory?.title ?? "NA" },
          createdAt: `${moment(alert.createdAt).add(5, "hours").add(30, "minutes").format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: 'Store Alert fetch'
      })
    }
    else {
      return res.json({
        status: true,
        data: {
          id: alert._id ?? "",
          title: alert.title ?? "",
          link: "none",
          isActive: alert?.isActive ?? false,
          linkWith: { id: "NA", title: "NA" },
          createdAt: `${moment(alert.createdAt).add(5, "hours").add(30, "minutes").format("DD-MM-YYYY HH:mm:ss")}` ?? "",
        },
        msg: 'Store Alert fetch'
      })
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store alert not updated`
    })
  }
})

// delete  by Id
store.delete("/deleteStoreAlert/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id!`
    })
  }
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }

    const validAlert = await storeAlertTable.findOne({ _id: id });
    if (!validAlert) {
      return res.json({
        status: false,
        data: null,
        msg: 'Store Alert not found'
      })
    }
    const alert = await storeAlertTable.findByIdAndDelete(id)
    await savePanelEventLogs(
      adminDetails?._id,
      "deleteStoreAlert",
      "delete",
      validAlert
    )
    return res.json({
      status: true,
      data: alert,
      msg: 'Store alert deleted successfully'
    })


  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store alert not deleted`
    })
  }

})
store.get("/searchProduct", ValidateTokenForWeb, async (req, res) => {
  const { search, limit } = req.query;
  const n = parseInt(limit) || 5;
  let query = {
    isActive: true,
    isTrash: false,
    inStock: { $gte: "1" },
  };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { desc: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { badge: { $regex: search, $options: "i" } },
    ]
  }
  try {

    const aggregationPipeline = [
      {
        $match: query,
      },
      // {
      //   $lookup: {
      //     from: 'productcategorytables',
      //     localField: 'category',
      //     foreignField: '_id',
      //     as: 'categoryDetails',
      //   },
      // },
      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: "productreviewstables",
          let: { product: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$product"],
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
          product: "$$ROOT",
          // categoryDetails: '$categoryDetails',
          categories: '$categories',
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
      },
      {
        $limit: n,
      },
    ];
    const allProduct = await storeProductTable.aggregate(aggregationPipeline);

    const user = await findUserByUserId(req?.userId);
    if (!["", null, undefined, " "]?.includes(search)) {
      const storeLogs = new userStoreLogsTable({
        user: user ? user?._id : null,
        searchText: search,
        searchQuery: query,
        type: 'store'
        // user: user?._id,
        // searchText: search,
        // searchQuery: query
      })
      await storeLogs.save();
    }


    const currentDate = new Date();
    const products = await Promise.all(allProduct.map(async (item) => {
      const isSaleLive =
        currentDate >= new Date(item.product.schedule.startDate) &&
        currentDate <= new Date(item.product.schedule.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item.product._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item.product._id ?? "",
        title: item.product.title ?? "",
        slug: item.product.slug ?? "",
        // category: { id: item.categoryDetails[0]?._id ?? "", title: item.categoryDetails[0]?.title ?? "", slug: item.categoryDetails[0]?.slug ?? "" },
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item.categories?.map((cat) => { return { id: cat?._id ?? "", title: cat?.title ?? "", slug: cat?.slug ?? "" } }),
        featuredImage: item.product.featuredImage ?? "",
        images: item.product.images ?? [],
        code: item.product.code ?? "",
        regularPrice: item.product.regularPrice != "" ? `${parseInt(item.product.regularPrice)}` : "0",
        isSaleLive: isSaleLive,
        shareLink: { link: item?.product?.shareLink?.link ?? "", text: item?.product?.shareLink?.text ?? "" },
        maxPurchaseQty: item.product.maxPurchaseQty ?? "",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        language: item.product.language ?? "",
        salePrice: item.product.salePrice != "" ? `${parseInt(item.product.salePrice)}` : "0",
        badge: item.product.badge ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));

    if (allProduct) {
      return res.json({
        status: true,
        data: products,
        msg: "All product details response fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

store.get("/getAllTxn", isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }

    // const txns = await storeTxnTable.find({}).populate('user', " _id FullName email mobileNumber").populate("orderId").sort({ createdAt: -1 });
    // console.log(txns);
    const txns = await storeOrdesTable.find({}).populate('couponId', 'couponCode couponType couponValue').populate('user', " _id FullName email mobileNumber").sort({ createdAt: -1 });
    return res.json({
      status: true,
      data: txns?.map((item) => {
        // console.log(item?.orderId)
        return {
          id: item._id ?? "",
          user: { id: item.user?._id ?? "", name: item.user?.FullName ?? "", email: item.user?.email ?? "", phone: item.user?.mobileNumber, },
          orderId: item?.orderId ?? "",
          txnAmount: item?.totalAmount ?? "",
          txnId: item?.txnId ?? "",
          isPaid: item?.isPaid ?? "",
          orderType: item?.orderType ?? "",
          deliveryCharges: item?.deliveryCharges ?? "0",
          txnDate: moment(new Date(item?.purchaseDate)).add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY HH:mm:ss') ?? "",
          couponDetails: { code: item?.couponId?.couponCode ?? "NA", type: item?.couponId?.couponType ?? "NA", value: item?.couponId?.couponValue ?? "NA" },
        }
      }) ?? [],
      msg: 'Store Transaction fetched.'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Store alert not deleted`
    })
  }
})

store.get('/getAllCartDetails', isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const result = await storeCartTable.find({}).populate('user', "_id FullName email mobileNumber").populate("products.productId", "_id title code").sort({ createdAt: -1 })
    // const result1 = await storeCartTable.aggregate([
    //   {
    //     $facet :{
    //       carts : [
    //         {$sort : {createdAt : -1}},
    //         { $skip : (page - 1 ) * pageSize},
    //         { $limit : pageSize},



    //       ],
    //       totalCount : [

    //       ]
    //     }
    //   }
    // ])
    const responseData = await result?.map((item, index) => {
      // console.log(item.updatedAt);
      return {
        sNo: index + 1,
        id: item._id ?? "",
        platform: item.platform ?? "",
        user: { id: item.user?._id ?? "", name: item.user?.FullName ?? "", email: item.user?.email ?? "", phone: item.user?.mobileNumber, },
        buyerDetails: { name: item.addressId?.name ?? "", email: item.addressId?.email ?? "", mobileNumber: item.addressId?.phone ?? "" },
        productDetails: item.products.map((item) => {
          return {
            id: item?.productId?._id ?? "",
            title: item?.productId?.title ?? "",
            quantity: item?.quantity ?? "",
            code: item?.productId?.code ?? ""
          }
        }),
        createdAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",
        updatedAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",

      }
    })

    res.json({
      status: true,
      data: responseData ?? [],
      msg: "Store Cart details fetched",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Orders not fetched",
    });
  }
})

store.get('/getAllWishlistDetails', isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const result = await storeWishlistTable.find({}).populate('user', "_id FullName email mobileNumber").populate("products", "_id title").sort({ createdAt: -1 })
    const responseData = await result?.map((item, index) => {
      // console.log(item.updatedAt);
      return {
        sNO: index + 1,
        id: item._id ?? "",
        platform: item.platform ?? "",
        user: { id: item.user?._id ?? "", name: item.user?.FullName ?? "", email: item.user?.email ?? "", phone: item.user?.mobileNumber, },
        productDetails: item.products.map((item2) => {
          return {
            id: item2?._id ?? "",
            title: item2?.title ?? "",
            // quantity: item?.quantity ?? "",
          }
        }),
        createdAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",
        updatedAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",

      }
    })

    res.json({
      status: true,
      data: responseData,
      msg: "Store Wishlist fetched",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Wishlist not fetched",
    });
  }
})

store.get('/getStoreUser', isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const result = await UserTable.find({ $or: [{ platform: { $in: ['store', 'publication'] }, utm_source: { $eq: "sdstorewebsite" } }, { utm_medium: { $eq: "sdstorewebsite" } }] })
    // const result = await UserTable.find({});
    const responseData = result?.map((item, index) => {
      return {
        sNO: index + 1,
        id: item._id ?? "",
        name: item?.FullName ?? "",
        email: item?.email ?? "",
        mobileNumber: item?.mobileNumber ?? "",
        userId: item?.userId ?? "",
        utm_medium: item?.utm_medium ?? "",
        utm_source: item?.utm_source ?? "",
        utm_campaign: item?.utm_campaign ?? "",
        createdAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",
        updatedAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",

      }
    })

    res.json({
      status: true,
      data: responseData,
      msg: "Store User fetched",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Wishlist not fetched",
    });
  }
})

store.put("/addTrashField", isAdmin, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    const products = await storeProductTable.updateMany({ _id: { $exists: true } }, { isTrash: false });
    return res.json({
      status: true,
      data: null,
      msg: `All Product trash false added`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

})

store.get('/getSiteMap', async (req, res) => {
  try {
    const products = await storeProductTable.find({ isActive: true, isTrash: false }).populate('categories', 'slug').select('slug category');
    const categories = await productCategoryTable.find({ isActive: true, parentCategory: null }).select('slug');
    const blogs = await blogsTable.find({ isActive: true, platform: 'store' }).select('slug');
    let urls = [];
    let product = []
    let category = []
    let blog = []
    let homeCat = []
    let subCat = [];
    for (let i = 0; i < products.length; i++) {
      let url = `https://store.sdcampus.com/p/${products[i]?.categories[0]?.slug}/${products[i]?.slug}`
      if (url.includes('undefined')) {
        continue;
      }
      product.push({
        cat: products[i]?.categories[0]?.slug,
        slug: products[i]?.slug
      });
    }
    for (let i = 0; i < categories.length; i++) {
      let url = `/${categories[i]?.slug}`
      if (url.includes('undefined')) {
        continue;
      }
      category.push(url);
      const allSubCategory = await productCategoryTable.find({ parentCategory: categories[i] });
      if (allSubCategory?.length > 0) {
        for (let subCategory of allSubCategory) {
          let subUrl = `/${categories[i]?.slug}/${subCategory?.slug}`
          if (subUrl.includes('undefined')) {
            continue;
          }
          subCat.push(subUrl);
        }
      }
    }
    for (let i = 0; i < blogs.length; i++) {
      let url = `/${blogs[i]?.slug}`
      if (url.includes('undefined')) {
        continue;
      }
      blog.push(url);
    }
    // get markettingCategory
    homeCat.push(`/book`)
    homeCat.push(`/popular-products`)
    homeCat.push(`/stationery-accessories`);
    homeCat.push(`/high-demanding-combos`)
    homeCat.push(`/high-demanding-product`)
    return res.json({
      status: true,
      data: {
        product,
        category,
        blog,
        homeCat,
        subCat
      },
      msg: 'Store Url fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.post("/addReturn", ValidateToken, async (req, res) => {
  const { storeOrderId, refundAmount, bankName, fullName, accountNumber, ifsc } = req.body;
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decode?.studentId);
    if (!userDetails) {
      return res.json({
        status: false,
        data: null,
        msg: "Not An User"
      })
    }
    const storeOrderExist = await storeOrdesTable.findOne({ _id: storeOrderId });
    if (!storeOrderExist) {
      return res.json({
        status: false,
        data: null,
        msg: `Store Order not exist`
      })
    }
    const isExist = await storeReturnTable.findOne({ user: userDetails?._id, storeOrderId: storeOrderId });
    if (isExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'Your Order Return Already Saved '
      })
    }
    let amount = parseFloat(storeOrderExist?.totalAmount) - parseFloat(storeOrderExist.deliveryCharges);
    const newReturn = new storeReturnTable({
      user: userDetails?._id,
      storeOrderId,
      refundAmount: amount,
      bankName,
      accountNumber,
      fullName,
      ifsc
    })
    // const saveRefund = 
    await newReturn.save();

    return res.json({
      status: true,
      data: null,
      msg: 'Account Details Saved for refund'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.get("/getReturnDetails/:id", ValidateToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const user = await findUserByUserId(decode?.studentId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not An User`
      })
    }
    const returnDetails = await storeReturnTable.findOne({ storeOrderId: id, user: user?._id });
    return res.json({
      status: true,
      data: {
        id: returnDetails?._id ?? "",
        bankName: returnDetails?.bankName ?? "",
        fullName: returnDetails?.fullName ?? "",
        accountNumber: returnDetails?.accountNumber,
        ifsc: returnDetails?.ifsc,
        refundAmount: returnDetails?.refundAmount,
      },
      msg: `Return Details fetched`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.get("/returnDetails/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const user = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not An Admin`
      })
    }
    const returnDetails = await storeReturnTable.findOne({ storeOrderId: id });
    if (!returnDetails) {
      return res.json({
        status: false,
        data: null,
        msg: 'There is no bank details'
      })
    }
    return res.json({
      status: true,
      data: {
        id: returnDetails?._id ?? "",
        bankName: returnDetails?.bankName ?? "",
        fullName: returnDetails?.fullName ?? "",
        accountNumber: returnDetails?.accountNumber,
        ifsc: returnDetails?.ifsc,
        refundAmount: returnDetails?.refundAmount,
        isRefund: returnDetails?.isRefund ?? false,
      },
      msg: `Return Details fetched`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.put("/makePaid/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Id`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const user = await findAdminTeacherUsingUserId(decode?.studentId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: `Not An Admin`
      })
    }
    const returnDetails = await storeReturnTable.findByIdAndUpdate(id, { isRefund: true }, { new: true, lean: true });
    if (!returnDetails) {
      return res.json({
        status: false,
        data: null,
        msg: 'Status not changed into refunded'
      })
    }
    return res.json({
      status: true,
      data: {
        id: returnDetails?._id ?? "",
        bankName: returnDetails?.bankName ?? "",
        fullName: returnDetails?.fullName ?? "",
        accountNumber: returnDetails?.accountNumber,
        ifsc: returnDetails?.ifsc,
        refundAmount: returnDetails?.refundAmount,
        isRefund: returnDetails?.isRefund ?? false,
      },
      msg: `Status changed into refunded`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.get('/getAllOrderForAdmin', isAdmin, async (req, res) => {
  let { type, platform, startDate, endDate } = req.query;
  // let { type } = req.query;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    let query = {};
    if (type == 'new') {
      query.$or = [
        { orderType: 'COD' },
        { isPaid: true }
      ];
      query.deliveryStatus = 'processing';
    }
    if (type == 'all') {
      query.$or = [
        { orderType: 'COD' },
        { isPaid: true }
      ];
      // query.isPaid = true ;
    }
    if (type == 'UnFulFillable') {
      query.$and = [
        { orderType: { $ne: 'COD' } },
        { isPaid: false }
      ];
    }
    if (type == 'packed') {
      // query.deliveryStatus = 'placed'
      query.deliveryStatus = 'packed'
    }
    if (type == 'readyToShipped') {
      query.deliveryStatus = 'shipped'
    }
    if (type == 'cancelled') {
      query.$or = [
        { deliveryStatus: 'userCancelled' },
        { deliveryStatus: 'cancelled' }
      ]
    }
    if (type == 'return') {
      query.$or = [
        { deliveryStatus: 'customerReturn' },
        { deliveryStatus: 'courierReturn' }
      ]
    }
    if (type == 'delivered') {
      query.deliveryStatus = 'delivered'
    }
    const result = await storeOrdesTable.find({ ...query }).populate('couponId', 'couponCode couponType couponValue').populate('user', "_id FullName email mobileNumber").populate({
      path: 'addressId',
      populate: {
        path: 'user',
        select: '_id FullName email mobileNumber ',
      },
    }
    ).populate("products.productId", "_id title code").sort({ createdAt: -1 })
    const orders = await result?.map((item) => {
      // console.log(item.updatedAt);
      return {
        id: item._id ?? "",
        user: { id: item.user?._id ?? "", name: item.user?.FullName ?? "", email: item.user?.email ?? "", phone: item.user?.mobileNumber, },
        buyerDetails: { name: item.shippingAddress?.name ?? "", email: item.shippingAddress?.email ?? "", mobileNumber: item.shippingAddress?.phone ?? "" },
        shippingAddress: `name- ${item.shippingAddress?.name} Mobile No.:${item.shippingAddress?.phone} streetAddress-${item.shippingAddress?.streetAddress} city - ${item?.shippingAddress?.city} state-${item?.shippingAddress?.state} country-${item?.shippingAddress?.country} PinCode-${item?.shippingAddress?.pinCode}`,
        productDetails: item.products.map((item) => {
          return {
            id: item?.productId?._id ?? "",
            title: item?.productId?.title ?? "",
            code: item?.productId?.code ?? "",
            quantity: item?.quantity ?? "",
          }
        }),
        orderId: item?.orderId ?? "",
        deliveryStatus: item?.deliveryStatus ?? "",
        orderType: item?.orderType ?? "",
        deliveryCharges: item?.deliveryCharges ?? '0',
        totalAmount: item?.totalAmount ?? "",
        paymentStatus: item?.paymentStatus ?? "",
        isPaid: item?.isPaid ?? "",
        awbNumber: item?.awbNumber ?? "",
        trackingId: item?.trackingId ?? "",
        trackingLink: item?.trackingLink ?? "",
        couponDetails: { code: item?.couponId?.couponCode ?? "NA", type: item?.couponId?.couponType ?? "NA", value: item?.couponId?.couponValue ?? "NA" },
        // purchaseDate: moment(item?.purchaseDate , "DD-MM-YYYY HH:mm:ss").format('DD MMM YYYY HH:mm A') ?? "",
        // purchaseDate : `${moment(item?.createdAt).add(5, "hours")
        // .add(30, "minutes").format("DD-MMM-YYYY HH:mm A")}` ?? "",
        purchaseDate: `${moment(item?.createdAt).format("DD-MMM-YYYY HH:mm A")}` ?? "",
        updatedAt: `${moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
          }` ?? "",
        platform: item?.platform ?? "",
      }
    })
    res.json({
      status: true,
      data: orders,
      msg: "Store Orders fetched",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Orders not fetched",
    });
  }
})

store.get("/getSearchQuery", isAdmin, async (req, res) => {
  const { type } = req.query;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }

    const queries = await userStoreLogsTable.find({ type: type }).populate('user', '_id FullName email mobileNumber').sort({ createdAt: -1 });
    return res.json({
      status: true,
      data: queries?.map((item, index) => {
        return {
          sno: index + 1,
          id: item?._id ?? "",
          type: item?.type ?? "",
          userDetails: { name: item?.user?.FullName ?? "NA", email: item?.user?.email ?? "", phone: item?.user?.mobileNumber ?? "" },
          searchText: item?.searchText ?? "",
          searchQuery: item?.searchQuery,
        }
      }),
      msg: 'All Logs fetched'
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.post("/partialUpdateProductsFromExcel", upload.single('file'), isAdmin, async (req, res) => {
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
    const file = req.file;
    if (!file) {
      return res.json({
        status: false,
        data: null,
        msg: "No file uploaded",
      });
    }
    const allowedFileTypes = ['.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname);
    if (!allowedFileTypes.includes(fileExtension)) {
      return res.json({
        status: false,
        data: null,
        msg: `"Invalid file type. Only Excel files (.xls, .xlsx) are allowed."`,
      });
    }
    const workbook = xlsjs.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const workSheet = workbook.Sheets[sheetName];
    const data = xlsjs.utils.sheet_to_json(workSheet, { header: 1 });
    let actualColumns = Object.values(data[0]);
    actualColumns = actualColumns.map((item) => item.trim());
    const expectedColumns = [
      'code',
      'regularPrice',
      'salePrice',
      'inStock',
    ];
    const missingColumns = expectedColumns.filter((column) => !actualColumns.includes(column));
    if (missingColumns.length > 0) {
      return res.json({
        status: false,
        data: null,
        msg: `Missing columns in the Excel file: ${missingColumns.join(", ")}`
      })
    }
    let successCount = [];
    let failureCount = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      row = row.map((cell) => cell.toString()?.trim());
      if (row.filter((cell) => cell !== "").length === 0) {
        continue;
      }
      const codeExist = await storeProductTable.findOne({ code: row[0] })
      if (!codeExist) {
        return res.json({
          status: false,
          data: null,
          msg: `Product not exist with code ${row[0]}`
        })
      }
      if (parseInt(row[2]) > parseInt(row[1])) {
        return res.json({
          status: false,
          data: null,
          msg: `All Product's sale price always less than regular price`
        })
      }

      let product = {
        admin: adminDetails?._id,
        code: row[0],
        regularPrice: row[1],
        salePrice: row[2],
        inStock: row[3],
      }
      let updateProduct = "";
      updateProduct = await storeProductTable.findOneAndUpdate({ code: product.code }, { ...product }, { new: true });
      if (!updateProduct) {
        failureCount.push({ code: product?.code });
      } else {
        successCount.push({ code: product?.code, });
      }

    }
    // console.log(saveProducts);
    return res.json({
      status: true,
      data: { totalProducts: data.length - 1, successCount, failureCount },
      msg: `All Products updated succesfully`,
    });

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

store.post('/addRecentViewed', ValidateTokenForWeb, async (req, res) => {
  let { productIds } = req.body;
  try {
    const user = await findUserByUserId(req.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an User",
      });
    }
    //  filter unique _id
    // console.log(productIds)
    productIds = productIds?.filter((item) => ![undefined, null, ""]?.includes(item)).map(objId => objId.toString())
    productIds = [...new Set(productIds)];

    const isRecent = await recentViewedTable.findOne({ user: user?._id })
    // console.log(isRecent);
    if (!isRecent) {
      const newRecent = new recentViewedTable({
        user: user?._id,
        products: productIds
      })
      await newRecent.save();
    } else {
      // let isProductExist =  isRecent?.products?.find((item) => item?.toString() == productId?.toString())
      // if( !isProductExist){
      let products = isRecent?.products;
      // let products = isRecent?.products?.slice(0 , 15) ;
      productIds = productIds.concat(products);
      productIds = productIds.map(objId => objId.toString())
      productIds = [...new Set(productIds)];
      //  console.log(productIds);

      // products.unshift(productId);
      // await recentViewedTable.findByIdAndUpdate( isRecent._id , { $addToSet :{ products: { $each : [productId]} }})
      await recentViewedTable.findByIdAndUpdate(isRecent._id, { products: productIds })

      // }
    }
    return res.json({
      status: true,
      data: null,
      msg: 'Product added in recent viewed'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.get("/recentViewedProduct", ValidateTokenForWeb, async (req, res) => {
  const { limit } = req.query;
  try {
    const n = parseInt(limit) || 15;

    const user = await findUserByUserId(req?.userId);
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an User'
      })
    }
    const recentViewed = await recentViewedTable.findOne({ user: user._id }).populate('products');
    let productIds = recentViewed?.products.map((item) => { return mongoose.Types.ObjectId(item) });
    productIds = productIds?.map((item) => mongoose.Types.ObjectId(item));
    // console.log(productIds)
    let wieghtArr = [];
    let aggregation = {};
    if (productIds && productIds.length > 0) {
      const query = {
        _id: { $in: productIds },
        // _id : productIds?.map((item) => mongoose.Types.ObjectId(item)),
        isActive: true,
        isTrash: false,
        inStock: { $gte: "1" }
      }
      aggregation.$match = query;
      // give more wight to _id which you want it first 

      // let wieght =  productIds.length + 1 ;
      // for( let i = productIds.length -1 ; i >= 0  ; i--){
      //   let order = {
      //     '$cond' : [
      //       { '$eq' : [ '_id' , productIds[i]]} , 
      //       i 
      //     ]
      //   }
      //   if( wieghtArr.length  == 0 ){
      //     order['$cond'].push(i+1);  
      //   }else {
      //     let nextedCondition =  wieghtArr.pop();
      //     order['$cond'].push(nextedCondition);
      //   }
      //   wieghtArr.push(order);
      //   // console.log(wieghtArr[0])
      // }
    }
    // console.log(wieghtArr[0]);
    //  else {
    //   const productids =  await getMostSaleProducts();
    //   aggregation.$match = { _id : { $in :  productids}, isActive: true, isTrash: false, inStock: { $gte: "1" } };
    // }
    // console.log(aggregation);
    const allProduct = await storeProductTable.aggregate([
      aggregation,
      {
        $limit: n,
      },

      // {
      //   $sort: { "createdAt": -1 }
      // },
      {
        $lookup: {
          from: 'productcategorytables',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: "productreviewstables",
          let: { product: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$product"],
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
          product: "$$ROOT",
          // "weight": wieghtArr[0] , 
          // categoryDetails: '$categoryDetails',
          categories: '$categories',
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
      },
      // {
      //   $sort : { 'weight' : 1}
      // }



    ]);

    // console.log(allProduct)
    let allProduct1 = [];
    for (let i = 0; i < productIds.length; i++) {

      let obj = allProduct.find((item) => item?.product?._id?.toString() == productIds[i]?.toString());
      // console.log(obj);
      if (obj) {
        allProduct1.push(obj);
      }

    }
    // console.log(allProduct1);
    const currentDate = new Date();
    const products = await Promise.all(allProduct1.map(async (item) => {
      const isSaleLive =
        currentDate >= new Date(item?.product?.schedule?.startDate) &&
        currentDate <= new Date(item?.product?.schedule?.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item?.product?._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item?.product?._id ?? "",
        title: item?.product?.title ?? "",
        slug: item?.product?.slug ?? "",
        // category: { id: item.categoryDetails[0]?._id ?? "", title: item.categoryDetails[0]?.title ?? "", slug: item.categoryDetails[0]?.slug ?? "" },
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item.categories?.map((cat) => { return { id: cat?._id ?? "", title: cat?.title ?? "", slug: cat?.slug ?? "" } }),
        featuredImage: item?.product?.featuredImage ?? "",
        images: item?.product?.images ?? [],
        // videos : item?.product?.videos ?? [],
        code: item?.product?.code ?? "",
        regularPrice: item?.product?.regularPrice != "" ? `${parseInt(item?.product?.regularPrice)}` : "0",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        isSaleLive: isSaleLive,
        maxPurchaseQty: item?.product?.maxPurchaseQty ?? "",
        language: item?.product?.language ?? "",
        salePrice: item?.product?.salePrice != "" ? `${parseInt(item?.product?.salePrice)}` : "0",
        badge: item?.product?.badge ?? "",
        saleExpire: moment(item?.product.saleExpire).format('DD-MM-YYYY HH:mm:ss') ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));
    if (products) {
      return res.json({
        status: true,
        data: products,
        msg: "Recent view product fetched",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Recent View product not fetched`,
    });
  }
});

store.get("/getStoreNewArrivalProducts", ValidateTokenForWeb, async (req, res) => {
  let { text, category, categorySlug, language, year, productType, page, pageSize, priceMin, priceMax, priceSort } = req.query;
  page = parseInt(page) || 1;
  pageSize = parseInt(pageSize) || 15;
  priceMin = parseInt(priceMin) || 0;
  priceMax = parseInt(priceMax) || 999;
  let query = {
    isActive: true,
    isTrash: false,
    inStock: { $gte: "1" },
  };
  if (priceMin && priceMax) {
    query.salePriceNum = { $gte: priceMin, $lte: priceMax }
  }
  // console.log(req.query)
  // if (text) {
  query.badge = "NEW ARRIVAL"
  // }
  if (productType) {
    query.productType = productType;
  }

  if (language) {
    query.language = language;
  }
  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  // console.log(query);
  try {
    let isCategory;
    if (category || categorySlug) {
      // const id = mongoose.Types.ObjectId(category);

      if (category) {
        isCategory = await productCategoryTable.findOne({ _id: category });
      } else if (categorySlug) {
        isCategory = await productCategoryTable.findOne({ slug: categorySlug });
      }

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
      query.categories = { $in: categoryArray }
    }
    let sortObject = { createdAt: -1 }
    if (priceSort && priceSort == 'low') {
      sortObject = { salePriceNum: 1, createdAt: -1 }
    }
    if (priceSort && priceSort == 'high') {
      sortObject = { salePriceNum: -1, createdAt: -1 }
    }

    // console.log(sortObject);

    const allProduct1 = await storeProductTable.aggregate([
      {
        $facet: {
          products: [
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
              $sort: { ...sortObject }
            },

            {
              $lookup: {
                from: 'productcategorytables',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
              },
            },
            {
              $lookup: {
                from: "productreviewstables",
                let: { product: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$product", "$$product"],
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
                product: "$$ROOT",
                // categoryDetails: '$categoryDetails',
                categories: '$categories',
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
            { $match: query },
            { $group: { _id: null, count: { $sum: 1 } } },
          ]
        }
      },
      {
        $project: {
          products: 1,
          totalCounts: { $arrayElemAt: ['$totalCounts', 0] },

        }
      }
    ])

    // console.log(allProduct1[0]?.products)
    // map
    // console.log("Use1", req.userId)
    const user = await findUserByUserId(req?.userId);
    // console.log("User", user)
    const currentDate = new Date();
    const products = await Promise.all(allProduct1[0]?.products.map(async (item) => {
      const isSaleLive =
        currentDate >= new Date(item.product.schedule.startDate) &&
        currentDate <= new Date(item.product.schedule.endDate);
      const isWishList = await storeWishlistTable.findOne({ user: user?._id, products: { $in: item.product._id } });
      const isAddToCart = await storeCartTable.findOne({ user: user?._id, 'products.productId': { $in: item?.product?._id } });
      return {
        id: item.product._id ?? "",
        title: item.product.title ?? "",
        // categoryDetails: item.categoryDetails[0],
        category: { id: item.categories[0]?._id ?? "", title: item.categories[0]?.title ?? "", slug: item.categories[0]?.slug ?? "" },
        categories: item?.categories?.map((category) => { return { id: category?._id ?? "", title: category.title ?? "", slug: category?.slug ?? "" } }) ?? [],
        parentCategory: isCategory?.title ?? "",
        slug: item.product.slug ?? "",
        featuredImage: item.product.featuredImage ?? "",
        images: item.product.images ?? [],
        shareLink: { link: item?.product?.shareLink?.link ?? "", text: item?.product?.shareLink?.text ?? "" },
        // videos : item?.product?.videos ?? [],
        code: item.product.code ?? "",
        regularPrice: item.product.regularPrice != "" ? `${parseInt(item.product.regularPrice)}` : "0",
        isSaleLive: isSaleLive,
        maxPurchaseQty: item.product.maxPurchaseQty ?? "",
        isWishList: isWishList ? true : false,
        isAddToCart: isAddToCart ? true : false,
        language: item.product.language ?? "",
        salePrice: item.product.salePrice != "" ? `${parseInt(item.product.salePrice)}` : "0",
        badge: item.product.badge ?? "",
        averageRating: item.averageRating.toFixed(1) || "0.0",
      };
    }));

    if (allProduct1[0].products) {
      return res.json({
        status: true,
        data: products,
        data1: { products: products, totalCounts: allProduct1[0]?.totalCounts?.count ?? 0 },
        // data : allProduct,
        msg: "All New Arrivals",
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || `Products not fetched`,
    });
  }
});

store.post("/addReviewFormAdmin", isAdmin, async (req, res) => {
  const { title, products, rating, user, description } = req.body;
  if ([null, undefined, ""].includes(user) || [null, undefined, []].includes(products)) {
    return res.json({
      status: false,
      data: null,
      message: `Required User & products Id`
    })
  }
  try {
    let reviewData = [];
    for (let productId of products) {
      let obj = {
        title: title,
        product: productId,
        rating: rating,
        user: user,
        description: description
      }
      reviewData.push(obj);
    }
    await productReviewsTable.insertMany(reviewData);
    return res.json({
      status: true,
      data: null,
      msg: 'Reviews added for given books'
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.get("/getOrdersSummary", isAdmin, async (req, res) => {
  try {
    let { platform, startDate, endDate } = req.query;
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
    if (!adminDetails) {
      return res.status(401).json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    startDate = new Date(startDate)
    endDate = new Date(endDate);
    let query = {};
    if (platform == 'all') {
      // platform = { $or : ['store' , 'publication']}
      query = {
        createdAt: { $lte: endDate, $gte: startDate }
      }

    } else {
      query = {
        platform: platform,
        createdAt: { $lte: endDate, $gte: startDate }
      }
    }
    // console.log(query);
    // const orders =  await storeOrdesTable.find(query).sort({createdAt : -1});
    const orders = await storeOrdesTable.find({}).sort({ createdAt: -1 });
    let UnFulFillable = 0;
    let newOrder = 0;
    let packed = 0;
    let readyToShipped = 0;
    let cancelled = 0;
    let delivered = 0;
    let returnOrders = 0;
    let allOrders = 0;
    for (let order of orders) {
      if ((order?.orderType == 'COD' || order.isPaid == true) && order?.deliveryStatus == 'processing') {
        newOrder++;
      }
      if (order?.orderType == 'COD' || order.isPaid == true) {
        allOrders++;
      }
      if (order?.orderType != "COD" || order?.isPaid == false) {
        UnFulFillable++;
      }
      if (order?.deliveryStatus == 'packed') {
        packed++;
      }
      if (order?.deliveryStatus == 'shipped') {
        readyToShipped++;
      }
      if (order?.deliveryStatus == 'cancelled' || order?.deliveryStatus == 'userCancelled') {
        cancelled++;
      }
      if (order?.deliveryStatus == 'customerReturn' || order?.deliveryStatus == 'courierReturn') {
        returnOrders++;
      }
      if (order.deliveryStatus == 'delivered') {
        delivered++;
      }
    }
    return res.json({
      status: true,
      data: { allOrders, delivered, newOrder, UnFulFillable, readyToShipped, returnOrders, cancelled, packed },
      msg: "Summary Return"
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

store.get("/getProductDetail", async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.json({
      status: false,
      data: null,
      msg: `Required Slug`
    })
  }
  try {
    const product = await storeProductTable.findOne({ slug: slug })
    if (!product) {
      return res.json({
        status: false,
        data: null,
        msg: 'Product not found'
      })
    }
    return res.json({
      status: true,
      data: { featuredImage: product?.featuredImage ?? "", slug: product?.slug ?? "", metaTitle: product?.metaTitle ?? "", metaDesc: product?.metaDesc ?? "", },
      msg: `Product Details`
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    })
  }
})

store.get("/getCategoryDetails", async (req, res) => {
  try {
    const { slug } = req.query;
    const category = await productCategoryTable.findOne({ slug: slug }).populate("parentCategory", 'icon');
    // console.log(slug , category);
    return res.json({
      status: true,
      data: {
        meteTitle: category?.metaTitle ?? "",
        metaDesc: category?.metaDesc ?? "",
        title: category?.title ?? "",
        icon: category?.icon == "" ? category?.parentCategory?.icon : category?.icon,

      },
      msg: `Category Details fetched`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})


module.exports = store;
