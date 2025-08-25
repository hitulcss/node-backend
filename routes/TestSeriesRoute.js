const express =  require('express');
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { isAdmin } =  require('../middleware/authenticateToken');
const { adminTeacherTable } = require('../models/adminTeacherModel');
const { generateSlug } = require('../HelperFunctions/generateSlug');
const { uploadFile } = require('../aws/UploadFile');
const { TestCategoryTable } = require('../models/TestCategory');
const { TestSubCategoryTable } = require('../models/TestSubCategory');
const { NewTestSeriesTable } = require('../models/NewTestSeries');
const { TestSubjectTable } = require('../models/TestSubject');
const testSeriesRoute = express.Router();
const upload = multer({ dest: "uploads/testSeries" });

const fileDetails = (file, fileLoc) => {
    const filename = (file.originalname.split(".")[0]).replace(/\s+/g, '_');
    return {
        fileLoc: fileLoc,
        fileName: filename,
        fileSize: `${(file.size / 1000000).toFixed(2)} MB`,
    };
};

testSeriesRoute.post("/addTestCategory" ,upload.single('file') ,  isAdmin , async(req , res) => {
    try{
        const { title , isActive , metaTitle , metaDesc } =  req.body ; 
        if( !title || !isActive || !metaTitle || !metaDesc ){
            return res.json({
                status : false ,
                data : null ,
                msg :  `Required Title , IsActive ,  Meta Title , Meta Description`
            })
        }
        const decode = jwt.verify(req.token , process.env.SECRET_KEY);
        const admin = await adminTeacherTable.findOne({userId : decode.studentId});
        if( !admin){
            return res.json({
                status : false ,
                data : null ,
                msg : 'Not An Admin'
            })
        }
      const slug = await generateSlug(title);
      const isSlugExist =  await TestCategoryTable.findOne({ slug : slug});
      if( isSlugExist){
        return res.json({
            status : false ,
            data : null ,
            msg : 'This Category already exists'
        })
      }
      let fileLoc = "";
      if (req.file) {
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
        FileUploadLocation = `testCategory/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
        let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        fileLoc =  helperfileLoc;
      }
      await TestCategoryTable.create({ admin : admin?._id , title , slug  , icon : fileLoc  , isActive , metaTitle , metaDesc })
      return res.json({
        status : true ,
        data : null ,
        msg : `Category added`
      })

    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg :  error.message 
        })
    }
})

testSeriesRoute.post("/addTestSubject" ,upload.single('file') ,  isAdmin , async(req , res) => {
    try{
        const { title , isActive  } =  req.body ; 
        if( !title || !isActive || !metaTitle || !metaDesc ){
            return res.json({
                status : false ,
                data : null ,
                msg :  `Required Title , IsActive `
            })
        }
        const decode = jwt.verify(req.token , process.env.SECRET_KEY);
        const admin = await adminTeacherTable.findOne({userId : decode.studentId});
        if( !admin){
            return res.json({
                status : false ,
                data : null ,
                msg : 'Not An Admin'
            })
        }
      const slug = await generateSlug(title);
      const isSlugExist =  await TestSubjectTable.findOne({ slug : slug});
      if( isSlugExist){
        return res.json({
            status : false ,
            data : null ,
            msg : 'This Subject already exists'
        })
      }
      let fileLoc = "";
      if (req.file) {
        let size = req.file.size / (1024);
        if (size > 100) {
          return res.json({
            status: false,
            data: null,
            msg: 'Maximum subject icon size 100KB allowed'
          })
        }
        const helperString = Math.floor(Date.now() / 1000);
        const filename = req.file.originalname.split(".")[0]?.replace(/\s+/g, '_');
        const extension = "." + req.file.originalname.split(".").pop();
        FileUploadLocation = `testSubject/${title?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
        let helperfileLoc = await uploadFile(req.file.path, FileUploadLocation);
        fileLoc =  helperfileLoc;
      }
      await TestSubjectTable.create({ admin : admin?._id , title , slug  , icon : fileLoc  , isActive })
      return res.json({
        status : true ,
        data : null ,
        msg : `Subject added`
      })

    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg :  error.message 
        })
    }
})

