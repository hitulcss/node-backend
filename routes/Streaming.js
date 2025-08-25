const express = require("express");
const moment = require("moment");
const {
  StreamingTable,
  clientTable,
  StreamingSumaryTable,
  StreamingUserTable,
} = require("../models/StreamingSchema");
const { UserTable } = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { ValidateToken } = require("../middleware/authenticateToken");
const {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder,
  RtmRole,
} = require("agora-access-token");
const { adminTeacherTable } = require("../models/adminTeacherModel");
const { formatDate } = require("../middleware/dateConverter");
const { findUserByUserId } = require("../HelperFunctions/userFunctions");
const { AllStreamingTable } = require("../models/ALLStreamingModel");
const StreamingRouter = express.Router();

StreamingRouter.get("/h", (req, res) => {
  res.send("hello");
});

const setHeaders = (req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  res.header("Access-Control-Allow-Origin", "*");
  next();
};

//start meeting generate the RTM and RTC token
StreamingRouter.post(
  "/StartMeetingRTCAndRTMToken",
  ValidateToken,
  setHeaders,
  async (req, res) => {
    let APP_ID = process.env.APP_ID;
    let APP_CERTIFICATE = process.env.APP_CERTIFICATE;
    let token;
    let {
      expireTime,
      account,
      is_Active,
      Description,
      Stream_title,
      channelName,
      uid,
    } = req.body;
    if (!channelName) {
      return res.status(500).json({ error: "channel Name is required" });
    }

    if (!expireTime || expireTime === "") {
      expireTime = 3600;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    if (!account) {
      return res.status(400).json({ error: "account is required" }).send();
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      //verifying the user jwt  token
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "User Not authorised !",
        });
      } else {
        const client = await adminTeacherTable.findOne({
          email: Data.email,
        });
        const ChannelExists = await StreamingTable.findOne({
          ChannelName: channelName,
        });
        if (ChannelExists) {
          res.json({
            status: false,
            msg: "channel already exists ",
            data: null,
          });
        } else {
          if (!uid || uid === "") {
            return res.status(500).json({ error: "uid is required" });
          }
          if (req.body.tokentype === "userAccount") {
            token = RtcTokenBuilder.buildTokenWithAccount(
              APP_ID,
              APP_CERTIFICATE,
              channelName,
              account,
              RtcRole.PUBLISHER,
              privilegeExpireTime
            );
          } else if (req.body.tokentype === "uid") {
            token = RtcTokenBuilder.buildTokenWithUid(
              APP_ID,
              APP_CERTIFICATE,
              channelName,
              uid,
              RtcRole.PUBLISHER,
              privilegeExpireTime
            );
          } else {
            return res.status(500).json({ error: "token type is invalid" });
          }
          let key = RtmTokenBuilder.buildToken(
            APP_ID,
            APP_CERTIFICATE,
            uid,
            RtmRole.PUBLISHER,
            privilegeExpireTime
          );
          if (client) {
            // let blockedUsers=[]
            const StreamingDetail = new StreamingTable({
              client: client._id,
              ChannelName: channelName,
              Description: Description,
              end_time: expireTime,
              Stream_title: Stream_title,
              is_Active: is_Active,
              blockedUsers: [],
            });
            await StreamingDetail.save();
            const AddClient = new clientTable({
              clientName: client.username,
              clientEmail: client.email,
              clientId: client._id,
              StreamingChannelID: StreamingDetail._id,
              userID: client.userId,
              RTCToken: token,
              role: "Publisher",
              RTMToken: key,
            });
            await AddClient.save();
            const before = await StreamingTable.findOne({
              ChannelName: channelName,
            });
            before.client = await AddClient._id;
            await before.save();
            return res.json({
              status: true,
              streamId: StreamingDetail._id,
              App_ID: process.env.APP_ID,
              APP_CERTIFICATE: process.env.APP_CERTIFICATE,
              RtcToken: token,
              RtmToke: key,
              channelName: channelName,
              msg: "You have joined the live class successfully",
            });
          } else {
            return res.json({
              status: false,
              msg: "user not registerd",
            });
          }
        }
      }
    });
  }
);

