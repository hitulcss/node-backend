const express = require('express');
const moment = require('moment');
const { ValidateTokenForUser } = require('../middleware/authenticateToken');
const { UserTable } = require('../models/userModel');
const { ValidityTable } = require('../models/Validity');
const { courseOrdesTable } = require('../models/courseOrder');
const { MybatchTable } = require('../models/MyBatches');
const { BatchesTable } = require("../models/BatchesSchema");
const { couponTable } = require('../models/Coupon');
const { formatDate } = require('../middleware/dateConverter');
const { courseTxnTable } = require('../models/coursePaymentTxn');
const { invoiceTable } = require('../models/Invoice');
const { pdfGenerate } = require('../HelperFunctions/invoiceGenrationBatch');
const { uploadFile } = require('../aws/UploadFile');
const path = require('path');
const { newPdfGenerate } = require('../HelperFunctions/invoiceGenrationForBatchNewPayment');

const { sendWAmessageUserDirectPurchase } = require("../HelperFunctions/userFunctions")

const paymentRoute = express.Router();

function generateRandomCourseTransactionId() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000); // You can adjust the range as needed
  const transactionId = `SD${timestamp}${randomNum}`;
  return transactionId;
}

var config = {
  key: process.env.EASEBUZZ_KEY,
  salt: process.env.EASEBUZZ_SALT,
  env: process.env.EASEBUZZ_ENV,
  enable_iframe: process.env.EASEBUZZ_IFRAME,
};

function isValidEmail(email) {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
}

// let BACKEND_API_URL = "https://stage-backend.sdcampus.com/api/v1"
let BACKEND_API_URL = "https://backend-prod.sdcampus.com/api/v1"
// let BACKEND_API_URL = "https://t8zv4r6j-3000.inc1.devtunnels.ms/api/v1"

