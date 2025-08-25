const express = require("express");
const adminTeacher = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const fs = require("fs");
const { google } = require("googleapis");
const { OAuth2 } = require("google-auth-library");
const util = require("util");
const path = require("path");
const {
  isAdmin,
  isTeacher,
  ValidateToken,
} = require("../middleware/authenticateToken");
const { adminTeacherTable } = require("../models/adminTeacherModel");
const { v1: uuidv1 } = require("uuid");
const { UserTable } = require("../models/userModel");
const { SubjectTable } = require("../models/Subject");
const { formatDate } = require("../middleware/dateConverter");
const { BatchesTable } = require("../models/BatchesSchema");
const { MybatchTable } = require("../models/MyBatches");
const { paymentTransactionTable } = require("../models/paymentTransaction");
const { CartTable } = require("../models/cart");
const { saveYtToken, getYtToken } = require("../HelperFunctions/ytLiveChatId");
const setHeaders = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
};
const {
  findAdminTeacherUsingUserId,
} = require("../HelperFunctions/adminTeacherFunctions");
const { sendEmail } = require("../ContactUser/NodeMailer");
const { courseTxnTable } = require("../models/coursePaymentTxn");
const { storeTxnTable } = require("../models/storePaymentTxn");
const { storeWishlistTable } = require("../models/storeWishlist");
const { storeCartTable } = require("../models/storeCart");
const { MyAttemptedTestTable } = require("../models/myAttemptedTest");
/// YOUTUBE LIVE SECTION
const TOKEN_DIR = process.env.YT_TOKEN_DIR
// const TOKEN_DIR = "/home/ubuntu/backend/_work/backend/backend/Config/";
const TOKEN_PATH = TOKEN_DIR + "token.json";
const CLIENT_SECRET_PATH =
  TOKEN_DIR + "client_secret.json";
const SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"];

const upload = multer({ dest: "uploads/staff" });

// Route to authorize the app
adminTeacher.get("/authorize", isAdmin, async (req, res) => {
  try {
    const { reDectUrl } = req.query;
    const decodedToken = jwt.verify(req.token, process.env.SECRET_KEY);
    if (!decodedToken || !decodedToken.studentId) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    fs.readFile(CLIENT_SECRET_PATH, (err, content) => {
      if (err) {
        console.log("Error loading client secret file: " + err);
        return res.status(500).send("Error loading client secret file");
      }
      const credentials = JSON.parse(content);
      const { client_secret, client_id, redirect_uris } = credentials.web;
      const redirectUrl = redirect_uris[0];
      const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirectUrl
      );
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          // Set the redirect URL dynamically based on the request
          const redirectUri = reDectUrl || credentials.web.redirect_uris[0];
          const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
            redirect_uri: redirectUri,
          });
          return res.json({
            status: true,
            data: authUrl,
            msg: "Success",
          });
        } else {
          oauth2Client.setCredentials(JSON.parse(token));

          // Send the existing authUrl
          const redirectUri = reDectUrl || credentials.web.redirect_uris[0];
          const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
            redirect_uri: redirectUri,
          });

          return res.json({
            status: true,
            data: authUrl,
            msg: "Already authorized",
          });
        }
      });
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Internal server error",
    });
  }
});