//Join meeting generate the RTM and RTC token
StreamingRouter.post(
  "/JoinMeetingRTCAndRTMToken",
  ValidateToken,
  setHeaders,
  async (req, res) => {
    let APP_ID = process.env.APP_ID;
    let APP_CERTIFICATE = process.env.APP_CERTIFICATE;
    let token;
    let {
      expireTime,
      account,
      Description,
      Stream_title,
      channelName,
      uid,
      Role,
    } = req.body;
    if (!channelName) {
      return res.status(500).json({ error: "channel is required" });
    }
    if (!expireTime || expireTime === "") {
      expireTime = 3600;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    if (!account) {
      return res.status(400).json({ error: "account is required" }).send();
    }
    let userRole;
    if (Role == "host") {
      userRole = RtcRole.PUBLISHER;
    } else {
      userRole = RtcRole.SUBSCRIBER;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    jwt.verify(req.token, process.env.SECRET_KEY, async (err, Data) => {
      //verifying the user jwt  token
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "User Not authorised !",
        });
      } else {
        const client = await findUserByUserId(Data.studentId);
        const adminTeacher = await adminTeacherTable.findOne({
          email: Data.email,
        });
        const ChannelExists = await StreamingTable.findOne({
          ChannelName: channelName,
        });
        if (ChannelExists) {
          let userBlocked = false;
          if (ChannelExists.blockedUsers.includes(client.userId)) {
            userBlocked = true;
          }
          if (client || adminTeacher) {
            if (!uid || uid === "") {
              return res.status(500).json({ error: "uid is required" });
            }
            if (req.body.tokentype === "userAccount") {
              token = RtcTokenBuilder.buildTokenWithAccount(
                APP_ID,
                APP_CERTIFICATE,
                channelName,
                account,
                userRole,
                privilegeExpireTime
              );
            } else if (req.body.tokentype === "uid") {
              token = RtcTokenBuilder.buildTokenWithUid(
                APP_ID,
                APP_CERTIFICATE,
                channelName,
                uid,
                userRole,
                privilegeExpireTime
              );
            } else {
              return res.status(500).json({ error: "token type is invalid" });
            }
            let key = RtmTokenBuilder.buildToken(
              APP_ID,
              APP_CERTIFICATE,
              uid,
              userRole,
              privilegeExpireTime
            );
            if (client) {
              const NewUserStreamingDetails = new StreamingUserTable({
                userJoinUID: uid,
                profilePicture: client.profilePhoto,
                studentName: client.FullName,
                channelName: ChannelExists._id,
                userUniqueId: client.userId,
              });
              NewUserStreamingDetails.save();
            }
            return res.json({
              status: true,
              App_ID: process.env.APP_ID,
              APP_CERTIFICATE: process.env.APP_CERTIFICATE,
              RtcToken: token,
              RtmToke: key,
              userRole: userRole,
              userBlocked: userBlocked,
              userID: client.userId,
              msg: "You have joined the live class successfully",
            });
          } else {
            return res.json({
              status: false,
              msg: "user not registerd",
            });
          }
        } else {
          return res.json({
            status: false,
            msg: "no Streaming started for the Channel Name ",
          });
        }
      }
    });
  }
);

// //Delete the RTC and RTM token . Leave the meeting
// StreamingRouter.delete('/deleteRTCAndRTMToken',ValidateToken,setHeaders,async (req,res)=>{
//   const {channelName}=req.body;
//   jwt.verify(req.token, process.env.SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token
//     if (err) {
//       res.json({
//         err:err,
//         status: false,
//         data: null,
//         msg: "User Not authorised !",
//       });
//     }else{
//   const test=await StreamingTable.findOne({
//     channelName:channelName
//   }).populate('client')
//   let helper=[];
//   if(test){
//   for(let i=0;i<test.client.length;i++){
//     if(test.client[i].userID==Data.studentId){