paymentRoute.post("/initiateCoursePayment", ValidateTokenForUser, async (req, res) => {
  try {
    const userDetails = await UserTable.findOne({ _id: req.userId }).select('_id FullName email mobileNumber')
    //  create order 
    //  create courseOrderValidity
    // create payment 
    const { batchId, couponId, amount, utm_campaign, utm_medium, utm_source, validityId, platform, coins, withBookPrice } = req.body;
    if (!batchId || !amount || !validityId || !['app', 'ios', 'website']?.includes(platform)) {
      return res.json({
        status: false,
        data: null,
        msg: "Required! batchId & Amount & Validity & platform."
      });
    }

    let genOrderId = "0001";
    let today = new Date();
    const latestOrder = await courseOrdesTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    const checkbatch = await BatchesTable.findOne({ _id: batchId, is_active: true }).select('_id batch_name')
    if (!checkbatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch Inactive Or Not Exists"
      })
    }

    const isMyBatch = await MybatchTable.findOne({ user: userDetails?._id, batch_id: batchId, is_active: true }).select('_id')
    if (isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch already purchased."
      })
    }
    const genTxnId = generateRandomCourseTransactionId();
    const checkValidity = await ValidityTable.findOne({ _id: validityId, batch: batchId });
    if (!checkValidity) {
      return res.json({
        status: false,
        data: null,
        msg: 'Validity not exist.'
      })
    }

    if (couponId) {
      const checkCouponId = await couponTable.findOne({ _id: couponId, link: { $in: ['batch', 'category'] }, is_active: true, expirationDate: { $gte: today } })
      if (!checkCouponId) {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code not exists."
        })
      }
      if (req.userId.equals(checkCouponId?.student) && checkCouponId?.count < 0) {
        return res.json({
          status: false,
          data: null,
          msg: 'Invalid coupon'
        })
      }
      if (req.userId.equals(checkCouponId?.student) && checkCouponId?.count < 0) {
        return res.json({
          status: false,
          data: null,
          msg: 'Invalid coupon'
        })
      }

      // check coupon or applicable or not on this batch -- pending 

      // check price is correct or not 
      let discountAmount = parseFloat(amount) + parseFloat(coins);
      if (checkCouponId?.couponType == "percentage") {
        discountAmount = Math.round(checkValidity.salePrice - parseFloat((checkValidity.salePrice * checkCouponId.couponValue) / 100));
      } else if (checkCouponId?.couponType == "fixed") {
        discountAmount = Math.round(checkValidity.salePrice - checkCouponId.couponValue);
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code not applicable."
        })
      }
      if (withBookPrice > 0) {
        discountAmount = Math.round(discountAmount + withBookPrice);
      }
      if (discountAmount != Math.round((parseFloat(amount) + parseFloat(coins)))) {
        return res.json({
          status: false,
          data: null,
          msg: "Amount is not correct."
        })
      }

    } else {
      let newSalePrice = checkValidity.salePrice;
      if (withBookPrice > 0) {
        newSalePrice = Math.round(newSalePrice + withBookPrice);
      }
      if (parseFloat(newSalePrice) != (parseFloat(amount) + parseFloat(coins))) {
        return res.json({
          status: false,
          data: null,
          msg: 'Amount is not correct.'
        })
      }
    }

    const data = {
      name: userDetails.FullName.replace(/ /g, "") ?? "",
      amount: amount,
      txnid: genTxnId,
      email: isValidEmail(userDetails.email) == true ? userDetails?.email : "admin@sdempire.co.in",
      phone: userDetails.mobileNumber ?? "1234567890",
      productinfo: `${checkbatch._id}`,
      // surl: `${process.env.BACKEND_API_URL}/purchase/courseResponse`,
      // furl: `${process.env.BACKEND_API_URL}/purchase/courseResponse`,
      surl: platform !== 'app' ? `${BACKEND_API_URL}/purchase/courseResponse` : `${BACKEND_API_URL}/purchase/courseAppResponse`,
      furl: platform !== 'app' ? `${BACKEND_API_URL}/purchase/courseResponse` : `${BACKEND_API_URL}/purchase/courseAppResponse`,
      udf1: "",
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
      address1: "Moti Bagh",
      address2: "",
      city: " New + Delhi",
      state: "Delhi",
      country: "",
      zipcode: "110021",
      sub_merchant_id: "",
      unique_id: "",
      split_payments: "",
      customer_authentication_id: "",
      udf6: "",
      udf7: "",
      udf8: "",
      udf9: "",
      udf10: ""
    }
    // console.log(data);


    let obj = {
      validity: checkValidity?._id,
      isEmi: false,
      noOfInstallments: "1", // ---> "1"
      pendingInstallment: "0",//---> '0'
      pendingAmount: '0', //---> "0",
      eachInstallmentAmount: '0',  //---> '0',
      nextInstallmentDate: new Date() //---> "",      
    }
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const courseOrderObj = new courseOrdesTable({
      user: userDetails._id,
      orderId: genOrderId,
      courseId: batchId,
      couponId,
      // totalAmount, // it should be calculated
      totalAmount: amount,
      txnId: genTxnId,
      paymentStatus: 'pending',
      isPaid: false,
      purchaseDate: formatedDate,
      ...obj,
      utm_campaign,
      utm_source,
      utm_medium,
      platform: platform,
    })
    const saveOrder = await courseOrderObj.save();
    let OrderInfo = {}
    if (saveOrder) {
      OrderInfo = {
        id: saveOrder._id ?? "",
        genTxnId: genTxnId,
        txnId: genTxnId ?? "",
        userOrderId: genOrderId ?? "",
        accessKey: config.key ?? "",
        amount: amount,
        paymentMode: "production",
        validityId: checkValidity?._id
      }
    }
    // console.log(data, config, res, OrderInfo);
    var initiate_payment = require('./payment');
    initiate_payment.initiate_payment(data, config, res, OrderInfo);
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

// courseResponse