// Route to exchange authorization code for access token
adminTeacher.get("/token", isAdmin, async (req, res) => {
  try {
    const { code } = req.query;
    const decodedToken = jwt.verify(req.token, process.env.SECRET_KEY);
    if (!decodedToken || !decodedToken.studentId) {
      return res.json({
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
    if (!code) {
      return res.json({
        status: false,
        data: null,
        msg: "Token not found",
      });
    }
    const adminTeacher = await findAdminTeacherUsingUserId(
      decodedToken.studentId
    );
    if (adminTeacher) {
      fs.readFile(CLIENT_SECRET_PATH, async (err, content) => {
        if (err) {
          return res.status(500).send("Error loading client secret file");
        }
        const dbToken = await getYtToken(adminTeacher._id);
        if (dbToken.status) {
          const currentTime = new Date();
          const expiryDate = new Date(dbToken?.token.expiry_date);
          if (currentTime <= expiryDate) {
            return res.json({
              status: true,
              data: dbToken.token,
              msg: "Access token",
            });
          }
        }
        const credentials = JSON.parse(content);
        const { client_secret, client_id, redirect_uris } = credentials.web;
        const redirectUrl = redirect_uris[0];
        const oauth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirectUrl
        );
        oauth2Client.getToken(code, async (err, token) => {
          if (err) {
            const authUrl = oauth2Client.generateAuthUrl({
              access_type: "offline",
              scope: SCOPES,
            });
            return res.json({
              status: 200,
              data: authUrl,
              msg: "Auth Url",
            });
          }
          oauth2Client.setCredentials(token);
          await storeToken(token);
          fs.readFile(TOKEN_PATH, async (err, tokenContent) => {
            if (err) {
              console.log("Error loading token file: " + err);
              return res.status(500).send("Error loading token file");
            }
            const tokenData = JSON.parse(tokenContent);
            await saveYtToken(tokenData, adminTeacher._id);
            fs.unlink(TOKEN_PATH, (err) => {
              if (err) {
                console.log("Error deleting token file: " + err);
                return res.status(500).send("Error deleting token file");
              }
              return res.json({
                status: true,
                data: tokenData,
                msg: "Access token obtained",
              });
            });
          });
        });
      });
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: "Internal server error",
    });
  }
});

// Function to store token to disk
async function storeToken(token) {
  try {
    await fs.promises.mkdir(TOKEN_DIR, { recursive: true });
    await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log("Token stored to " + TOKEN_PATH);
  } catch (err) {
    console.error("Error storing token:", err);
    throw err;
  }
}

//Register admin route
adminTeacher.post("/adminRegister", async (req, res) => {
  const { adminName, password, mobile, email, host, serverkey } = req.body;
  if (!adminName || !password || !mobile || !email || !host || !serverkey || !["live-class.sdcampus.com", "cms.sdcampus.com"]?.includes(host) || serverkey != "SDEMPIRE#$%") {
    return res.json({
      status: false,
      data: null,
      msg: "Please Provide correct details"
    })
  }
  let adminPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
  if (!password.match(adminPasswordRegex)) {
    //checking for the strenght of the password
    return res.send("password not strong");
  }
  try {
    let exists;
    if (email) {
      exists = await adminTeacherTable.findOne({ email: email });
    }
    if (exists) {
      return res.status(400).json({ msg: "email Already Exists !" });
    }
    bcrypt.hash(password, 8, async (err, hashedPassword) => {
      if (err) {
        return err;
      }
      const date = new Date();
      let formatedDate = formatDate(date);
      const admin = new adminTeacherTable({
        FullName: adminName,
        password: hashedPassword,
        email: email,
        Role: "admin",
        created_at: formatedDate,
        mobileNumber: mobile,
        ej_ective: true,
        userId: uuidv1(),
      });
      const data = await admin.save();
      return res.json({
        status: true,
        msg: "admin successfully registerd",
      });
    });
  } catch (err) {
    res.json({
      err: err,
      status: false,
      data: null,
      msg: "Register failed",
    });
  }
});

adminTeacher.get("/studentDetail/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const userDetails = await UserTable.findOne({ _id: id });
  if (userDetails) {
    const bachDetails = await MybatchTable.find({ user: userDetails._id });
    let batchesTakenByUser = [];
    for (let i = 0; i < bachDetails.length; i++) {
      let batch = await BatchesTable.findOne({
        _id: bachDetails[i].batch_id,
      });
      if (batch) {
        const batchObj = batch.toObject();
        batchObj.courseIsActiveForUser = bachDetails[i].is_active;
        // console.log("Batch Details:", bachDetails[i].is_active);
        batchesTakenByUser.push(batchObj);
      }
    }
    const cartDetails = await CartTable.find({ user: userDetails._id });
    userDetails["batchesTakenByUser"] = batchesTakenByUser;
    const transactions = await paymentTransactionTable.find({
      user: userDetails._id,
    });

    const wishLists = await storeWishlistTable.findOne({ user: userDetails?._id }).populate("products", "title");
    const storeCarts = await storeCartTable.findOne({ user: userDetails?._id }).populate("products.productId", "title");

    res.json({
      status: true,
      data: {
        userDetails: userDetails,
        batchesTakenByUser: batchesTakenByUser,
        allTransactions: transactions,
        wishLists,
        storeCarts,

        cartDetails: cartDetails,
      },
      msg: `fetched the Student Details of student with id ${id}`,
    });
  } else {
    res.json({
      status: false,
      data: null,
      msg: "Student details not found",
    });
  }
});