//     }else{
//         helper.push(test.client[i])
//     }
//   }
// }else{
//   return res.json({
//     data:null,
//     status:false,
//     msg:"Channel Doesnt exists "
//   })
// }
//   const finalUpdated=await StreamingTable.findOne({
//     channelName:channelName
//   })
//   finalUpdated.client=helper;
//   await finalUpdated.save();
//   const after=await StreamingTable.findOne({
//     channelName:channelName
//   }).populate('client')
//   res.json({
//     data:test,
//     after:after
//   })
// }})
// })

//EditChannel details
StreamingRouter.put("/EditChannelData", setHeaders, async (req, res) => {
  const { channelName, is_Active } = req.body;
  const channel = await StreamingTable.findOne({ channelName: channelName });
  if (channel) {
    await StreamingTable.update(
      { channelName: channelName },
      { is_Active: is_Active }
    );
    const after = await StreamingTable.findOne({ channelName: channelName });
    res.json({
      status: true,
      msg: "updated the Streaming table",
      after: after,
    });
  } else {
    res.json({
      status: false,
      msg: "channel not found",
    });
  }
});

//End Streaming
StreamingRouter.delete(
  "/EndStreaming",
  ValidateToken,
  setHeaders,
  async (req, res) => {
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      //verifying the user jwt  token
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "User Not authorised !",
        });
      } else {
        const client = await adminTeacherTable.findOne({
          email: Data.email,
        });
        if (client) {
          const channelName = req.query.channelName;
          const StreamingDetails = await StreamingTable.findOne({
            ChannelName: channelName,
          }).populate("client");
          if (StreamingDetails) {
            const date = new Date(moment().add(5, "hours").add(30, "minutes"));
            let formatedDate = formatDate(date);
            await StreamingUserTable.deleteMany({
              channelName: StreamingDetails._id,
            });
            const StreamingSumaryDetails = new StreamingSumaryTable({
              ChannelName: StreamingDetails.ChannelName,
              client: StreamingDetails?.client?.clientId,
              is_Active: StreamingDetails.is_Active,
              Start_dateTime: StreamingDetails.Start_dateTime,
              end_time: StreamingDetails.end_time,
              feature_image: StreamingDetails.feature_image,
              Description: StreamingDetails.Description,
              created_at: formatedDate,
            });
            StreamingSumaryDetails.save();
            const clientDetail = await clientTable.findOne({
              StreamingChannelID: StreamingDetails._id,
            });
            await clientTable.deleteMany({
              StreamingChannelID: StreamingDetails._id,
            });
            await StreamingTable.deleteOne({ ChannelName: channelName });
            res.json({
              status: true,
              data: null,
              data: clientDetail,
              msg: "Deleted the channel ",
            });
          } else {
            res.json({
              status: false,
              data: null,
              data: null,
              msg: "The channel details not found ",
            });
          }
        } else {
          res.json({
            status: false,
            data: null,
            msg: "not a Teacher",
          });
        }
      }
    });
  }
);

StreamingRouter.put("/BlockTheStudent", ValidateToken, async (req, res) => {
  const { channelName, userID } = req.body;
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    //verifying the user jwt  token
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "User Not authorised !",
      });
    } else {
      const TeacherDetails = await adminTeacherTable.findOne({
        userId: Data.studentId,
      });
      if (TeacherDetails) {
        const streamingDetails = await StreamingTable.findOne({
          ChannelName: channelName,
        });
        if (streamingDetails) {
          let helperArray = [...streamingDetails.blockedUsers];
          helperArray.push(userID);
          // helperArray.
          await StreamingTable.findByIdAndUpdate(
            { _id: streamingDetails._id },
            { blockedUsers: helperArray }
          );
          const streamingDetailsAfter = await StreamingTable.findOne({
            ChannelName: channelName,
          });
          res.json({
            status: true,
            data: streamingDetailsAfter,
            msg: "User has been blocked",
          });
        } else {
          res.json({
            status: false,
            data: null,
            msg: "No stream found for the channelName",
          });
        }
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an teacher",
        });
      }
    }
  });
});