paymentRoute.post('/courseResponse', async function (req, res) {
  try {
    // console.log("course Response" , req.body);
    if (req.body) {
      const checkOrder = await courseOrdesTable.findOne({ txnId: req.body.txnid });
      // console.log(checkOrder);
      let date = new Date();
      date = formatDate(date);
      if (checkOrder) {
        let courseTxnObj;
        if (req.body.status == 'success') {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: true,
            reason: "" ?? req.body.error,
            txnDate: date
          })

          const saveTxn = await courseTxnObj.save();
          const newCourseOrder = await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: 'success',
            isPaid: true
          }, { new: true, lean: true }).populate('validity', '_id salePrice month').populate('user', '_id mobileNumber email Address FullName').populate('courseId', '_id batch_name');

          // let today = new Date();


          if (newCourseOrder?.paymentStatus == 'success') {
            const batchData = await BatchesTable.findByIdAndUpdate(
              newCourseOrder?.courseId,
              { $addToSet: { student: { $each: [newCourseOrder?.user] } } },
              { new: true, lean: true }
            );
            // genrate courseOrdervalidity 
            // await CourseOrderValidityTable.create({
            //   user :  checkOrder?.user , 
            //   courseOrderId :  checkOrder?._id  , 
            //   batch : checkOrder?.courseId , 
            //   validity :  checkOrder?.validity , 
            //   couponId : checkOrder?.couponId , 
            //   isPaid : true , 
            //   amount : checkOrder.amount , 
            //   txnDate : date , 
            // })
            let expireDate = new Date();
            let registrationDate = new Date();
            let assignedDate = new Date();
            if (batchData.batchId !== 'SDB0330'){
              let extendMonth = parseInt(newCourseOrder?.validity?.month) || 0;
              expireDate.setMonth(expireDate.getMonth() + extendMonth);
            }else{
              const now = moment(registrationDate);

              // Get this week's Monday 5:00 PM
              const currentMonday5PM = moment(now).startOf('isoWeek').hour(17).minute(0).second(0);

              // Get next week's Monday 5:00 PM
              const nextMonday5PM = moment(currentMonday5PM).add(7, 'days');

              // Check if current time is between this Monday 5PM and next Monday 5PM
              if (now.isAfter(currentMonday5PM) && now.isBefore(nextMonday5PM)) {
                assignedDate = moment(currentMonday5PM).add(7, 'days').startOf('day'); // Next Monday
                expireDate = moment(assignedDate).add(5, 'days').endOf('day');
              } else {
                assignedDate = moment(); // fallback or optional handling
                expireDate = moment(assignedDate).add(5, 'days').endOf('day');   // fallback
              }
            }

            const myBatch = new MybatchTable({
              user: newCourseOrder?.user,
              batch_id: newCourseOrder?.courseId,
              amount: newCourseOrder?.totalAmount,
              is_active: true,
              is_paid: true,
              created_at: date,
              updated_at: date,
              isEmi: checkOrder?.isEmi,
              pendingInstallment: checkOrder?.pendingInstallment,
              nextInstallmentDate: checkOrder?.nextInstallmentDate,
              validForAccess: true,
              validity: newCourseOrder?.validity,
              expireDate: expireDate?.toISOString(),
              assignedDate: assignedDate?.toISOString(),

            })
            const saveBatch = await myBatch.save();
            // console.log(saveBatch);
            let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 });
            let invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
            let addressArray = newCourseOrder?.user?.Address?.split(',');
            let isState = addressArray[addressArray?.length - 2] ?? "";
            let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
            let year = `${moment().format('YY')}-${parseInt(moment().format('YY')) + 1}`
            const dataForInvoice = {
              invoiceNumber: `${year}/${invoiceNumber}`,
              invoiceDate: moment().format("DD-MM-YYYY"),
              studentName: newCourseOrder?.user?.FullName,
              studentAddress: newCourseOrder?.user?.Address ?? "",
              SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
              items: [{ name: newCourseOrder?.courseId?.batch_name ?? "", price: newCourseOrder?.totalAmount, quantity: 1 }],
              studentEmail: newCourseOrder?.user?.email != 'user@gmail.com' ? newCourseOrder?.user?.email : 'NA',
              studentPhone: newCourseOrder?.user?.mobileNumber,
              studentState: state,
              gstNumber: "09ABBCS1440F1ZN"
            }
            const FileUploadLocation = await newPdfGenerate(dataForInvoice);
            const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
            let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
            let ext = path.extname(pdfFilePath);
            // let fileLoc = ''
            const helperString = Math.floor(Date.now() / 1000);
            let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
            let fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
            const newOrder = await courseOrdesTable.findByIdAndUpdate(newCourseOrder?._id, { invoice: [{ installmentNumber: "1", fileUrl: fileLoc }] }, { new: true, lean: true });


            if (newOrder?.invoice?.length >= 1) {
              const newInvoice = new invoiceTable({
                invoiceNumber: invoiceNumber,
              })
              newInvoice.save();
            }
            if (newOrder?.couponId) {
              const coupon = await couponTable.findOne({ _id: newOrder?.couponId, student: newOrder?.user });
              if (coupon) {
                let count = coupon?.count - 1;
                await couponTable.updateOne({ _id: coupon._id }, { count: count })
              }
            }
            await sendWAmessageUserDirectPurchase(newCourseOrder?.user, newCourseOrder?.courseId)
          }

          res.redirect('https://www.sdcampus.com/orderSuccess');


        } else {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: false,
            reason: req.body.error ?? "",
            txnDate: date
          })
          const saveTxn = await courseTxnObj.save()
          // console.log(saveTxn)
          const newOrder = await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: req.body.status ?? "failed",
            isPaid: false
          })

          res.redirect('https://www.sdcampus.com/orderFailed');

        }
      }
    } else {
      res.redirect('https://www.sdcampus.com/orderFailed');
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

paymentRoute.post('/courseAppResponse', async function (req, res) {
  try {
    // console.log("course App Response" , req.body);
    if (req.body) {
      const checkOrder = await courseOrdesTable.findOne({ txnId: req.body.txnid });
      // console.log(checkOrder);
      let date = new Date();
      date = formatDate(date);
      if (checkOrder) {
        let courseTxnObj;
        if (req.body.status == 'success') {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: true,
            reason: "" ?? req.body.error,
            txnDate: date
          })

          const saveTxn = await courseTxnObj.save();
          const newCourseOrder = await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: 'success',
            isPaid: true
          }, { new: true, lean: true }).populate('validity', '_id salePrice month').populate('user', '_id mobileNumber email Address FullName').populate('courseId', '_id batch_name');
          if (newCourseOrder?.paymentStatus == 'success') {
            await BatchesTable.findByIdAndUpdate(
              newCourseOrder?.courseId,
              { $addToSet: { student: { $each: [newCourseOrder?.user] } } },
              { new: true, lean: true }
            );
            let expireDate = new Date();
            let extendMonth = parseInt(newCourseOrder?.validity?.month);
            expireDate.setMonth(expireDate.getMonth() + extendMonth);

            const myBatch = new MybatchTable({
              user: newCourseOrder?.user,
              batch_id: newCourseOrder?.courseId,
              amount: newCourseOrder?.totalAmount,
              is_active: true,
              is_paid: true,
              created_at: date,
              updated_at: date,
              isEmi: checkOrder?.isEmi,
              pendingInstallment: checkOrder?.pendingInstallment,
              nextInstallmentDate: checkOrder?.nextInstallmentDate,
              validForAccess: true,
              validity: newCourseOrder?.validity,
              expireDate: expireDate

            })
            const saveBatch = await myBatch.save();
            // console.log(saveBatch);
            let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 });
            let invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
            let addressArray = newCourseOrder?.user?.Address?.split(',');
            let isState = addressArray[addressArray?.length - 2] ?? "";
            let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
            let year = `${moment().format('YY')}-${parseInt(moment().format('YY')) + 1}`
            const dataForInvoice = {
              invoiceNumber: `${year}/${invoiceNumber}`,
              invoiceDate: moment().format("DD-MM-YYYY"),
              studentName: newCourseOrder?.user?.FullName,
              studentAddress: newCourseOrder?.user?.Address ?? "",
              SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
              items: [{ name: newCourseOrder?.courseId?.batch_name ?? "", price: newCourseOrder?.totalAmount, quantity: 1 }],
              studentEmail: newCourseOrder?.user?.email != 'user@gmail.com' ? newCourseOrder?.user?.email : 'NA',
              studentPhone: newCourseOrder?.user?.mobileNumber,
              studentState: state,
              gstNumber: "09ABBCS1440F1ZN"
            }
            const FileUploadLocation = await newPdfGenerate(dataForInvoice);
            const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
            let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
            let ext = path.extname(pdfFilePath);
            const helperString = Math.floor(Date.now() / 1000);
            let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
            let fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);

            const newOrder = await courseOrdesTable.findByIdAndUpdate(newCourseOrder?._id, { invoice: [{ installmentNumber: "1", fileUrl: fileLoc }] }, { new: true, lean: true });

            if (newOrder?.invoice?.length >= 1) {
              const newInvoice = new invoiceTable({
                invoiceNumber: invoiceNumber,
              })
              newInvoice.save();
            }
            if (newOrder?.couponId) {
              const coupon = await couponTable.findOne({ _id: newOrder?.couponId, student: newOrder?.user });
              if (coupon) {
                let count = coupon?.count - 1;
                await couponTable.updateOne({ _id: coupon._id }, { count: count })
              }
            }
            await sendWAmessageUserDirectPurchase(newCourseOrder?.user, newCourseOrder?.courseId)
          }
          return res.json({
            status: true,
            data: null,
            msg: "Payment successful"
          })


        } else {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: false,
            reason: req.body.error ?? "",
            txnDate: date
          })
          const saveTxn = await courseTxnObj.save()
          // console.log(saveTxn)
          await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: req.body.status ?? "failed",
            isPaid: false
          })

          return res.json({
            status: false,
            data: null,
            msg: "Payment failed"
          })

        }
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Payment failed"
        })
      }
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "Payment failed"
      })
    }
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }

});