//fetch all the Students  data
adminTeacher.get(
  "/admingetallstudentsdetails",
  ValidateToken,
  async (req, res) => {
    const { batch_id, text } = req.query;

    try {
      const decodedData = await jwt.verify(req.token, process.env.SECRET_KEY);

      const adminTeacherDetails = await adminTeacherTable.findOne({
        userId: decodedData.studentId,
      });
      if (
        adminTeacherDetails.Role === "admin" || adminTeacherDetails.Role === "subadmin" ||
        adminTeacherDetails.accessToContent.includes("All Students")
      ) {
        if (batch_id) {
          const findBatch = await BatchesTable.findOne({ _id: batch_id });

          if (!findBatch) {
            return res.json({
              status: false,
              data: null,
              msg: "Batch details not found",
            });
          }

          const studentIds = findBatch.student;
          const studentDetails = await Promise.all(
            studentIds.map((studentId) => UserTable.findOne({ _id: studentId }))
          );

          const helperArray = studentDetails
            .filter((student) => student !== null && student._id !== null && student._id !== undefined)
            .map((student) => ({
              StudentName: student.FullName,
              email: student.email,
              mobileNumber: student.mobileNumber,
              username: student.username,
              userId: student.userId,
              is_active: student.is_active,
              profilePhoto: student.profilePhoto,
              id: student._id,
              Stream: student.Stream,
              created_at: student.created_at,
              enrollId: student.enrollId,
              mobileNumberVerified: student.mobileNumberVerified ?? "",
              utm_campaign: student?.utm_campaign ?? "",
              utm_source: student?.utm_source ?? "",
              utm_medium: student?.utm_medium ?? "",
              value: student?._id ?? "",
              label: `${student?.FullName} ${student.email} ${student.mobileNumber}`
            }));

          return res.json({
            status: true,
            data: helperArray,
            msg: `Fetched all the students for the batch ${findBatch.batch_name}`,
          });
        } else {
          let query = {};
          if (text) {
            query.$or = [
              { mobileNumber: { $regex: text, $options: "i" } },
              // { stream: { $regex: search, $options: "i" } },
            ]
          }
          const studentDetails = await UserTable.find({ ...query })
            .sort({ _id: -1 })
            .exec();

          if (!studentDetails || studentDetails.length === 0) {
            return res.json({
              status: false,
              data: null,
              msg: "No data found",
            });
          }

          const studentsData = studentDetails
            .filter((student) => student !== null && student._id !== null && student._id !== undefined)
            .map((student) => ({
              StudentName: student.FullName,
              email: student.email,
              mobileNumber: student.mobileNumber,
              username: student.username,
              userId: student.userId,
              is_active: student.is_active,
              profilePhoto: student.profilePhoto,
              id: student._id,
              Stream: student.Stream,
              created_at: student.created_at,
              enrollId: student.enrollId,
              mobileNumberVerified: student.mobileNumberVerified ?? "",
              utm_campaign: student?.utm_campaign ?? "",
              utm_source: student?.utm_source ?? "",
              utm_medium: student?.utm_medium ?? "",
              value: student?._id ?? "",
              label: `${student?.FullName} ${student.email} ${student.mobileNumber}`
            }));

          return res.json({
            status: true,
            data: studentsData,
            msg: "All the students' information fetched successfully",
          });
        }
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Not authorized",
        });
      }
    } catch (err) {
      return res.json({
        err: err,
        status: false,
        data: null,
        msg: "Not an admin",
      });
    }
  }
);

//admin login route
adminTeacher.post("/adminLogin", async (req, res) => {
  const { email, password, host, serverkey } = req.body;
  // const allowedArr = process.env.ALLOWED_HOST_ARR
  if (!email || !password || !host || !serverkey || !["live-class.sdcampus.com","cms.sdcampus.com", 'dev-cms.sdcampus.com']?.includes(host) || serverkey != "SDEMPIRE#$%") {
    return res.json({
      status: false,
      data: null,
      msg: "Please Provide Correct Details"
    })
  }
  const admin = await adminTeacherTable.findOne({
    email: email,
    isActive: true
  });
  if (admin) {
    bcrypt.compare(password, admin.password, async function (err, result) {
      if (err) {
        //check if the passwords match
        return res.send("err" + err);
      }
      if (result) {
        if (admin.Role === 'admin') {
          const otp = Math.floor(Math.random() * 9000) + 1000;
console.warn(":", otp);
          const updateOtp = await adminTeacherTable.findOneAndUpdate({ _id: admin._id }, { otp: otp }, { new: true, lean: true });
          if (updateOtp) {
            const emailData = {
              otp: updateOtp?.otp,
              action: '2FA Verification',
              host: host
            }
            await sendEmail(
              "twoFactorAdmin",
              // "sdcampus@trando.in",
              email,
              // "SD Campus",
              updateOtp?.FullName,
              emailData
            );
            return res.json({
              status: true,
              data: null,
              msg: 'OTP send successfully'
            })

          }


        } else if (admin.Role === 'subadmin') {
          const otp = Math.floor(Math.random() * 9000) + 1000;

          const updateOtp = await adminTeacherTable.findOneAndUpdate({ _id: admin._id }, { otp: otp }, { new: true, lean: true });
          if (updateOtp) {
            const emailData = {
              otp: updateOtp?.otp,
              host: host,
              action: '2FA Verification'
            }
            await sendEmail(
              "twoFactorAdmin",
              // "sdcampus@trando.in",
              email,
              // "SD Campus",
              updateOtp?.FullName,
              // "UPSC हिन्दी",
              emailData
            );
            return res.json({
              status: true,
              data: null,
              msg: 'OTP send successfully'
            })

          }
          // jwt.sign(
          //   { email: admin.email, studentId: admin.userId },
          //   process.env.ADMIN_SECRET_KEY,
          //   { expiresIn: "24h" },
          //   (err, accessToken) => {
          //     if (err) {
          //       console.log(err);
          //     }
          //   //   return res.json({
          //   //     status: true,
          //   //     data: accessToken,
          //   //     role: admin.Role,
          //   //     access: admin.accessToContent,
          //   //     name: admin.email,
          //   //     profilePhoto: admin.profilePhoto,
          //   //     mobileNo: admin.mobileNumber,
          //   //     username: admin.FullName,
          //   //     adminId: admin._id,
          //   //     msg: "Successfully loggedIn",
          //   //   });
          //   }
          // );
        } else {
          return res.json({
            status: false,
            data: null,
            msg: "Invalid Role",
          });
        }

      } else {
        return res.json({
          status: false,
          data: null,
          msg: "incorrect password ",
        });
      }
    });
  } else {
    return res.json({
      status: false,
      msg: "Not an admin",
    });
  }
});



