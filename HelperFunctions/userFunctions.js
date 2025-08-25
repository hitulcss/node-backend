const { UserTable } = require("../models/userModel");
const { AppliedCoinsTable } = require("../models/appliedCoins")
const { walletTxnTable } = require("../models/walletTxn")
const { paymentTransactionTable } = require("../models/paymentTransaction")
const { courseOrdesTable } = require("../models/courseOrder");
const { MybatchTable } = require("../models/MyBatches");
const { batchPurchaseSuccess } = require("../HelperFunctions/whatsAppTemplates")

const findUserByUserId = async (userId) => {
  const userDetails = await UserTable.findOne({ userId: userId });
  return userDetails;
};

const getFcmTokenArrByUserIdArr = async (UserIdArr) => {
  const users = await UserTable.find({
    _id: { $in: UserIdArr },
    fcmToken: { $exists: true, $ne: null, $ne: "" },
  });
  const tokenArr = users.map((user) => user.fcmToken);
  return tokenArr;
};

const verifyUserIds = async (userIdsArr) => {
  try {
    const count = await UserTable.countDocuments({ _id: { $in: userIdsArr } });
    return count === userIdsArr.length;
  } catch (err) {
    console.error("Error verifying user IDs:", err);
    return false;
  }
};

const findUserByEmail = async (email) => {
  const userDetails = await UserTable.findOne({ email: email });
  return userDetails;
};

const findUserByMobileNumber = async (mobileNumber) => {
  const userDetails = await UserTable.findOne({ mobileNumber: mobileNumber });
  return userDetails;
};

const generateReferralCode = async () => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referralCode = "";
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    referralCode += charset[randomIndex];
  }
  return referralCode.toUpperCase();
}

const saveRefAmount = async (userId, data) => {

  const refAmountObj = new walletTxnTable({
    user: userId,
    action: data.action,
    reason: data.reason,
    amount: data.amount,
    dateTime: data.dateTime
  })
  const saveRefAmount = await refAmountObj.save()
  if (saveRefAmount) {
    return saveRefAmount
  }
  return null
}

// batch assign from AdminPanel
const sendWAmessageUserBatchAssign = async (userId, batchId) => {
  try {
    const user = await UserTable.findById(userId);
    if (!user) {
      return { status: false, data: null, msg: "User not found" };
    }

    // Check if the user is enrolled in the batch and has paid
    const batchData = await MybatchTable.findOne({
      user: userId,
      batch_id: batchId,
      is_paid: true
    }).populate('batch_id', '_id batch_name');

    if (!batchData) {
      return { status: false, data: null, msg: "Batch not found or payment not made" };
    }

    // Check payment transaction for the batch
    const paymentTxn = await paymentTransactionTable.findOne({
      user: userId,
      batch_name: batchData.batch_id.batch_name
    }).sort({ createdAt: -1 });

    if (!paymentTxn) {
      return { status: false, data: null, msg: "Payment transaction not found" };
    }
    const dataObj = {
      name: paymentTxn.name || "Learner",
      phone: paymentTxn.mobileNumber || "7428394519",
      batchName: paymentTxn.batch_name || "Batch",
      invoiceUrl: paymentTxn.invoice?.[0]?.fileUrl || ""
    }
    await batchPurchaseSuccess(dataObj)
    return {
      status: true,
      data: null,
      msg: "success"
    };
  } catch (error) {
    //console.error("Error in verifyUserBatchAssign:", error);
    return { status: false, data: null, msg: "Internal server error" };
  }
};

const sendWAmessageUserDirectPurchase = async (userId, batchId) => {
  try {
    const user = await UserTable.findById(userId);
    if (!user) {
      return { status: false, data: null, msg: "User not found" };
    }

    // Check if the user is enrolled in the batch and has paid
    const batchData = await MybatchTable.findOne({
      user: userId,
      batch_id: batchId,
      is_paid: true
    });

    if (!batchData) {
      return { status: false, data: null, msg: "Batch not found or payment not made" };
    }

    // Check course order for the batch
    const courseOrder = await courseOrdesTable.findOne({
      user: userId,
      courseId: batchId,
      isPaid: true
    }).populate('courseId', '_id batch_name')
      .populate('user', 'FullName mobileNumber');

    if (!courseOrder) {
      return { status: false, data: null, msg: "Payment transaction not found" };
    }
    const dataObj = {
      name: courseOrder.user.FullName || "Learner",
      phone: courseOrder.user.mobileNumber || "7428394519",
      batchName: courseOrder.courseId.batch_name || "Batch",
      invoiceUrl: courseOrder.invoice?.[0]?.fileUrl || ""
    }
    await batchPurchaseSuccess(dataObj)
    return {
      status: true,
      data: null,
      msg: "success"
    };
  } catch (error) {
    //console.error("Error in verifyUserBatchAssign:", error);
    return { status: false, data: null, msg: "Internal server error" };
  }
};

module.exports = {
  findUserByUserId,
  findUserByEmail,
  findUserByMobileNumber,
  getFcmTokenArrByUserIdArr,
  verifyUserIds,
  generateReferralCode,
  saveRefAmount,
  sendWAmessageUserBatchAssign,
  sendWAmessageUserDirectPurchase
};