paymentRoute.post("/addValidity", ValidateTokenForUser, async (req, res) => {
  try {
    const userDetails = await UserTable.findOne({ _id: req.userId }).select('_id FullName email mobileNumber')
    //  create order 
    //  create courseOrderValidity
    // create payment 
    const { batchId, couponId, amount, utm_campaign, utm_medium, utm_source, validityId, platform, coins } = req.body;
    if (!batchId || !amount || !validityId || !['app', 'ios', 'website']?.includes(platform)) {
      return res.json({
        status: false,
        data: null,
        msg: "Required!  & batchId & Amount & Validity & platform."
      });
    }

    let genOrderId = "0001";
    let today = new Date();
    const latestOrder = await courseOrdesTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    const isMyBatch = await MybatchTable.findOne({ user: req.userId, batch: batchId, is_active: true }).select('_id batch_id')
    if (!isMyBatch) {
      return res.json({
        status: false,
        data: null,
        msg: "Batch not purchased till now."
      })
    }
    const genTxnId = generateRandomCourseTransactionId();
    const checkValidity = await ValidityTable.findOne({ _id: validityId, batch: batchId });
    if (!checkValidity) {
      return res.json({
        status: false,
        data: null,
        msg: 'Validity not exist.'
      })
    }

    if (couponId) {
      const checkCouponId = await couponTable.findOne({ _id: couponId, link: { $in: ['batch', 'category'] }, is_active: true, expirationDate: { $gte: today } })
      if (!checkCouponId) {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code not exists."
        })
      }
      if (req.userId.equals(checkCouponId?.student) && checkCouponId?.count < 0) {
        return res.json({
          status: false,
          data: null,
          msg: 'Invalid coupon'
        })
      }

      // check coupon or applicable or not on this batch -- pending 

      // check price is correct or not 
      let discountAmount = parseFloat(amount) + parseFloat(coins);
      if (checkCouponId?.couponType == "percentage") {
        discountAmount = checkValidity.salePrice - parseFloat((checkValidity.salePrice * checkCouponId.couponValue) / 100)
      } else if (checkCouponId?.couponType == "fixed") {
        discountAmount = checkValidity.salePrice - checkCouponId.couponValue;
      } else {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code not applicable."
        })
      }
      if (discountAmount != (parseFloat(amount) + parseFloat(coins))) {
        return res.json({
          status: false,
          data: null,
          msg: "Amount is not correct."
        })
      }

    } else {
      if (parseFloat(checkValidity.salePrice) != (parseFloat(amount) + parseFloat(coins))) {
        return res.json({
          status: false,
          data: null,
          msg: 'Amount is not correct.'
        })
      }
    }

    const data = {
      name: userDetails.FullName.replace(/ /g, "") ?? "",
      amount: amount,
      txnid: genTxnId,
      email: isValidEmail(userDetails.email) == true ? userDetails?.email : "admin@sdempire.co.in",
      phone: userDetails.mobileNumber ?? "1234567890",
      productinfo: `${isMyBatch?.batch_id?._id}`,
      // surl: `${process.env.BACKEND_API_URL}/purchase/courseResponse`,
      // furl: `${process.env.BACKEND_API_URL}/purchase/courseResponse`,

      surl: platform !== 'app' ? `${BACKEND_API_URL}/purchase/validityResponse` : `${BACKEND_API_URL}/purchase/validityAppResponse`,
      furl: platform !== 'app' ? `${BACKEND_API_URL}/purchase/validityResponse` : `${BACKEND_API_URL}/purchase/validityAppResponse`,
      udf1: "",
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
      address1: "Moti Bagh",
      address2: "",
      city: " New + Delhi",
      state: "Delhi",
      country: "",
      zipcode: "110021",
      sub_merchant_id: "",
      unique_id: "",
      split_payments: "",
      customer_authentication_id: "",
      udf6: "",
      udf7: "",
      udf8: "",
      udf9: "",
      udf10: ""
    }
    // console.log(data);


    let obj = {
      validity: checkValidity?._id,
      isEmi: false,
      noOfInstallments: "1", // ---> "1"
      pendingInstallment: "0",//---> '0'
      pendingAmount: '0', //---> "0",
      eachInstallmentAmount: '0',  //---> '0',
      nextInstallmentDate: new Date() //---> "",      
    }
    const date = new Date(moment().add(5, "hours").add(30, "minutes"));
    let formatedDate = formatDate(date);
    const courseOrderObj = new courseOrdesTable({
      user: userDetails._id,
      orderId: genOrderId,
      courseId: batchId,
      couponId,
      // totalAmount, // it should be calculated
      totalAmount: amount,
      txnId: genTxnId,
      paymentStatus: 'pending',
      isPaid: false,
      purchaseDate: formatedDate,
      ...obj,
      utm_campaign,
      utm_source,
      utm_medium,
      platform: platform,
    })
    const saveOrder = await courseOrderObj.save();
    let OrderInfo = {}
    if (saveOrder) {
      OrderInfo = {
        id: saveOrder._id ?? "",
        genTxnId: genTxnId,
        txnId: genTxnId ?? "",
        userOrderId: genOrderId ?? "",
        accessKey: config.key ?? "",
        amount: amount,
        paymentMode: "production",
        validityId: checkValidity?._id
      }
    }
    // console.log(data, config, res, OrderInfo);
    var initiate_payment = require('./payment');
    initiate_payment.initiate_payment(data, config, res, OrderInfo);
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