adminTeacher.post("/send-otp", isAdmin, async (req, res) => {
  const { action } = req.body;
  if (action === "") {
    return res.status(400).json({
      status: false,
      data: null,
      msg: "Action Not found",
    });
  }

  try {
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      if (err) {
        return res.status(401).json({
          status: false,
          err: err,
          data: null,
          msg: "Not an admin",
        });
      }

      const admin_data = await adminTeacherTable.findOne({
        userId: Data.studentId,
      });
      if (admin_data) {
        const otp = Math.floor(Math.random() * 9000) + 1000;
        await adminTeacherTable.findByIdAndUpdate(admin_data._id, { otp });

        const emailData = {
          otp: otp,
          action: action,

        };
        await sendEmail(
          "twoFactorAdmin",
          "sdcampus@trando.in",
          "SD Campus",
          // "UPSC हिन्दी",
          emailData
        );

        return res.json({
          status: true,
          data: action,
          msg: "OTP sent successfully",
        });
      } else {
        return res.json({
          status: false,
          msg: "Admin not found!",
        });
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      err: err,
      msg: "Something went wrong",
    });
  }
});

adminTeacher.post("/verify-otp", isAdmin, async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({
      status: false,
      data: null,
      msg: "Enter OTP",
    });
  }

  try {
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      if (err) {
        return res.status(401).json({
          status: false,
          err: err,
          msg: "Not an admin",
        });
      }

      const admin = await adminTeacherTable.findOneAndUpdate(
        { userId: Data.studentId, otp: otp },
        { otp: null },
        { new: true }
      );
      if (admin) {
        return res.json({
          status: true,
          msg: "OTP Verified",
        });
      } else {
        return res.json({
          status: false,
          msg: "Invalid OTP",
        });
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      err: err,
      msg: "Something went wrong",
    });
  }
});

adminTeacher.post("/verify2FA", async (req, res) => {
  const { otp, email } = req.body;
  if (!otp || !email) {
    return res.status(400).json({
      status: false,
      data: null,
      msg: "Enter OTP",
    });
  }

  try {
    const admin = await adminTeacherTable.findOneAndUpdate(
      { otp: otp, email: email },
      { otp: null },
      { new: true }
    );
    if (admin) {
      jwt.sign(
        {
          email: admin.email, studentId: admin.userId,
          accessObj: {
            deleteAccess: admin?.deleteAccess,
            accessForTab: admin?.access,
            access: admin?.Role == 'admin' ? ['all'] : admin?.accessToContent,
            role: admin?.Role,
            profilePhoto: admin?.profilePhoto,
            username: admin?.FullName,
            mobileNo: admin?.mobileNumber
          }
        },
        process.env.ADMIN_SECRET_KEY,
        { expiresIn: "30d" },
        async (err, accessToken) => {
          if (err) {
            console.log(err);
          }
          await adminTeacherTable.findOneAndUpdate(
            { _id: admin?._id, email: email },
            { refreshToken: accessToken },
            { new: true }
          );
          if (admin.Role === 'subadmin') {
            return res.json({
              status: true,
              data: accessToken,
              role: admin.Role,
              access: admin.accessToContent,
              accessForTab: admin.access,
              deleteAccess: admin.deleteAccess,
              name: admin.email,
              profilePhoto: admin.profilePhoto,
              mobileNo: admin.mobileNumber,
              username: admin.FullName,
              adminId: admin._id,
              id: admin._id,
              msg: "Successfully loggedIn",
            });
          }
          if (admin.Role == "admin") {
            return res.json({
              status: true,
              role: admin.Role,
              data: accessToken,
              access: ["all"],
              name: admin.email,
              profilePhoto: admin.profilePhoto,
              mobileNo: admin.mobileNumber,
              username: admin.FullName,
              adminId: admin._id,
              id: admin?._id,
              msg: "Successfully loggedIn",
            });
          }

        }
      );
    } else {
      return res.json({
        status: false,
        msg: "Invalid OTP",
      });
    }

  } catch (err) {
    return res.json({
      status: false,
      err: err,
      msg: err.message || "Something went wrong",
    });
  }
});