StreamingRouter.put("/unBlockTheStudent", ValidateToken, async (req, res) => {
  const { channelName, userID } = req.body;
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    //verifying the user jwt  token
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "User Not authorised !",
      });
    } else {
      const TeacherDetails = await adminTeacherTable.findOne({
        userId: Data.studentId,
      });
      if (TeacherDetails) {
        const streamingDetails = await StreamingTable.findOne({
          ChannelName: channelName,
        });
        if (streamingDetails) {
          let editedArray = [...streamingDetails.blockedUsers];
          let helperArray = [];
          for (let i = 0; i < editedArray.length; i++) {
            if (editedArray[i] == userID) {
            } else {
              helperArray.push(editedArray[i]);
            }
          }
          await StreamingTable.findByIdAndUpdate(
            { _id: streamingDetails._id },
            { blockedUsers: helperArray }
          );
          const streamingDetailsAfter = await StreamingTable.findOne({
            ChannelName: channelName,
          });
          res.json({
            status: true,
            data: streamingDetailsAfter,
            msg: "User has been blocked",
          });
        } else {
          res.json({
            status: false,
            data: null,
            msg: "No stream found for the channelName",
          });
        }
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an teacher",
        });
      }
    }
  });
});

// StreamingRouter.post("/addStreamingUserInfo",ValidateToken,async (req,res)=>{
//   const {userUUID,channelName}=req.body;
//   jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token
//     if (err) {
//       res.json({
//         err:err,
//         status: false,
//         data: null,
//         msg: "User Not authorised !",
//       });
//     }else{
//      const userDetails=await UserTable.findOne({userID:Data.studentId});
//      if(userDetails){
//      const StreamUserDetail=await StreamingUserTable.findOne({
//       userJoinUID:userUUID
//      })
//      if(StreamUserDetail){
//       const channelDetails=await StreamingTable.findOne({ChannelName:channelName})
//       if(channelDetails){
//       const NewUserStreamingDetails=new StreamingUserTable({
//         userJoinUID:userUUID,
//         profilePicture:userDetails.profilePhoto,
//         studentName:userDetails.FullName,
//         channelName:channelDetails._id
//      })}
//      else{
//       res.json({
//         status:false,
//         data:null,
//         msg:"channel doesnt exists "
//       })
//      }
//      }else{
//       res.json({
//         status:false,
//         data:null,
//         msg:"User Details already exists"
//       })
//      }
//      }else{
//       res.json({
//         status:false,
//         data:null,
//         msg:"Not an user"
//       })
//      }
//     }}
//   )
// })

StreamingRouter.get(
  "/StreamingUserDetails",
  ValidateToken,
  async (req, res) => {
    const { channelId } = req.query;
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      //verifying the user jwt  token
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "User Not authorised !",
        });
      } else {
        if (!channelId) {
          const user = await findUserByUserId(Data.studentId);
          if (user) {
            const usersDetails = await StreamingUserTable.findOne({
              userUniqueId: user.userId,
            });
            if (!usersDetails) {
              return res.json({
                status: false,
                data: null,
                msg: "No Users",
              });
            }
            const channelDetails = await StreamingTable.findOne({
              _id: usersDetails.channelName,
            });
            if (channelDetails) {
              const findALLUsersINStream = await StreamingUserTable.find({
                channelName: channelDetails._id,
              });
              if (usersDetails) {
                res.json({
                  status: true,
                  data: findALLUsersINStream,
                  msg: "fetched all the details",
                });
              } else {
                res.json({
                  status: false,
                  data: null,
                  msg: "No data found",
                });
              }
            } else {
              res.json({
                status: false,
                data: null,
                msg: "no data found",
              });
            }
          } else {
            res.json({
              status: false,
              data: null,
              msg: "Not an user",
            });
          }
        } else {
          const StreamingDetailsForAdmin = await StreamingUserTable.find({
            channelName: channelId,
          });
          res.json({
            status: true,
            data: StreamingDetailsForAdmin,
            msg: "fetched the information",
          });
        }
      }
    });
  }
);