paymentRoute.post('/validityResponse', async function (req, res) {
  try {
    // console.log(req);
    // console.log(req.body);
    if (req.body) {
      let date = new Date();
      date = formatDate(date);
      const checkOrder = await courseOrdesTable.findOne({ txnId: req.body.txnid })
      if (checkOrder) {
        let courseTxnObj;
        if (req.body.status == 'success') {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: true,
            reason: "" ?? req.body.error,
            txnDate: date
          })
          const saveTxn = await courseTxnObj.save();
          const newCourseOrder = await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: 'success',
            isPaid: true
          }, { new: true, lean: true }).populate('validity', '_id salePrice month').populate('user', '_id mobileNumber email Address FullName').populate('courseId', '_id batch_name');

          // let today = new Date();
          // let date = new Date();
          // date = formatDate(date);

          if (newCourseOrder?.paymentStatus == 'success') {

            const isMyBatch = await MybatchTable.findOne({ batch_id: checkOrder?.courseId, user: checkOrder?.user });

            let expireDate = new Date(isMyBatch.expireDate);
            let today = moment().startOf('day');
            let expirationDate = moment(isMyBatch.expireDate).startOf('day');
            if (expirationDate.isBefore(today)) {
              expireDate = new Date();
            }
            let extendMonth = parseInt(newCourseOrder?.validity?.month);
            expireDate.setMonth(expireDate.getMonth() + extendMonth);
            // console.log(expireDate);

            await MybatchTable.findOneAndUpdate({ _id: isMyBatch?._id }, { amount: newCourseOrder?.totalAmount, validity: newCourseOrder?.validity, expireDate: expireDate });

            // console.log('after batch' , newMyBatch);
            let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 });
            let invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
            let addressArray = newCourseOrder?.user?.Address?.split(',');
            let isState = addressArray[addressArray?.length - 2] ?? "";
            let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
            let year = `${moment().format('YY')}-${parseInt(moment().format('YY')) + 1}`
            const dataForInvoice = {
              invoiceNumber: `${year}/${invoiceNumber}`,
              invoiceDate: moment().format("DD-MM-YYYY"),
              studentName: newCourseOrder?.user?.FullName,
              studentAddress: newCourseOrder?.user?.Address ?? "",
              SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
              items: [{ name: newCourseOrder?.courseId?.batch_name ?? "", price: newCourseOrder?.totalAmount, quantity: 1 }],
              studentEmail: newCourseOrder?.user?.email != 'user@gmail.com' ? newCourseOrder?.user?.email : 'NA',
              studentPhone: newCourseOrder?.user?.mobileNumber,
              studentState: state,
              gstNumber: "09ABBCS1440F1ZN",
            }
            const FileUploadLocation = await newPdfGenerate(dataForInvoice);
            const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
            let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
            let ext = path.extname(pdfFilePath);
            // let fileLoc = ''
            const helperString = Math.floor(Date.now() / 1000);
            let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
            let fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
            // console.log("invoice at add validity" , fileLoc);
            const newOrder = await courseOrdesTable.findByIdAndUpdate(newCourseOrder?._id, { invoice: [{ installmentNumber: "1", fileUrl: fileLoc }] }, { new: true, lean: true })
            if (newOrder?.invoice?.length >= 1) {
              const newInvoice = new invoiceTable({
                invoiceNumber: invoiceNumber,
              })
              await newInvoice.save();
            }
            if (newOrder?.couponId) {
              const coupon = await couponTable.findOne({ _id: newOrder?.couponId, student: newOrder?.user });
              if (coupon) {
                let count = coupon?.count - 1;
                await couponTable.updateOne({ _id: coupon._id }, { count: count })
              }
            }
          }
          res.redirect('https://www.sdcampus.com/orderSuccess');
        } else {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: false,
            reason: req.body.error ?? "",
            txnDate: date
          })
          const saveTxn = await courseTxnObj.save()
          await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: req.body.status ?? "failed",
            isPaid: false
          })
          res.redirect('https://www.sdcampus.com/orderFailed');
        }
      }
    } else {
      res.redirect('https://www.sdcampus.com/orderFailed');
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

paymentRoute.post('/validityAppResponse', async function (req, res) {
  try {
    if (req.body) {
      let date = new Date();
      date = formatDate(date);
      const checkOrder = await courseOrdesTable.findOne({ txnId: req.body.txnid })
      if (checkOrder) {
        let courseTxnObj;
        if (req.body.status == 'success') {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: true,
            reason: "" ?? req.body.error,
            txnDate: date
          })
          const saveTxn = await courseTxnObj.save();
          const newCourseOrder = await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: 'success',
            isPaid: true
          }, { new: true, lean: true }).populate('validity', '_id salePrice month').populate('user', '_id mobileNumber email Address FullName').populate('courseId', '_id batch_name');

          if (newCourseOrder?.paymentStatus == 'success') {
            const isMyBatch = await MybatchTable.findOne({ batch_id: checkOrder?.courseId, user: checkOrder?.user });
            let expireDate = new Date(isMyBatch.expireDate);
            let today = moment().startOf('day');
            let expirationDate = moment(isMyBatch.expireDate).startOf('day');
            if (expirationDate.isBefore(today)) {
              expireDate = new Date();
            }
            let extendMonth = parseInt(newCourseOrder?.validity?.month);
            expireDate.setMonth(expireDate.getMonth() + extendMonth);

            await MybatchTable.findOneAndUpdate({ _id: isMyBatch?._id }, { amount: newCourseOrder?.totalAmount, validity: newCourseOrder?.validity, expireDate: expireDate });
            let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 });
            let invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
            let addressArray = newCourseOrder?.user?.Address?.split(',');
            let isState = addressArray[addressArray?.length - 2] ?? "";
            let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
            let year = `${moment().format('YY')}-${parseInt(moment().format('YY')) + 1}`
            const dataForInvoice = {
              invoiceNumber: `${year}/${invoiceNumber}`,
              invoiceDate: moment().format("DD-MM-YYYY"),
              studentName: newCourseOrder?.user?.FullName,
              studentAddress: newCourseOrder?.user?.Address ?? "",
              SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
              items: [{ name: newCourseOrder?.courseId?.batch_name ?? "", price: newCourseOrder?.totalAmount, quantity: 1 }],
              studentEmail: newCourseOrder?.user?.email != 'user@gmail.com' ? newCourseOrder?.user?.email : 'NA',
              studentPhone: newCourseOrder?.user?.mobileNumber,
              studentState: state,
              gstNumber: "09ABBCS1440F1ZN",
            }
            const FileUploadLocation = await newPdfGenerate(dataForInvoice);
            const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
            let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
            let ext = path.extname(pdfFilePath);
            const helperString = Math.floor(Date.now() / 1000);
            let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
            let fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
            const newOrder = await courseOrdesTable.findByIdAndUpdate(newCourseOrder?._id, { invoice: [{ installmentNumber: "1", fileUrl: fileLoc }] }, { new: true, lean: true })
            if (newOrder?.invoice?.length >= 1) {
              const newInvoice = new invoiceTable({
                invoiceNumber: invoiceNumber,
              })
              await newInvoice.save();
            }
            if (newOrder?.couponId) {
              const coupon = await couponTable.findOne({ _id: newOrder?.couponId, student: newOrder?.user });
              if (coupon) {
                let count = coupon?.count - 1;
                await couponTable.updateOne({ _id: coupon._id }, { count: count })
              }
            }
          }

          return res.json({
            status: true,
            data: null,
            msg: "Payment successful"
          })

        } else {
          courseTxnObj = new courseTxnTable({
            user: checkOrder.user,
            orderId: checkOrder._id,
            txnAmount: checkOrder.totalAmount,
            txnId: req.body.txnid,
            easePayId: req.body.easepayid,
            isPaid: false,
            reason: req.body.error ?? "",
            txnDate: date
          })
          const saveTxn = await courseTxnObj.save()
          await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
            paymentStatus: req.body.status ?? "failed",
            isPaid: false
          })
          return res.json({
            status: false,
            data: null,
            msg: "Payment failed"
          })
        }
      }
    } else {
      return res.json({
        status: false,
        data: null,
        msg: "Payment failed"
      })
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});


module.exports = paymentRoute;