adminTeacher.post("/UpdateEnrillId", isAdmin, async (req, res) => {
  try {
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      if (err) {
        return res.status(401).json({
          status: false,
          err: err,
          data: null,
          msg: "Not an admin",
        });
      }
      const admin_data = await adminTeacherTable.findOne({
        userId: Data.studentId,
      });
      if (admin_data) {
        const userData = await UserTable.find({});
        for (let i = 0; i < userData.length; i++) {
          const doc = userData[i];
          const enrollId = (i + 1).toString().padStart(7, "0");
          await UserTable.updateOne(
            { _id: doc._id },
            { $set: { enrollId: enrollId } }
          );
        }
        return res.json({
          status: false,
          msg: "success",
        });
      } else {
        return res.json({
          status: false,
          msg: "Admin not found!",
        });
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      err: err,
      msg: "Something went wrong",
    });
  }
});

adminTeacher.post(
  "/activeInactiveStudent/:userId",
  isAdmin,
  async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;
    if (isActive === undefined || typeof isActive !== "boolean") {
      return res.status(400).json({
        status: false,
        data: null,
        msg: "Invalid value for isActive",
      });
    }

    try {
      jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
        if (err) {
          return res.status(401).json({
            status: false,
            err: err,
            data: null,
            msg: "Not an admin",
          });
        }

        const admin_data = await adminTeacherTable.findOne({
          userId: Data.studentId,
        });
        if (admin_data && userId) {
          const user = await UserTable.findByIdAndUpdate(userId, {
            is_active: isActive,
          });
          if (user) {
            return res.json({
              status: true,
              data: isActive,
              msg: "Status Updated  Successfully",
            });
          } else {
            return res.json({
              status: false,
              data: null,
              msg: "Failed",
            });
          }
        } else {
          return res.json({
            status: false,
            msg: "User not found!",
          });
        }
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        err: err,
        msg: "Something went wrong",
      });
    }
  }
);
//add teacher by the admin
adminTeacher.post(
  "/addNewTeacher",
  isAdmin,
  setHeaders,
  async (req, res, next) => {
    const {
      FullName,
      password,
      email,
      batch,
      access,
      deleteAccess,
      ej_ective,
      mobile,
      Subject,
      isActive,
      category,
      demoVideo,
      qualification,
      is_Special,
      TeacherAccess,
      Role,
      categories
    } = req.body;
    const findTeacher = await adminTeacherTable.findOne({ email: email });
    const TeacherPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    if (!password.match(TeacherPasswordRegex)) {
      return res.json({
        status: false,
        msg: "password is not strong",
      });
    }
    if (findTeacher) {
      return res.json({
        status: false,
        msg: "teacher Already exists ",
      });
    }
    bcrypt.hash(password, 8, async (err, hashedPassword) => {
      if (err) {
        res.json({
          status: false,
          msg: err,
        });
      }
      let Helper = [];
      for (let i = 0; i < Subject.length; i++) {
        const findSubject = await SubjectTable.findOne({ _id: Subject[i] });
        Helper.push(findSubject._id);
      }
      const date = new Date();
      let formatedDate = formatDate(date);
      const Teacher = new adminTeacherTable({
        email: email,
        password: hashedPassword,
        subject: Helper,
        is_Special: is_Special,
        qualification: qualification,
        mobileNumber: mobile,
        is_active: ej_ective,
        created_at: formatedDate,
        FullName: FullName,
        Role: Role,
        category,
        demoVideo,
        accessToContent: TeacherAccess,
        access,
        isActive,
        deleteAccess,
        userId: uuidv1(),
        categories,
      });
      const teacher = await Teacher.save();
      for (let i = 0; i < batch.length; i++) {
        const batchDetails = await BatchesTable.findOne({ _id: batch[i] });
        if (!batchDetails) {
          return res.json({
            status: false,
            data: null,
            msg: `Batch not found`
          })
        }
        batchDetails.teacher.push(teacher?._id);
        await batchDetails.save();
      }
      res.json({
        status: true,
        msg: "teacher details added successfully",
        data: teacher,
      });
    });
  }
);