StreamingRouter.delete(
  "/deleteUserDetailsFromStream",
  ValidateToken,
  async (req, res) => {
    const { id } = req.body;
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      //verifying the user jwt  token
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "User Not authorised !",
        });
      } else {
        const user = await findUserByUserId(Data.studentId);
        if (user) {
          const UserInfoFromStream = await StreamingUserTable.findOne({
            userJoinUID: id,
          });
          if (UserInfoFromStream) {
            await StreamingUserTable.findByIdAndDelete({
              _id: UserInfoFromStream._id,
            });
            res.json({
              status: false,
              data: null,
              msg: "Removed user info successfully",
            });
          } else {
            res.json({
              status: false,
              data: null,
              msg: "User Info Not Found",
            });
          }
        } else {
          res.json({
            status: false,
            data: null,
            msg: "not an user",
          });
        }
      }
    });
  }
);

//get the STreamingDetails
StreamingRouter.get("/getStreamingDetails", ValidateToken, async (req, res) => {
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    //verifying the user jwt  token
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "User Not authorised !",
      });
    } else {
      const adminTeacher = await adminTeacherTable.findOne({
        email: Data.email,
      });
      if (adminTeacher) {
        const StreamingDetail = await StreamingTable.find({});
        res.json({
          status: true,
          data: StreamingDetail,
          msg: "Fetched all the Streaming Detail",
        });
      } else {
        res.json({
          status: false,
          data: null,
          msg: "not an teacher or admin",
        });
      }
    }
  });
});

//Genarating RTMToken
StreamingRouter.post("/RTMToken", setHeaders, async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  var currentTimestamp = Math.floor(Date.now() / 1000);
  var expirationTimeInSeconds = 3600;
  const channelName = req.body.channelName;
  var privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  var account = req.body.account;
  const RtmRole = req.body.RtmRole;
  let clientName = req.body.clientName;
  let clientEmail = req.body.clientEmail;
  if (!account) {
    return res.status(400).json({ error: "account is required" }).send();
  }
  let APP_ID = process.env.APP_ID;
  let APP_CERTIFICATE = process.env.APP_CERTIFICATE;

  let key = RtmTokenBuilder.buildToken(
    APP_ID,
    APP_CERTIFICATE,
    account,
    RtmRole,
    privilegeExpiredTs
  );
  const RTMTokenDetail = await new StreamingTable({
    channelName: channelName,
    RTMToken: key,
    role: RtmRole,
  });
  await RTMTokenDetail.save();
  const client = await UserTable.findOne({
    username: clientName,
  });
  const AddClient = await new clientTable({
    clientName: clientName,
    clientEmail: clientEmail,
    clientId: client._id,
  });
  await AddClient.save();
  const before = await StreamingTable.findOne({
    channelName: channelName,
  });
  before.client.push(AddClient._id);
  await before.save();
  const after = await StreamingTable.findOne({
    channelName: channelName,
  });

  return res.json({ key: key }).send();
});

