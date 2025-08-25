const jwt = require('jsonwebtoken');
require("dotenv").config();
const { adminTeacherTable } = require('../models/adminTeacherModel');
const { UserTable } = require('../models/userModel');

//validating the user token 
function ValidateToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    // jwt.verify(req.token, process.env.SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token 
    //   if (err) {
    //     return res.json({
    //       err: err,
    //       status: false,
    //       data: null,
    //       msg: "User Not authorised !",
    //     });
    //   } else {
    //     const isUser  = await UserTable.findOne({ userId : Data.studentId ,is_active : true });
    //     if( !isUser){
    //        return res.json({
    //           status : false ,
    //           data : null ,
    //           msg : `User Not authorised !`
    //        })
    //     }
    //     req.studentId =  Data.studentId ;
    //     req.userId = isUser?._id ;
        
    //   }
    // }
    // )
    
    // jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token 
    //   if (err) {
    //    return  res.json({                                                           
    //       err:err,
    //       status: false,
    //       data: null,
    //       msg: "Please login as an admin !",
    //     });
    //   }else{
    //     const userDetails=await UserTable.findOne({userId:Data.studentId});
    //     if(userDetails){
    //       const {deviceId}=req.query;
    //       console.log("deviceId"+deviceId)
    //       if(userDetails.deviceConfig==deviceId){
    //         next();
    //       }else{
    //         res.json({
    //             status:false,
    //             data:null,
    //             msg:"please Login"
    //         })
    //       }   
    //     }else{
    //         res.json({
    //             status:false,
    //             data:null,
    //             msg:"Not an User"
    //         })
    //     }


    //   }
    // })
    next();
  } else {
    res.json({
      status: false,
      msg: "User Not authorised",
    });
  }
}

//authorizing the admin 
function isAdmin(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    // console.log(req.token);
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token 
      if (err) {
        return res.json({
          err: err,
          status: false,
          data: null,
          msg: "Please login as an admin !",
        });
      } else {
        const admin = await adminTeacherTable.findOne({ email: Data.email });
        
        if (admin) {
          if( admin?.refreshToken == "" || admin?.refreshToken != req.token ){
            return res.json({
              status : false ,
              data : null ,
              msg : "Session expired"
            })
          }
          if (admin.Role == "admin" || 'subadmin') {
            next();
          } else {
            return res.json({
              err: err,
              status: false,
              data: null,
              msg: "Not an admin !",
            });
          }
        } else {
          return res.json({
            err: err,
            status: false,
            data: null,
            msg: "Please login as an admin !",
          });
        }
      }
    }
    )
  } else {
    res.json({
      // data:null,
      status: false,
      msg: "User Not authorised",
    });
  }
}

//authorizing the teacher middleware
function isTeacher(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    jwt.verify(req.token, process.env.TEACHER_SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token 
      if (err) {
        return res.json({
          err: err,
          status: false,
          data: null,
          msg: "Please login as an admin!",
        });
      } else {
        const teacher = await adminTeacherTable.findOne({ email: Data.email });
        if (teacher) {
          if( teacher?.refreshToken == "" || teacher?.refreshToken != req.token ){
            return res.json({
              status : false ,
              data : null ,
              msg : "Session expired"
            })
          }
          if (teacher.Role == "teacher") {
            next();
          } else {
            return res.json({
              err: err,
              status: false,
              data: null,
              msg: "Not an admin !",
            });
          }
        } else {
          return res.json({
            err: err,
            status: false,
            data: null,
            msg: "Please login as an admin !",
          });
        }
      }
    }
    )
  } else {
    res.json({
      status: false,
      msg: "User Not authorised",
    });
  }
}


function omsVerify(req, res, next) {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    let decodedData;
    if (token) {
      decodedData = jwt.verify(token, process.env.SECRET_KEY);
      req.userId = decodedData?.studentId ;
      next();
    }else{
      return res.status(401).json({
        "message": "Auth Token expired/invalid",
        "code": "-0001"
      })
    }
    
  } catch (error) {
    // return res.json({
    //   status: false,
    //   data: null,
    //   msg: error.message || "Something Went Wrong",
    // });
    return res.status(401).json({
      "message": "Auth Token expired/invalid",
      "code": "-0001"
    })
  }
}

async function ValidateTokenForWeb(req, res, next) {
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
      msg: error.message || "Something Went Wrong",
    });
  }
}

async function isParent(req, res, next) {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    let decodedData;
    if (token) {
      decodedData = jwt.verify(token, process.env.PARENT_SECRET_KEY);
      // console.log(decodedData);
      req.parentId = decodedData?.studentId;
      next();
    }else{
      return res.json({
        status : false ,
        data : null ,
        msg : `Not Authorised`
      })
    }
    // next();
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message || "Something Went Wrong",
    });
  }
}
async function ValidateTokenForUser(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    const decode =  jwt.decode(req.token , process.env.SECRET_KEY);
    const isUser  = await UserTable.findOne({ userId : decode.studentId ,is_active : true });
        // console.log(isUser);
        if( !isUser){
           return res.json({
              status : false ,
              data : null ,
              msg : `User Not authorised !`
           })
        }
      req.userId =  isUser._id ; 
    // jwt.verify(req.token, process.env.SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token 
    //   if (err) {
    //     return res.json({
    //       err: err,
    //       status: false,
    //       data: null,
    //       msg: "User Not authorised !",
    //     });
    //   } else {
    //     // console.log(Data.studentId);
    //     const isUser  = await UserTable.findOne({ userId : Data.studentId ,is_active : true });
    //     // console.log(isUser);
    //     if( !isUser){
    //        return res.json({
    //           status : false ,
    //           data : null ,
    //           msg : `User Not authorised !`
    //        })
    //     }
    //     // req.studentId =  Data.studentId ;
    //     // req.userId = isUser?._id ;
        
    //   }
    // }
    // )
    
    next();
  } else {
    res.json({
      status: false,
      msg: "User Not authorised",
    });
  }
}
module.exports = {
  ValidateToken,
  isAdmin,
  isTeacher , 
  omsVerify,
  isParent , 
  ValidateTokenForWeb ,
  ValidateTokenForUser
};