adminTeacher.put('/makeActiveAndInActiveTeacher/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const admin = await findAdminTeacherUsingUserId(decoded?.studentId);
    if (!admin) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an admin'
      })
    }
    const isExist = await adminTeacherTable.findOne({ _id: id });
    if (!isExist) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not found Teeacher Or admin Or Moderator Or Subadmin'
      })
    }
    let isActive = isExist?.isActive == true ? false : true;
    const updateTeacher = await adminTeacherTable.findByIdAndUpdate(isExist?._id, { isActive: isActive });
    return res.json({
      status: true,
      data: null,
      msg: `${updateTeacher?.FullName}(${updateTeacher?.Role}) Status Changed into ${isActive == true ? 'Active' : 'In Active'}`
    })

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})
//update or edit a teacher
adminTeacher.put("/updateteacher/:id", isAdmin, async (req, res, next) => {
  const { email, FullName, mobile, batch, demoVideo, category, Role, categories, qualification } =
    req.body;
  if (!req.params.id) {
    res.json({
      status: false,
      msg: "teacher id required",
    });
  }
  try {
    // console.log(req.params?.id)
    if (Role == 'teacher' && (demoVideo == "" || categories?.length < 1)) {
      return res.json({
        status: false,
        data: null,
        msg: `Required Demo Video & Catgeory for Teacher`
      })
    }
    const findTeacher = await adminTeacherTable.findOne({ _id: req.params.id });
    if (findTeacher) {
      // bcrypt.hash(password, 8, async (err, hashedPassword) => {
      //   if (err) {
      //     res.json({
      //       status: false,
      //       msg: err,
      //     });
      //   }
      await BatchesTable.updateMany(
        { "teacher": findTeacher._id },
        { $pull: { "teacher": findTeacher._id } }
      );
      for (let i = 0; i < batch.length; i++) {
        const batchDetails = await BatchesTable.findOne({ _id: batch[i] });
        if (!batchDetails) {
          return res.json({
            status: false,
            data: null,
            msg: `Batch not found`
          })
        }
        batchDetails.teacher.push(findTeacher?._id);
        await batchDetails.save();
      }
      await adminTeacherTable.findByIdAndUpdate(req.params.id, {
        email: email,
        // password: hashedPassword,
        mobileNumber: mobile,
        // is_active: ej_ective,
        // access,
        // deleteAccess,
        FullName: FullName,
        qualification: Role == 'teacher' ? qualification : "",
        Role: Role,
        demoVideo: Role == 'teacher' ? demoVideo : "",
        category: Role == 'teacher' ? category : null,
        categories: Role == 'teacher' ? categories : []
      });
      const findTeacher2 = await adminTeacherTable.findOne({
        _id: req.params.id,
      });
      res.json({
        status: true,
        msg: "Teacher details updated successfully",
        before: findTeacher,
        after: findTeacher2,
      });
      // });
    } else {
      res.json({
        status: false,
        msg: `teacher not found with the id${req.params.id}`,
      });
    }
  } catch (err) {
    res.json({
      status: false,
      err: err,
      msg: "wrong id ",
    });
  }
});

adminTeacher.put("/updatepassword", isAdmin, async (req, res, next) => {
  const { password, cpassword } = req.body;

  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminData = await adminTeacherTable.findOne({
      userId: decoded.studentId,
    });

    if (!adminData) {
      return res.json({
        status: false,
        msg: "Admin not found!",
      });
    }

    if (cpassword !== password) {
      return res.json({
        status: false,
        msg: "Both passwords must be the same",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    await adminTeacherTable.findOneAndUpdate(
      { userId: decoded.studentId },
      { password: hashedPassword }
    );

    res.json({
      status: true,
      msg: "Password Updated Successfully!",
    });
  } catch (err) {
    res.json({
      status: false,
      err: err,
      msg: "Something went wrong",
    });
  }
});

adminTeacher.put("/updateProfile", isAdmin, async (req, res) => {
  const { name, mobileNumber, subjectIdsArr, qualification } = req.body;

  if (
    !subjectIdsArr ||
    subjectIdsArr.length === 0 ||
    !name ||
    !mobileNumber ||
    !qualification
  ) {
    return res.status(400).json({
      status: false,
      data: null,
      msg: "Missing required field(s)",
    });
  }

  try {
    const decoded = jwt.verify(req.token, process.env.ADMIN_SECRET_KEY);
    const adminData = await adminTeacherTable.findOne({
      userId: decoded.studentId,
    });

    if (!adminData) {
      return res.json({
        status: false,
        data: null,
        msg: "Admin not found!",
      });
    }

    const subject = await SubjectTable.find({ _id: { $in: subjectIdsArr } });
    if (subject.length === 0) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid Subjects",
      });
    }

    const updatedAdmin = await adminTeacherTable.findByIdAndUpdate(
      adminData._id,
      {
        FullName: name,
        mobileNumber,
        subject: subjectIdsArr,
        qualification,
      }
    );

    if (updatedAdmin) {
      res.json({
        status: true,
        data: {
          FullName: name,
          mobileNumber,
          subject: subjectIdsArr,
          qualification,
        },
        msg: "Details Updated Successfully!",
      });
    }
  } catch (err) {
    res.json({
      status: false,
      err: err,
      msg: "Something went wrong",
    });
  }
});

