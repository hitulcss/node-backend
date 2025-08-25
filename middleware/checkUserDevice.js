const jwt = require('jsonwebtoken');
const { adminTeacherTable } = require('../models/adminTeacherModel');
const { UserTable } = require('../models/userModel');
require("dotenv").config();



function isSameDevice(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {         //verifying the user jwt  token 
      if (err) {
        return res.json({
          err: err,
          status: false,
          data: null,
          msg: "Please login as an admin !",
        });
      } else {
        const userDetails = await UserTable.findOne({ userId: Data.studentId });
        const adminDetails = await adminTeacherTable.findOne({ userId: Data.studentId })
        if (userDetails) {
          const { deviceId } = req.query;
          console.log("deviceId" + deviceId)
          if (userDetails.deviceConfig == deviceId) {
            next();
          } else {
            res.json({
              status: true,
              data: { loggedIn: false },
              msg: "please Login"
            })
          }
        } else if (adminDetails) {
          next();
        }
        else {
          res.json({
            status: false,
            data: null,
            msg: "Not an User"
          })
        }
      }
    })
  }
}


module.exports = {
  isSameDevice
}