//start meeting generate the RTM and RTC token
StreamingRouter.post(
  "/StartMeetingRTCAndRTMTokenAll",
  setHeaders,
  async (req, res) => {
    let APP_ID = "c629c78197e34c5a89c48c2d2c637850";
    let APP_CERTIFICATE = "1f1f9de7e5e14c818e5127b4d6a31514";
    let token;
    let {
      expireTime,
      is_Active,
      account,
      Description,
      Stream_title,
      channelName,
      uid,
    } = req.body;
    if (!channelName) {
      return res.status(500).json({ error: "channel Name is required" });
    }
    if (!expireTime || expireTime === "") {
      expireTime = 3600;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    if (!account) {
      return res.status(400).json({ error: "account is required" }).send();
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime; //verifying the user jwt  token
    const ChannelExists = await AllStreamingTable.findOne({
      ChannelName: channelName,
    });
    if (ChannelExists) {
      res.json({
        status: false,
        msg: "channel already exists ",
        data: null,
      });
    } else {
      if (!uid || uid === "") {
        return res.status(500).json({ error: "uid is required" });
      }
      if (req.body.tokentype === "userAccount") {
        token = RtcTokenBuilder.buildTokenWithAccount(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          account,
          RtcRole.PUBLISHER,
          privilegeExpireTime
        );
      } else if (req.body.tokentype === "uid") {
        token = RtcTokenBuilder.buildTokenWithUid(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          uid,
          RtcRole.PUBLISHER,
          privilegeExpireTime
        );
      } else {
        return res.status(500).json({ error: "token type is invalid" });
      }
      let key = RtmTokenBuilder.buildToken(
        APP_ID,
        APP_CERTIFICATE,
        uid,
        RtmRole.PUBLISHER,
        privilegeExpireTime
      );
      // let blockedUsers=[]
      const StreamingDetail = new AllStreamingTable({
        ChannelName: channelName,
        Description: Description,
        end_time: expireTime,
        Stream_title: Stream_title,
        is_Active: is_Active,
        blockedUsers: [],
      });
      await StreamingDetail.save();
      return res.json({
        status: true,
        streamId: StreamingDetail._id,
        App_ID: process.env.APP_ID,
        APP_CERTIFICATE: process.env.APP_CERTIFICATE,
        RtcToken: token,
        RtmToke: key,
        channelName: channelName,
        msg: "You have joined the live class successfully",
      });
    }
  }
);

//Join meeting generate the RTM and RTC token
StreamingRouter.post(
  "/JoinMeetingRTCAndRTMTokenAll",
  setHeaders,
  async (req, res) => {
    let APP_ID = "c629c78197e34c5a89c48c2d2c637850";
    let APP_CERTIFICATE = "1f1f9de7e5e14c818e5127b4d6a31514";
    let token;
    let { expireTime, account, channelName, uid, Role } = req.body;
    if (!channelName) {
      return res.status(500).json({ error: "channel is required" });
    }
    if (!expireTime || expireTime === "") {
      expireTime = 3600;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    if (!account) {
      return res.status(400).json({ error: "account is required" }).send();
    }
    let userRole;
    if (Role == "host") {
      userRole = RtcRole.PUBLISHER;
    } else {
      userRole = RtcRole.SUBSCRIBER;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime; //verifying the user jwt  token
    const ChannelExists = await AllStreamingTable.findOne({
      ChannelName: channelName,
    });
    if (ChannelExists) {
      let userBlocked = false;
      if (!uid || uid === "") {
        return res.status(500).json({ error: "uid is required" });
      }
      if (req.body.tokentype === "userAccount") {
        token = RtcTokenBuilder.buildTokenWithAccount(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          account,
          userRole,
          privilegeExpireTime
        );
      } else if (req.body.tokentype === "uid") {
        token = RtcTokenBuilder.buildTokenWithUid(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          uid,
          userRole,
          privilegeExpireTime
        );
      } else {
        return res.status(500).json({ error: "token type is invalid" });
      }
      let key = RtmTokenBuilder.buildToken(
        APP_ID,
        APP_CERTIFICATE,
        uid,
        userRole,
        privilegeExpireTime
      );
      return res.json({
        status: true,
        App_ID: process.env.APP_ID,
        APP_CERTIFICATE: process.env.APP_CERTIFICATE,
        RtcToken: token,
        RtmToke: key,
        userRole: userRole,
        userBlocked: userBlocked,
        userID: "",
        msg: "You have joined the live class successfully",
      });
    } else {
      return res.json({
        status: false,
        msg: "no Streaming started for the Channel Name ",
      });
    }
  }
);

//End Streaming
StreamingRouter.delete("/EndStreamingALL", setHeaders, async (req, res) => {
  //verifying the user jwt  token
  const channelName = req.body.channelName;
  const StreamingDetails = await AllStreamingTable.findOne({
    channelName: channelName,
  });
  if (StreamingDetails) {
    await AllStreamingTable.deleteOne({ ChannelName: channelName });
    res.json({
      status: true,
      data: null,
      msg: "Deleted the channel ",
    });
  } else {
    res.json({
      status: false,
      data: null,
      data: null,
      msg: "The channel details not found ",
    });
  }
});

// StreamingRouter.put('/')

module.exports = StreamingRouter;