adminTeacher.delete("/delete_techer/:id", isAdmin, async (req, res, next) => {
  if (!req.params.id) {
    res.json({
      status: false,
      msg: "Teacher id required",
    });
  }
  try {
    const techer_data = await adminTeacherTable.findOne({ _id: req.params.id });
    if (techer_data) {
      const del_d = await adminTeacherTable.deleteOne({ _id: req.params.id });
      if (del_d) {
        res.json({
          status: true,
          msg: "Teacher Deleted ",
        });
      }
    }
  } catch (err) {
    res.json({
      status: true,
      msg: "Something went wrong ! Try again",
    });
  }
});

//fetch all teachers data by admin
adminTeacher.get("/teacherList", ValidateToken, async (req, res) => {
  const allTeachers = await adminTeacherTable.find({ Role: "teacher", isActive: true }).populate('categories', "_id title").sort({ _id: -1 });
  res.json({
    status: true,
    data: allTeachers?.map((item) => { return { ...item?._doc, value: item?._id, label: item?.FullName } }),
    msg: "the list of all the teachers in the database ",
  });
});

//fetch all teachers data by admin
adminTeacher.get("/getteacherListByAdmin", isAdmin, async (req, res) => {
  const allTeachers = await adminTeacherTable.find({isActive: true}).populate('categories', "_id title").sort({ _id: -1 });
  res.json({
    status: true,
    data: allTeachers.map((item, index) => { return { ...item?._doc, refreshToken: item?.refreshToken ?? "", profileWithName: { profilePhoto: item?.profilePhoto, name: item?.FullName }, sNo: index + 1, id: item?._id } }),
    msg: "the list of all the teachers in the database ",
  });
});

adminTeacher.get("/getTeacherDetails/:id", ValidateToken, async (req, res) => {
  const { id } = req.params;
  const TeacherDetails = await adminTeacherTable
    .findOne({ _id: id })
    .populate('categories', '_id title')
    .populate("subject", { title: 1 });
  if (TeacherDetails) {
    const Batches = await BatchesTable.find({});
    const TeacherBatches = [];
    if (Batches) {
      for (let i = 0; i < Batches.length; i++) {
        if (Batches[i].teacher.includes(TeacherDetails._id)) {
          TeacherBatches.push(Batches[i]);
        }
      }
    }
    res.json({
      status: true,
      data: {
        TeacherDetails: { ...TeacherDetails?._doc, categories: TeacherDetails?.categories?.map((item) => { return { label: item?.title, value: item?._id } }) },
        BatchesTeacherIn: TeacherBatches,
      },
      msg: `fetcher the teacher details of teacher with the id ${id}`,
    });
  } else {
    res.json({
      status: false,
      data: null,
      msg: "Teacher details not found",
    });
  }
});

//Teacher login route
adminTeacher.post("/TeacherLogin", async (req, res) => {
  const { email, password, host, serverkey } = req.body;
  if (!email || !password || !host || !serverkey || !["live-class.sdcampus.com", "cms.sdcampus.com"]?.includes(host) || serverkey != "SDEMPIRE#$%") {
    return res.json({
      status: false,
      data: null,
      msg: "Please Provide correct details"
    })
  }
  const teacher = await adminTeacherTable.findOne({
    email: email,
    isActive: true
  });
  if (teacher) {
    bcrypt.compare(password, teacher.password, async function (err, result) {
      if (err) {
        return res.send("err" + err);
      }
      if (result == true) {
        if (teacher.Role == "teacher" || teacher.Role === 'moderator') {
          const otp = Math.floor(Math.random() * 9000) + 1000;

          const updateOtp = await adminTeacherTable.findOneAndUpdate({ _id: teacher._id }, { otp: otp }, { new: true, lean: true });
          if (updateOtp) {
            const emailData = {
              otp: updateOtp?.otp,
              action: '2FA Verification'
            }
            await sendEmail(
              "twoFactorAdmin",
              email,
              updateOtp?.FullName,
              emailData
            );
            return res.json({
              status: true,
              data: null,
              msg: 'OTP send successfully'
            })

          }

          // jwt.sign(
          //   {
          //     email: teacher.email, studentId: teacher.userId,
          //     accessObj: {
          //       deleteAccess: teacher?.deleteAccess,
          //       accessForTab: teacher?.access,
          //       access: teacher?.accessToContent,
          //       role: teacher?.Role,
          //       profilePhoto: teacher?.profilePhoto,
          //       username: teacher?.FullName,
          //       mobileNo: teacher?.mobileNumber
          //     }
          //   },
          //   process.env.TEACHER_SECRET_KEY,
          //   { expiresIn: "2d" },
          //   (err, accessToken) => {
          //     if (err) {
          //       console.log(err);
          //     }
          //     return res.json({
          //       status: true,
          //       role: teacher.Role,
          //       data: accessToken,
          //       email: teacher.email,
          //       teacher_id: teacher._id,
          //       id: teacher?._id,
          //       username: teacher.FullName,
          //       accessForTab: teacher.access ?? "",
          //       deleteAccess: teacher.deleteAccess ?? "",
          //       mobileNo: teacher.mobileNumber,
          //       access: teacher.accessToContent,
          //       profilePhoto: teacher.profilePhoto,
          //       msg: "Teacher Successfully loggedIn",
          //     });
          //   }
          // );
        } else {
          return res.json({
            status: false,
            msg: "Not Valid Access",
          });
        }
      } else {
        return res.json({
          status: false,
          msg: "incorrect password",
        });
      }
    });
  } else {
    return res.json({
      status: false,
      msg: "Account Not Exists",
    });
  }
});

