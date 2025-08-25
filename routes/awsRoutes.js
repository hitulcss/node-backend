const express = require('express');
const mongoose = require('mongoose');
const { ValidateToken, isAdmin } = require('../middleware/authenticateToken');
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../aws/UploadFile");
const multer = require("multer");
const {
  findAdminTeacherUsingUserId,
} = require("../HelperFunctions/adminTeacherFunctions");
const moment = require("moment");
const { savePanelEventLogs } = require("../HelperFunctions/storeLogs");
require("dotenv").config();
const AwsRouter = express.Router();
const AWS = require('aws-sdk');
const upload = multer({ dest: "uploads/postContent" });

const s3 = new AWS.S3({ 
    accessKeyId: process.env.AWSaccessKeyId,
    secretAccessKey: process.env.AWSsecretAccessKey,
});


AwsRouter.get("/getAllBucket" , isAdmin , async(req , res) =>{
    let { prefix , pageNumber , pageSize} = req.query ;
    // console.log(req.query);
    const params = {
        Bucket : 'sd-campus' ,
        Prefix : prefix ?? "Batches" ,
        MaxKeys : parseInt(pageSize)
    }
     const folderList =  new Map();
     let response = [];
     pageNumber = parseInt(pageNumber) || 1
    try{
        let isTruncated = true ;
        let currentPage = 1;
        let index = 1 ;
        let continuationToken;
        let totalCount = 0;
       
        // const data = await s3.paginateListObjectsV2(params).promise();
        // while(isTruncated){
        //     const data = await s3.listObjectsV2(params).promise();
        //     // response.push( ...data.Contents);
        //     for( let fileObject of data.Contents){
        //         response.push( {id :fileObject?.Key ,  sno : index , ...fileObject , downloadUrl : `https://d1mbj426mo5twu.cloudfront.net/${fileObject.Key}` })
        //         index += 1;
        //     // if( fileObject?.Key?.includes("/")){
        //     //     let folderName = fileObject.Key.split('/')[1] ;
        //     //     let splitKey = fileObject.Key.split('/').slice( 1 )
        //     //     if( folderList?.has(folderName)){
        //     //         let getAllFile =  folderList.get(folderName);
        //     //         //  check this fileObject already exist or not
        //     //         let exists =  getAllFile?.filter((item) => item?.Key == fileObject?.Key) ;
        //     //         if( exists?.length == 0 ){
        //     //             getAllFile.push({ ...fileObject , splitKey , downloadUrl : `https://d1mbj426mo5twu.cloudfront.net/${fileObject.Key}`} ) ;
        //     //         }
        //     //         // getAllFile.push({ ...fileObject , splitKey} ) ;
        //     //     }else{
        //     //       folderList.set( folderName , [{ ...fileObject , splitKey , downloadUrl : `https://d1mbj426mo5twu.cloudfront.net/${fileObject.Key}`}]);
        //     //     }
        //     //     // folderList.set( folderName , [ fileObject]);
        //     // }
        //    }
        //    isTruncated = data.IsTruncated; // Update flag based on pagination
        //    params.Marker = data.NextMarker;
        // //    n--;
        // }
        // while (isTruncated && currentPage <= pageNumber) {
          while( pageNumber === 1 ? isTruncated :  (isTruncated && currentPage <= pageNumber)){
            const data = await s3.listObjectsV2({
              ...params,
              ContinuationToken: continuationToken,
            }).promise();
            totalCount += data.Contents.length;
            if (currentPage === parseInt(pageNumber)) {
              for (let fileObject of data.Contents) {
                response.push({
                  id: fileObject?.Key,
                  sno: index,
                  ...fileObject,
                //   downloadUrl: `https://d1mbj426mo5twu.cloudfront.net/${fileObject.Key}`,
                  downloadUrl : `https://static.sdcampus.com/${fileObject.Key}`
                });
                index += 1;
              }
            }
            isTruncated = data.IsTruncated;
            continuationToken = data.NextContinuationToken;
            currentPage++;
          }

        return res.json({
            status : true ,
            // data : response,
            data : { totalCount , response},
            msg : 'Fetched the all Bucket'
        })

    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg  : error.message
        })
    }
})


AwsRouter.post("/postContent" , upload.single('file') , isAdmin , async(req , res) =>{
    let { prefix} = req.body ;
    try{
        let fileUrl;
        let FileUploadLocation;
       if (req.file) {
        //    console.log(req.file.path);
           const helperString = Math.floor(Date.now() / 1000);
           const filename = req.file.originalname.split(".")[0].replace(/\s+/g , '_');
           const extension = "." + req.file.originalname.split(".").pop();
           FileUploadLocation = `${prefix}/${filename}_${helperString}${extension}`;
           let fileLocHelper = await uploadFile(req.file.path, FileUploadLocation);
           fileUrl = fileLocHelper;
        //    console.log(fileUrl)
        }
        return res.json({
            status : true ,
            data : fileUrl,
            msg : 'Content uploaded on given batch'
        })

    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg  : error.message
        })
    }
})

AwsRouter.post('/deleteContent' , isAdmin , async(req , res) => {
    const { Key , prefix } = req.body ;
    //  console.log(req.body);
    if( !Key){
        return res.json({
            status : false ,
            data : null ,
            msg :  `Required Key`
        })
    }
    try{
        const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
      const adminDetails = await findAdminTeacherUsingUserId(decoded.studentId);
      if (!adminDetails || adminDetails?.email != "admin@sdempire.in") {
        return res.status(401).json({
          status: false,
          data: null,
          msg: "Not Authorized",
        });
      }
      
        // let fileName = Key.split("/")[-1];
        // console.log()
        s3.deleteObjects({ Bucket : 'sd-campus' , Delete : {
            Objects : [{ Key : Key}] ,
            Quiet : false
        }} , function ( err , data) {
            if(err){
                return  res.json({
                    status : false ,
                    data : null ,
                    msg : err.message
                })
            }
            return res.json({
                status : true ,
                data : data  ,
                msg : `That File Deleted from ${prefix} Folder`
            })
        })
        // return res.json({
        //     status : true ,
        //     data : data ,
        //     msg : `That File Deleted from ${prefix} Folder`
        // })

    }catch(error){
        return res.json({
            status : false ,
            data : null ,
            msg : error.message
        })
    }
})

module.exports =  AwsRouter ;