testSeriesRoute.post("/addTestSubCategory" , isAdmin , async(req , res) => {
    try{
        const { title , isActive   } =  req.body ; 
        if( !title || !isActive  ){
            return res.json({
                status : false ,
                data : null ,
                msg :  `Required Title , IsActive`
            })
        }
        const decode = jwt.verify(req.token , process.env.SECRET_KEY);
        const admin = await adminTeacherTable.findOne({userId : decode.studentId});
        if( !admin){
            return res.json({
                status : false ,
                data : null ,
                msg : 'Not An Admin'
            })
        }
      const slug = await generateSlug(title);
      const isSlugExist =  await TestSubCategoryTable.findOne({ slug : slug});
      if( isSlugExist){
        return res.json({
            status : false ,
            data : null ,
            msg : 'This Sub Category already exists'
        })
      }
      await TestSubCategoryTable.create({ admin : admin?._id , title , slug    , isActive  })
      return res.json({
        status : true ,
        data : null ,
        msg : `Sub Category added`
      })

    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg :  error.message 
        })
    }
})

testSeriesRoute.post("/addTestSeries" ,
     upload.fields([
        {
            name : 'banner' ,
            maxCount :  1
        } , 
        {
            name : 'planner' ,
            maxCount : 1 
        }
     ])  ,
      isAdmin , async(req , res) =>{
    try{
        const { testSeriesName , startDate , endDate , salePrice , regularPrice , isPaid , language , isActive , keyFetaures , description , metaDesc , metaTitle , faqs , category , subCategory , subject , isCoinApplicable , maxAllowedCoins } = req.body ; 
        if ( isPaid === 'true' && (parseInt(regularPrice) < 0 || isNaN(regularPrice))) {
            return res.json({
              status: false,
              data: null,
              msg: "Regular always positive number",
            });
          }
          if ( [true , 'true']?.includes(isCoinApplicable) && (parseInt(maxAllowedCoins) < 0 || isNaN(maxAllowedCoins))) {
            return res.json({
              status: false,
              data: null,
              msg: "Max Allowed Coins always positive number",
            });
          }
          if ( isPaid === 'true' && (parseInt(salePrice) < 0 || isNaN(salePrice))) {
            return res.json({
              status: false,
              data: null,
              msg: "Sale Price always positive number",
            });
          }
          if ( isPaid === 'true' && (parseInt(regularPrice) < parseInt(salePrice))) {
            return res.json({
              status: false,
              data: null,
              msg: "Sale always less than Or equal regularPrice",
            });
          }
          let banner = '' ;
          let planner = {} ; 
          if (req.files) {
            if (req.files.file) {
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
                FileUploadLocation = `testSeriesBanner/${batch_name?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;
                let fileLocHelper = await uploadFile(
                    req.files.file[0].path,
                    FileUploadLocation
                );
                banner = fileLocHelper
            }
            if (req.files.planner) {
                const helperString = Math.floor(Date.now() / 1000);
                const filename = (req.files.planner[0].originalname.split(".")[0]).replace(/\s+/g, '_');
                const extension = "." + req.files.planner[0].originalname.split(".").pop();
                FileUploadLocation = `Batches/${testSeriesName?.replace(/\s+/g, '_')}/${filename}_${helperString}${extension}`;;
                let fileLocHelper = await uploadFile(
                    req.files.planner[0].path,
                    FileUploadLocation
                );
                planner = fileDetails(req.files.planner[0], fileLocHelper);
            }
            
        }
          await NewTestSeriesTable.create({ isActive, testSeriesName , category , subCategory , subject , faqs , metaDesc , metaTitle , isCoinApplicable , maxAllowedCoins ,
            salePrice : isPaid === 'true' ? salePrice : 0 ,
            regularPrice : isPaid === 'true' ? regularPrice : 0 ,
            startDate :  new Date(startDate) ,
            endDate :  new Date(endDate) , 
            banner , planner , 
            language , description , keyFetaures
          })
          return res.json({
            status : true ,
            data : null ,
            msg :  'New Test Series Added'
          })
    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg :  error.message
        })
    }
})

module.exports = testSeriesRoute