//Teacher Section
adminTeacher.get("/TeacherSection", isTeacher, async (req, res) => {
  jwt.verify(req.token, process.env.TEACHER_SECRET_KEY, async (err, Data) => {
    if (err) {
      return res.json({
        err: err,
        status: false,
        data: null,
        msg: "Please login as an admin !",
      });
    } else {
      const teacher = await adminTeacherTable.findOne({ email: Data.email });
      if (teacher) {
        if (teacher.is_active == true) {
          res.json({
            status: true,
            msg: "user is_active is true",
          });
        } else {
          return res.json({
            status: true,
            msg: "user is_active is false",
          });
        }
      } else {
        return res.json({
          err: err,
          status: false,
          data: null,
          msg: "not authorized  !",
        });
      }
    }
  });
});

//Update the Teacher Permission
adminTeacher.put(
  "/updateTheTeacherPermission/:id",
  isAdmin,
  async (req, res) => {
    const { ej_ective, tabs } = req.body;
    if (!req.params.id) {
      res.json({
        status: false,
        msg: "teacher id required",
      });
    }
    try {
      const findTeacher = await adminTeacherTable.findOne({
        _id: req.params.id,
      });
      if (findTeacher) {
        await adminTeacherTable.findByIdAndUpdate(req.params.id, {
          is_active: ej_ective,
          accessToContent: tabs,
        });
        return res.json({
          status: true,
          msg: "Teacher permissions is succefully updated",
        });
      } else {
        res.json({
          status: false,
          msg: `Teacher not found with the id${req.params.id}`,
        });
      }
    } catch (err) {
      res.json({
        status: false,
        err: err,
        msg: "wrong id ",
      });
    }
  }
);


adminTeacher.get("/getAllTeacherList", isAdmin, async (req, res) => {
  try {
    const teachers = await adminTeacherTable.find({ Role: { $ne: "admin" }, isActive: true }).select('_id FullName Role');
    return res.json({
      status: false,
      data: teachers?.map((item) => {
        return {
          value: item?._id,
          label: item?.FullName,
          role: item?.Role,
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

adminTeacher.post("/verifyTeacher", async (req, res) => {
  const { otp, email } = req.body;
  if (!otp || !email) {
    return res.status(400).json({
      status: false,
      data: null,
      msg: "Enter OTP",
    });
  }

  try {
    const teacher = await adminTeacherTable.findOneAndUpdate(
      { otp: otp, email: email },
      { otp: null },
      { new: true }
    );
    if (teacher) {
      jwt.sign(
        {
          email: teacher.email, studentId: teacher.userId,
          accessObj: {
            deleteAccess: teacher?.deleteAccess,
            accessForTab: teacher?.access,
            access: teacher?.accessToContent,
            role: teacher?.Role,
            profilePhoto: teacher?.profilePhoto,
            username: teacher?.FullName,
            mobileNo: teacher?.mobileNumber
          }
        },
        process.env.TEACHER_SECRET_KEY,
        { expiresIn: "24h" },
        async (err, accessToken) => {
          if (err) {
            console.log(err);
          }
          await adminTeacherTable.findOneAndUpdate(
            { _id: teacher?._id, email: email },
            { refreshToken: accessToken },
            { new: true }
          );
          return res.json({
            status: true,
            role: teacher.Role,
            data: accessToken,
            email: teacher.email,
            teacher_id: teacher._id,
            id: teacher?._id,
            username: teacher.FullName,
            accessForTab: teacher.access ?? "",
            deleteAccess: teacher.deleteAccess ?? "",
            mobileNo: teacher.mobileNumber,
            access: teacher.accessToContent,
            profilePhoto: teacher.profilePhoto,
            msg: "Teacher Successfully loggedIn",
          });
        }
      );
    } else {
      return res.json({
        status: false,
        msg: "Invalid OTP",
      });
    }

  } catch (err) {
    return res.json({
      status: false,
      err: err,
      msg: err.message || "Something went wrong",
    });
  }
})
module.exports = adminTeacher;
