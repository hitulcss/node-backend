const express = require("express");
const razorpay = require("razorpay");
const shortid = require("shortid");
const moment = require("moment");
const cors = require("cors");
const crypto = require("crypto");
const { paymentTransactionTable } = require("../models/paymentTransaction");
const { ValidateToken } = require("../middleware/authenticateToken");
const { UserTable } = require("../models/userModel");
const { MybatchTable } = require("../models/MyBatches");
const jwt = require("jsonwebtoken");
const { v1: uuidv1, validate } = require("uuid");
const { BatchesTable } = require("../models/BatchesSchema");
const { formatDate, formatTime } = require("../middleware/dateConverter");
const { CartTable } = require("../models/cart");
const { presentorderIdtable } = require("../models/presentOrderIdModel");
const { findUserByUserId, saveRefAmount } = require("../HelperFunctions/userFunctions");
const { addNotificationForUser } = require("./pushNotificationHelper");
const { TestSeriesTestTable } = require("../models/testseriestest");
const { TestSeriesTable } = require("../models/TestSeries");
const {
  paymentTransactionTestSeries,
} = require("../models/TestPaymentTransaction");
const { MyTestSeriesTable } = require("../models/myTestSeries");
const { myNotificationModel } = require("../models/myNotification");
const execSync = require("child_process").execSync;
const request = require("request");
const { sendPushNotification } = require("../firebaseService/fcmService");
const paymentRouter = express.Router();
var sha512 = require('js-sha512');
const axios = require('axios').default;
const { URLSearchParams } = require('url');
const { Cashfree } = require('cashfree-pg');

const { AppliedCoinsTable } = require("../models/appliedCoins")
const { walletTxnTable } = require("../models/walletTxn")
const { storeOrdesTable } = require("../models/storeOrders");
const { storeCartTable } = require("../models/storeCart")
const { storeUserAddressTable } = require("../models/storeUserAddress");
const { couponTable } = require("../models/Coupon");
const { storeTxnTable } = require("../models/storePaymentTxn");
const { courseOrdesTable } = require("../models/courseOrder");
const { courseTxnTable } = require("../models/coursePaymentTxn");
const { sendEmail } = require("../ContactUser/NodeMailer");
const { emiTxnTable } = require("../models/emiTransaction");
const { invoiceTable } = require("../models/Invoice");
const { pdfGenerate } = require("../HelperFunctions/invoiceGenrationBatch");
const path = require('path');
const { uploadFile } = require('../aws/UploadFile');
const { updateInStock } = require("../HelperFunctions/updateInStock");
const { storeProductTable } = require("../models/storeProduct");
const { ValidityTable } = require("../models/Validity");


async function userWalletAmount(userId) {
  const wlmBonus = 51;

  const user = await UserTable.findOne({ _id: userId }, { refUserIds: 1 });
  const refCount = user.refUserIds.length;
  const refAmount = refCount * 21;

  const [withdrawalAmountResult] = await Promise.all([
    walletTxnTable.aggregate([
      { $match: { user: userId, action: 'withdrawal' } },
      { $group: { _id: null, amount: { $sum: { $toInt: "$amount" } } } }
    ])
  ]);
  const withdrawalAmount = withdrawalAmountResult.length > 0 ? withdrawalAmountResult[0].amount : 0;
  const walletBalance = wlmBonus + refAmount - withdrawalAmount;

  return walletBalance;
}

function isValidEmail(email) {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
}

const date = new Date(moment().add(5, "hours").add(30, "minutes"));
let formatedDate = formatDate(date);

// EaseBuzz
var config = {
  key: process.env.EASEBUZZ_KEY,
  salt: process.env.EASEBUZZ_SALT,
  env: process.env.EASEBUZZ_ENV,
  enable_iframe: process.env.EASEBUZZ_IFRAME,
};

// Set DEV Cashfree credentials
// Cashfree.XClientId = "TEST10165043e3f80d0b40f13f9c8fc234056101";
// Cashfree.XClientSecret = "cfsk_ma_test_c15401ff3c103f667499cdc62004b103_680b2673";
// Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

Cashfree.XClientId = "66129630ef184636105090a697692166";
Cashfree.XClientSecret = "cfsk_ma_prod_ba491010ea0edc8b930e3d3efcdf8e24_b9be4403";
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

let generateHash = function (data, config) {
  // console.log("Hash Data", data)
  var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email + "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
  hashstring += "|" + config.salt;
  data.hash = sha512.sha512(hashstring);
  return (data.hash);
}

async function initiatePaymentLink(params) {
  const encodedParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    encodedParams.set(key, value);
  });
  // console.log("Pre", encodedParams)
  const options = {
    method: 'POST',
    url: 'https://pay.easebuzz.in/payment/initiateLink',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    data: encodedParams,
  };

  try {
    const { data } = await axios.request(options);
    // console.log("Payment Status", data);
    return data; // You can return the data if needed
  } catch (error) {
    console.error(error);
    throw error; // You can rethrow the error or handle it as needed
  }
}

function generateRandomTransactionId() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000); // You can adjust the range as needed
  const transactionId = `SDS${timestamp}${randomNum}`;
  return transactionId;
}
function generateRandomCourseTransactionId() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000); // You can adjust the range as needed
  const transactionId = `SD${timestamp}${randomNum}`;
  return transactionId;
}

paymentRouter.post("/generateOrderId", ValidateToken, async (req, res) => {
  const { products, couponId, totalAmount, addressId } = req.body

  if (!products.length || !totalAmount || !addressId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! ProductInfo, amount & addressId"
    });
  }
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "Invalid Request",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {

        let genOrderId = "0001";
        const latestOrder = await storeOrdesTable.findOne({}).sort({ _id: -1 });
        if (latestOrder) {
          const latestOrderId = latestOrder.orderId;
          const numericPart = parseInt(latestOrderId, 10);
          genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
        }

        const genTxnId = generateRandomTransactionId()
        // const checkAddress = await storeUserAddressTable.findOne({ user: userDetails._id, _id: addressId })
        // if (!checkAddress) {
        //   return res.json({
        //     status: false,
        //     data: null,
        //     msg: "Invalid AddressId"
        //   })
        // }
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

        // verify coupon code with product Ids
        const hashData = {
          txnid: genTxnId,
          amount: totalAmount,
          productinfo: "Store Product",
          name: userDetails.FullName.replace(/ /g, "") ?? "",
          email: userDetails.email ?? "admin@sdempire.co.in",
          udf1: "",
          udf2: "",
          udf3: "",
          udf4: "",
          udf5: "",
          udf6: "",
          udf7: "",
          udf8: "",
          udf9: "",
          udf10: ""

          // var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email + "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
          //         hashstring += "|" + config.salt;

        }
        const genPayHash = generateHash(hashData, config)
        const paymentParams = {
          request_flow: 'SEAMLESS',
          key: config.key,
          txnid: genTxnId,
          amount: totalAmount,
          productinfo: "Store Product",
          firstname: userDetails.FullName.replace(/ /g, "") ?? "",
          phone: userDetails.mobileNumber ?? "1234567890",
          email: userDetails.email ?? "admin@sdempire.co.in",
          surl: "https://store.sdcampus.com/orderssuccess",
          furl: "https://store.sdcampus.com/orderfailed",
          hash: genPayHash,
          salt: config.salt,
          udf1: "",
          udf2: "",
          udf3: "",
          udf4: "",
          udf5: "",
          udf6: "",
          udf7: "",
          udf8: "",
          udf9: "",
          udf10: ""
        };

        const paymentGen = await initiatePaymentLink(paymentParams);
        if (paymentGen.status != 1) {
          return res.json({
            status: false,
            data: paymentGen,
            msg: paymentGen.data ?? ""
          })
        }
        const storeOrderObj = new storeOrdesTable({
          user: userDetails._id,
          orderId: genOrderId,
          products,
          couponId,
          totalAmount,
          paymentStatus: 'pending',
          addressId,
          isPaid: false,
          purchaseDate: formatedDate
        })
        const saveOrder = await storeOrderObj.save()
        if (saveOrder) {
          return res.json({
            status: true,
            data: {
              id: saveOrder._id ?? "",
              genTxnId: genTxnId,
              txnId: paymentGen.data ?? "",
              userOrderId: genOrderId ?? "",
              accessKey: config.key ?? "",
              paymentStatus: paymentGen.status ?? 0,
              amount: totalAmount,
              paymentMode: "production"
            },
            msg: "OrderId generated successfully"
          })
        } else {
          return res.json({
            status: false,
            data: null,
            msg: "Error while generating OrderId"
          })
        }
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});


paymentRouter.post('/response', async function (req, res) {
  // console.log("Req", req.body)
  // console.log("Res", res)
  function checkReverseHash(response) {
    // var hashstring = config.salt + "|" + response.status + "|" + response.udf10 + "|" + response.udf9 + "|" + response.udf8 + "|" + response.udf7 +
    //   "|" + response.udf6 + "|" + response.udf5 + "|" + response.udf4 + "|" + response.udf3 + "|" + response.udf2 + "|" + response.udf1 + "|" +
    //   response.email + "|" + response.firstname + "|" + response.productinfo + "|" + response.amount + "|" + response.txnid + "|" + response.key

    var hashstring = config.key + "|" + response.txnid + "|" + response.amount + "|" + response.productinfo + "|" + response.firstname + "|" + response.email +
      "|" + response.udf1 + "|" + response.udf2 + "|" + response.udf3 + "|" + response.udf4 + "|" + response.udf5 + "|" + response.udf6 + "|" + response.udf7 + "|" + response.udf8 + "|" + response.udf9 + "|" + response.udf10;
    hashstring += "|" + config.salt;

    hash_key = sha512.sha512(hashstring);
    if (hash_key == req.body.hash)
      return true;
    else
      return false;
  }
  // if (checkReverseHash(req.body)) {
  if (req.body) {
    const checkOrder = await storeOrdesTable.findOne({ txnId: req.body.txnid })
    if (checkOrder) {
      let storeTxnObj;
      if (req.body.status == 'success') {
        storeTxnObj = new storeTxnTable({
          user: checkOrder.user,
          orderId: checkOrder._id,
          txnAmount: checkOrder.totalAmount,
          txnId: req.body.txnid,
          easePayId: req.body.easepayid,
          isPaid: true,
          reason: "" ?? req.body.error,
          txnDate: formatedDate
        })
        // console.log(checkOrder)
        const saveTxn = await storeTxnObj.save();
        await storeOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
          paymentStatus: 'success',
          isPaid: true
        })

        const productIdsToDelete = checkOrder?.products?.map((item) => item.productId);
        await storeCartTable.deleteMany({
          user: checkOrder?.user,
          'products.productId': { $in: productIdsToDelete }
        });

        res.redirect('https://store.sdcampus.com/orderssuccess');

      } else {
        storeTxnObj = new storeTxnTable({
          user: checkOrder.user,
          orderId: checkOrder._id,
          txnAmount: checkOrder.totalAmount,
          txnId: req.body.txnid,
          easePayId: req.body.easepayid,
          isPaid: false,
          reason: req.body.error ?? "",
          txnDate: formatedDate
        })
        const saveTxn = await storeTxnObj.save()
        await storeOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
          paymentStatus: req.body.status ?? "failed",
          isPaid: false
        })
        res.redirect('https://store.sdcampus.com/orderfailed');
      }


    }

  } else {
    res.redirect('https://store.sdcampus.com/orderfailed');
  }
  // res.send('false, check the hash value ');
});

paymentRouter.post("/saveTxnDetails", ValidateToken, async (req, res) => {
  const { orderId, txnAmount, txnId, easePayId, isPaid } = req.body

  if (!orderId || !txnAmount || !txnId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! orderId, txnAmount, txnId & isPaid"
    });
  }
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "Invalid Request",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {
        const checkOrder = await storeOrdesTable.findOne({ _id: orderId })
        if (!checkOrder) {
          return res.json({
            status: true,
            data: null,
            msg: "OrderId Not Exists"
          })
        }
        const storeTxnObj = new storeTxnTable({
          user: userDetails._id,
          orderId: checkOrder._id ?? orderId,
          txnAmount: checkOrder.totalAmount,
          txnId: txnId,
          isPaid: isPaid,
          easePayId: easePayId ?? "",
          txnDate: formatedDate
        })
        const saveTxn = await storeTxnObj.save()
        if (isPaid) {
          await storeOrdesTable.findByIdAndUpdate(orderId, {
            paymentStatus: 'success',
            isPaid: true
          })
        }
        const orders = await storeOrdesTable.findOne({ _id: orderId }).populate("user", "FullName email mobileNumber")
          .populate("products.productId", " title featuredImage regularPrice");
        let data = {
          orderId: orders?.orderId,
          mobileNumber: orders?.user?.mobileNumber,
          totalAmount: orders?.totalAmount,
          product: orders?.products?.map((item) => {
            return {
              title: item?.productId?.title ?? "",
              image: item?.productId?.featuredImage ?? "",
              qty: item?.quantity ?? "",
              // amount : item?.productId?.regularPrice ?? ""
            }
          }),
          // deliveryDate :  "",
          orderStatus: "placed",
        }
        let to = orders?.user?.email;
        let name = orders?.user?.FullName;

        if (saveTxn && isPaid) {
          await sendEmail("orderStatus", to, name, data);
          return res.json({
            status: true,
            data: saveTxn,
            msg: "Success"
          })
        } else {
          return res.json({
            status: false,
            data: null,
            msg: "Opps ! Something went wrong, Please try again"
          })
        }
      }
      else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});

paymentRouter.get("/getTxnDetails", ValidateToken, async (req, res) => {
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "Invalid Request",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {
        const txn = await storeTxnTable.find({ user: userDetails._id }).populate({ path: "orderId", select: "_id orderId totalAmount isPaid purchaseDate" })
        return res.json({
          status: true,
          data: txn.map((item) => {
            return {
              user: item.user ?? "",
              orderId: item.orderId ?? {},
              txnAmount: item.txnAmount ?? "",
              txnId: item.txnId ?? "",
              isPaid: item.isPaid ?? false,
              txnDate: item.txnDate ?? ""
            }
          }),
          msg: "Txn details"
        })

      }
      else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});

paymentRouter.post("/initiate_payment", ValidateToken, async (req, res) => {

  const { products, couponId, totalAmount, addressId } = req.body
  if (!products.length || !totalAmount || !addressId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! ProductInfo, amount & addressId"
    });
  }

  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "Invalid Request",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {
        let genOrderId = "0001";
        const latestOrder = await storeOrdesTable.findOne({}).sort({ _id: -1 });
        if (latestOrder) {
          const latestOrderId = latestOrder.orderId;
          const numericPart = parseInt(latestOrderId, 10);
          genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
        }

        const genTxnId = generateRandomTransactionId()
        const checkAddress = await storeUserAddressTable.findOne({ user: userDetails._id, _id: addressId })
        if (!checkAddress) {
          return res.json({
            status: false,
            data: null,
            msg: "Invalid AddressId"
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
        // verify coupon code with product Ids
        // console.log("RRR", userDetails)
        const userNN = userDetails.FullName.replace(/\s/g, '');
        const userEmail = userDetails.email.replace(/\s/g, '');
        const data = {
          name: userNN ?? "",
          amount: totalAmount,
          txnid: genTxnId,
          email: userDetails.email ?? "admin@sdempire.co.in",
          phone: userDetails.mobileNumber ?? "1234567890",
          productinfo: "Store Product",
          surl: `${process.env.BACKEND_API_URL}/payment/response`,
          furl: `${process.env.BACKEND_API_URL}/payment/response`,
          udf1: "",
          udf2: "",
          udf3: "",
          udf4: "",
          udf5: "",
          address1: "C2,127 Moti Bagh",
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


        const storeOrderObj = new storeOrdesTable({
          user: userDetails._id,
          orderId: genOrderId,
          products,
          couponId,
          totalAmount,
          txnId: genTxnId,
          paymentStatus: 'pending',
          addressId,
          isPaid: false,
          purchaseDate: formatedDate
        })
        const saveOrder = await storeOrderObj.save()

        // const productIdsToDelete = products.map((item) => item.productId);
        // await storeCartTable.deleteMany({
        //   user: userDetails._id,
        //   'products.productId': { $in: productIdsToDelete }
        // });

        let OrderInfo = {}
        if (saveOrder) {
          OrderInfo = {
            id: saveOrder._id ?? "",
            genTxnId: genTxnId,
            txnId: genTxnId ?? "",
            userOrderId: genOrderId ?? "",
            accessKey: config.key ?? "",
            amount: totalAmount,
            paymentMode: "production"
          }
        }

        var initiate_payment = require('./payment');
        initiate_payment.initiate_payment(data, config, res, OrderInfo);

      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});

paymentRouter.post("/reInitiateStore_payment", ValidateToken, async (req, res) => {

  const { storeOrderId } = req.body
  if (!storeOrderId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required Store Order Id!"
    });
  }

  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decode?.studentId);
    if (!userDetails) {
      return res.json({
        status: false,
        data: null,
        msg: 'Not an user'
      })
    }
    const genTxnId = generateRandomTransactionId();
    const isOrderExist = await storeOrdesTable.findOne({ _id: storeOrderId, isPaid: false });
    if (!isOrderExist) {
      return res.json({
        status: false,
        data: null,
        msg: `Store Order not exist Or Already Paid`
      })
    }
    const userNN = userDetails.FullName.replace(/\s/g, '');
    const userEmail = userDetails.email.replace(/\s/g, '');
    const data = {
      name: userNN ?? "",
      amount: isOrderExist?.totalAmount,
      // txnid: isOrderExist?.txnId,
      txnid: genTxnId,
      email: userDetails.email ?? "admin@sdempire.co.in",
      phone: userDetails.mobileNumber ?? "1234567890",
      productinfo: "Store Product",
      surl: `${process.env.BACKEND_API_URL}/payment/response`,
      furl: `${process.env.BACKEND_API_URL}/payment/response`,
      udf1: "",
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
      address1: "C2,127 Moti Bagh",
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
    let OrderInfo = {
      id: isOrderExist?._id ?? "",
      // genTxnId: isOrderExist?.txnId,
      genTxnId: genTxnId,
      // txnId: isOrderExist?.txnId ?? "",
      txnId: genTxnId,
      userOrderId: isOrderExist?.orderId ?? "",
      accessKey: config.key ?? "",
      amount: isOrderExist?.totalAmount,
      paymentMode: "production"
    }
    await storeOrdesTable.findByIdAndUpdate(isOrderExist?._id, { txnId: genTxnId });
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

// Cashfree  STORE Website PaymentGateway 
paymentRouter.post("/store_initiate_payment", ValidateToken, async (req, res) => {
  const { products, couponId, totalAmount, addressId, deliveryCharges , platform } = req.body;
  // console.log(req.body);
  if (!products.length || !totalAmount || !addressId ||  !['app','store' , 'publication'].includes(platform)) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! ProductInfo, amount & addressId platform"
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
    // console.log( products);
    // const productIds =  products?.map((item) =>{ return item?.productId});
    // const productsArr = await storeProductTable.find({ _id : productIds}).select('_id salePrice');
    // let productsAmount = 0 ;
    //  productsArr.map((item) => {
    //   let productWithQty = products?.find( obj => obj.productId == item?._id) ;
    //   productsAmount += parseFloat(parseFloat( item?.salePrice)*parseFloat(productWithQty?.quantity))
    //  });

    const carts = await storeCartTable.findOne({ user: userDetails?._id }).populate({
      path: 'products.productId',
      select: "_id regularPrice salePrice"
    })
    let productsAmount = carts?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);
    let couponValue = "";
    let couponType = "";
    let couponCode = "";
    if (couponId) {
      const checkCouponId = await couponTable.findOne({ _id: couponId, is_active: true })
      if (!checkCouponId) {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code Not Exists"
        })
      }
      couponType = checkCouponId?.couponType;
      couponValue = checkCouponId?.couponValue;
      couponCode = checkCouponId?.couponCode;
    }
    if (couponCode != "" && ["OFFER5", "OFFER10", "OFFER15"]?.includes(couponCode)) {
      if (productsAmount < 700 && couponCode == "OFFER15" && couponType == "percentage") {
        return res.json({
          status: false,
          data: null,
          msg: `Coupon will not applicable on this price`
        })
      }
      if (productsAmount < 400 && ["OFFER10", "OFFER15"]?.includes(couponCode) && couponType == "percentage") {
        return res.json({
          status: false,
          data: null,
          msg: `Coupon will not applicable on this price`
        })
      }
      if (productsAmount < 200 && ["OFFER5", "OFFER10", "OFFER15"]?.includes(couponCode) && couponType == "percentage") {
        return res.json({
          status: false,
          data: null,
          msg: `Coupon will not applicable on this price`
        })
      }

    }
    let couponDiscount = 0;
    if (couponType == 'fixed') {
      couponDiscount = parseFloat(couponValue);
      productsAmount = parseFloat(productsAmount) - parseFloat(couponDiscount);
    }
    if (couponType == 'percentage') {
      couponDiscount = ((parseFloat(productsAmount) * couponValue) / 100);
      productsAmount = parseFloat(productsAmount) - ((parseFloat(productsAmount) * couponValue) / 100)

    }
    // productsAmount = parseFloat(productsAmount) + parseFloat(deliveryCharges);
    productsAmount = parseFloat(productsAmount);

    if (parseFloat(productsAmount) != parseFloat(totalAmount)) {
      return res.json({
        status: false,
        data: null,
        msg: 'Amount is not right'
      })
    }


    // console.log( parseFloat(productsAmount) == parseFloat(totalAmount))
    // console.log(productsAmount ,  totalAmount , couponDiscount , deliveryCharges)
    // if (((parseFloat(totalAmount) - parseFloat(deliveryCharges) + parseFloat(couponDiscount)) <= 499 && parseInt(deliveryCharges) != 60) || (500 < (parseFloat(totalAmount) - parseFloat(deliveryCharges) + parseFloat(couponDiscount)) && parseInt(deliveryCharges) != 40)) {
    // if (((parseFloat(totalAmount)  + parseFloat(couponDiscount)) <= 499 && parseInt(deliveryCharges) != 60) || (500 < (parseFloat(totalAmount) - parseFloat(deliveryCharges) + parseFloat(couponDiscount)) && parseInt(deliveryCharges) != 40)) {

    //   return res.json({
    //     status: false,
    //     data: null,
    //     msg: 'Some thing went wrong'
    //   })
    // }

    // check amount with coupon discount and deliveryCharge
    let genOrderId = "0001";
    const latestOrder = await storeOrdesTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    const genTxnId = generateRandomTransactionId()
    const checkAddress = await storeUserAddressTable.findOne({ user: userDetails._id, _id: addressId })
    if (!checkAddress) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid AddressId"
      })
    }
    let shippingAddress =  {
      id: checkAddress._id ?? "",
      name: checkAddress?.name ?? "",
      email: checkAddress?.email ?? "",
      phone: checkAddress?.phone ?? "",
      streetAddress: checkAddress?.streetAddress ?? "",
      city: checkAddress?.city ?? "",
      state: checkAddress?.state ?? "",
      country: checkAddress?.country ?? "",
      pinCode: checkAddress?.pinCode ?? "",
    } 

    const userNN = userDetails.FullName.replace(/\s/g, '');
    const userEmail = userDetails.email.replace(/\s/g, '');
    let date = new Date();
    // console.log(req.body);
    const storeOrderObj = new storeOrdesTable({
      user: userDetails._id,
      orderId: genOrderId,
      products,
      couponId,
      totalAmount,
      txnId: genTxnId,
      paymentStatus: 'pending',
      addressId,
      deliveryCharges,
      isPaid: false,
      purchaseDate: date,
      shippingAddress,
      platform
    })
    const saveOrder = await storeOrderObj.save()
    // console.log(saveOrder);
    const request = {
      "order_amount": totalAmount,
      "order_currency": "INR",
      "order_id": saveOrder?._id,
      "customer_details": {
        "customer_id": userDetails._id ?? "",
        "customer_name": userNN ?? "Admin",
        // "customer_email": userEmail ?? "admin@sdempire.co.in",
        "customer_email": isValidEmail(userEmail) == true ? userEmail : "admin@sdempire.co.in",
        "customer_phone": userDetails?.mobileNumber ?? "9983904397"
      },
      "order_meta": {
        "return_url": platform == 'store' ?  `${process.env.STORE_BASE_URL}/ordersstatus/${saveOrder?._id}/${userDetails?._id}` :  `https://www.sdpublication.com/ordersstatus/${saveOrder?._id}/${userDetails?._id}`
      }
    };
    // console.log(request);
    Cashfree.PGCreateOrder("2023-08-01", request).then(async (response) => {
      return res.json({
        status: true,
        data: {
          orderId: saveOrder?._id,
          orderAmount: response.data.order_amount,
          sessionId: response.data.payment_session_id,
          genOrderId,
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
paymentRouter.post("/verify_store_payment", async (req, res) => {
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
      if (response?.data.order_status == 'PAID') {
        const order = await storeOrdesTable.findOneAndUpdate({ _id: orderId }, { paymentStatus: 'success', isPaid: true }, { new: true, lean: true });
        const productIdsToDelete = order?.products?.map((item) => item.productId);
        await storeCartTable.deleteMany({
          user: order?.user,
          'products.productId': { $in: productIdsToDelete }
        });
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

// Website Course Payment Section
paymentRouter.post("/initiate_course_payment", ValidateToken, async (req, res) => {
  const { batchId, couponId, totalAmount, isEmi, noOfInstallments, eachInstallmentAmount, fullAmount, utm_campaign, utm_medium, utm_source , validityId } = req.body;
  if (!batchId || !totalAmount) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! batchId & Amount"
    });
  }
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "Invalid Request",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {
        let genOrderId = "0001";
        const latestOrder = await courseOrdesTable.findOne({}).sort({ _id: -1 });
        if (latestOrder) {
          const latestOrderId = latestOrder.orderId;
          const numericPart = parseInt(latestOrderId, 10);
          genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
        }
        const checkbatch = await BatchesTable.findOne({ _id: batchId, is_active: true })
        if (!checkbatch) {
          return res.json({
            status: false,
            data: null,
            msg: "Batch Inactive Or Not Exists"
          })
        }
        // console.log(checkbatch.batch_name)
        const genTxnId = generateRandomCourseTransactionId()
       
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
        // verify coupon code with product Ids
        const data = {
          name: userDetails.FullName.replace(/ /g, "") ?? "",
          amount: totalAmount,
          txnid: genTxnId,
          email: userDetails.email ?? "admin@sdempire.co.in",
          phone: userDetails.mobileNumber ?? "1234567890",
          productinfo: `${checkbatch._id}`,
          surl: `${process.env.BACKEND_API_URL}/payment/courseresponse`,
          furl: `${process.env.BACKEND_API_URL}/payment/courseresponse`,
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

        // console.log("Data", data)

        // check totalAmount validation depend on emi

        //  isEmi : false
        // noOfInstallments, ---> "1"
        // pendingInstallment ---> '0'
        // pendingAmount ---> "0",
        // eachInstallmentAmount ---> '0',
        // nextInstallmentDate ---> "",
        let obj = {};
       
        if (isEmi == 'true') {
          let date = moment().add(1, "months");
          let isValidAmount = false;
          if (noOfInstallments == '1'
            && parseFloat(totalAmount) != (parseFloat(checkbatch?.discount) - 2000)
            && (parseFloat(fullAmount) != (parseFloat(checkbatch?.discount) - 2000))) {
            isValidAmount = false;
          } else if (noOfInstallments == '2'
            && (parseFloat(totalAmount) != parseFloat((parseFloat(checkbatch?.discount) - 1000) / 2))
            && (parseFloat(fullAmount) != (parseFloat(checkbatch?.discount) - 1000))) {
            isValidAmount = false;
          } else if (noOfInstallments == '3'
            && (parseFloat(totalAmount) != parseFloat(parseFloat(checkbatch?.discount) / 3))
            && (parseFloat(fullAmount) != parseFloat(checkbatch?.discount))) {
            isValidAmount = false
          } else if (noOfInstallments == '6'
            && (parseFloat(totalAmount) != parseFloat(parseFloat(checkbatch?.discount) / 6))
            && (parseFloat(fullAmount) != parseFloat(checkbatch?.discount))) {
            isValidAmount = false
          } else {
            isValidAmount = true;
          }

          if (isValidAmount == false) {
            return res.json({
              status: false,
              data: null,
              msg: 'Amount is not correct'
            })
          }


          obj = {
            isEmi: true,
            noOfInstallments: noOfInstallments,
            pendingInstallment: parseInt(noOfInstallments) - 1,
            pendingAmount: parseFloat(parseFloat(fullAmount) - parseFloat(eachInstallmentAmount)).toFixed(2),
            eachInstallmentAmount: parseFloat(eachInstallmentAmount).toFixed(2),
            nextInstallmentDate: date,

          }


        } else {
          
          obj = {
            isEmi: false,
            noOfInstallments: "1", // ---> "1"
            pendingInstallment: "0",//---> '0'
            pendingAmount: '0', //---> "0",
            eachInstallmentAmount: '0',  //---> '0',
            nextInstallmentDate: new Date() //---> "",
          }
        }
        if( validityId){
          
          //  check validity for this batch 
          const isValidity =  await ValidityTable.findOne({ _id :  validityId , batch : checkbatch?._id })
          if( !isValidity){
            return res.json({
              status : false ,
              data : null ,
              msg :  `Validity not exist for this course`
            })
            
          }else{
            // check totalAmount is correct or not 
            obj.validity = isValidity?._id ; 

          }
          // obj.validity = validityId ; 
        }
        // else{
        //   return res.json({
        //     status : false ,
        //     data : null ,
        //     msg : `Please Select Validity Plan`
        //   })
        // }


        const courseOrderObj = new courseOrdesTable({
          user: userDetails._id,
          orderId: genOrderId,
          courseId: batchId,
          couponId,
          // totalAmount, // it should be calculated
          totalAmount: (isEmi && isEmi == 'true') ? parseFloat(fullAmount).toFixed(2) : totalAmount,
          txnId: genTxnId,
          paymentStatus: 'pending',
          isPaid: false,
          purchaseDate: formatedDate,
          ...obj,
          utm_campaign,
          utm_source,
          utm_medium,
          // validity :  validity , 
          // isEmi : isEmi
          // noOfInstallments: isEmi == true ? noOfInstallments : "1", // ---> "1"
          // pendingInstallment : isEmi == true ? pendingInstallment : "0" ,//---> '0'
          // pendingAmount  : isEmi == true ? pendingAmount : '0' , //---> "0",
          // eachInstallmentAmount : isEmi == true ? eachInstallmentAmount : '0',  //---> '0',
          // nextInstallmentDate :  isEmi == true ? nextInstallmentDate : new Date() //---> "",

        })
        const saveOrder = await courseOrderObj.save()
        // console.log(saveOrder);
        let OrderInfo = {}
        if (saveOrder) {
          OrderInfo = {
            id: saveOrder._id ?? "",
            genTxnId: genTxnId,
            txnId: genTxnId ?? "",
            userOrderId: genOrderId ?? "",
            accessKey: config.key ?? "",
            amount: totalAmount,
            paymentMode: "production",
            // ...obj,
          }
        }
        // console.log(data, config, res, OrderInfo)
        var initiate_payment = require('./payment');
        initiate_payment.initiate_payment(data, config, res, OrderInfo);

      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});

paymentRouter.post("/reInitiate_course_payment", ValidateToken, async (req, res) => {
  const { courseOrderId } = req.body
  if (!courseOrderId) {
    return res.json({
      status: false,
      data: null,
      msg: `Course Order Id Required`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decode?.studentId);
    if (!userDetails) {
      return res.json({
        status: false,
        data: null,
        msg: `Not An User`
      })
    }
    // console.log(userDetails);
    const isOrderExist = await courseOrdesTable.findOne({ _id: courseOrderId, isPaid: false });
    if (!isOrderExist) {
      return res.json({
        status: false,
        data: null,
        msg: `Order not Exist Or Already Paid`
      })
    }
    const genTxnId = generateRandomCourseTransactionId();

    // verify coupon code with product Ids
    const data = {
      name: userDetails.FullName.replace(/ /g, "") ?? "",
      amount: isOrderExist?.totalAmount,
      // txnid: isOrderExist?.txnId,
      txnid: genTxnId,
      email: userDetails.email ?? "admin@sdempire.co.in",
      phone: userDetails.mobileNumber ?? "1234567890",
      productinfo: `${isOrderExist?.courseId}`,
      surl: `${process.env.BACKEND_API_URL}/payment/courseresponse`,
      furl: `${process.env.BACKEND_API_URL}/payment/courseresponse`,
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
    let OrderInfo = {
      id: isOrderExist._id ?? "",
      // genTxnId: isOrderExist?.txnId,
      genTxnId: genTxnId,
      // txnId: isOrderExist?.txnId ?? "",
      txnId: genTxnId,
      userOrderId: isOrderExist?.orderId ?? "",
      accessKey: config.key ?? "",
      amount: isOrderExist?.totalAmount,
      paymentMode: "production"
    }
    // console.log(OrderInfo);
    await courseOrdesTable.findByIdAndUpdate(isOrderExist?._id, { txnId: genTxnId });
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

paymentRouter.post('/courseresponse', async function (req, res) {
  // console.log("Req", req.body)
  // console.log("Res", res)
  function checkReverseHash(response) {
    // var hashstring = config.salt + "|" + response.status + "|" + response.udf10 + "|" + response.udf9 + "|" + response.udf8 + "|" + response.udf7 +
    //   "|" + response.udf6 + "|" + response.udf5 + "|" + response.udf4 + "|" + response.udf3 + "|" + response.udf2 + "|" + response.udf1 + "|" +
    //   response.email + "|" + response.firstname + "|" + response.productinfo + "|" + response.amount + "|" + response.txnid + "|" + response.key

    var hashstring = config.key + "|" + courseresponse.txnid + "|" + courseresponse.amount + "|" + courseresponse.productinfo + "|" + courseresponse.firstname + "|" + courseresponse.email +
      "|" + courseresponse.udf1 + "|" + courseresponse.udf2 + "|" + courseresponse.udf3 + "|" + courseresponse.udf4 + "|" + courseresponse.udf5 + "|" + courseresponse.udf6 + "|" + courseresponse.udf7 + "|" + courseresponse.udf8 + "|" + courseresponse.udf9 + "|" + courseresponse.udf10;
    hashstring += "|" + config.salt;

    hash_key = sha512.sha512(hashstring);
    if (hash_key == req.body.hash)
      return true;
    else
      return false;
  }
  // console.log(req.body)
  // if (checkReverseHash(req.body)) {
  if (req.body) {
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
          txnDate: formatedDate
        })

        const saveTxn = await courseTxnObj.save()

        // emi Transaction 
        // isemi true 
        if (checkOrder?.isEmi == true) {
          // const newEmiTransaction = new emiTxnTable({
          //   user: checkOrder?.user,
          //   courseOrderId: checkOrder?._id,
          //   // installmentNumber : "1",
          //   isPaid : true,
          //   transactionId: saveTxn?._id,
          //   amount: checkOrder?.eachInstallmentAmount,
          //   previousOutstanding: "",
          //   penality: ""
          // })
          // await newEmiTransaction.save();

          // array of emi 

          let emiArray = [];
          let totalInstallments = parseInt(checkOrder?.noOfInstallments);
          // let date = new Date() ;
          let date = moment().add(5, 'hours').add(30, 'minutes').format('DD-MM-YYYY')
          let nextDate = moment(checkOrder?.nextInstallmentDate)
          for (let i = 0; i < totalInstallments; i++) {
            // let nextDate =  moment(checkOrder?.nextInstallmentDate)
            let obj = {
              user: checkOrder?.user,
              courseOrderId: checkOrder?._id,
              installmentNumber: i + 1,
              isPaid: i === 0 ? true : false,
              paidDate: i === 0 ? date : "",
              dueDate: i === 0 ? date : moment(nextDate).format("DD-MM-YYYY"),
              transactionId: i === 0 ? saveTxn?._id : null,
              amount: checkOrder?.eachInstallmentAmount,
              previousOutstanding: "",
              penality: ""
            }

            emiArray.push(obj);
            nextDate = i > 0 ? moment(nextDate).add(1, 'months') : nextDate;

          }
          await emiTxnTable.insertMany(emiArray);
        }
        const newCourseOrder = await courseOrdesTable.findByIdAndUpdate({ _id: checkOrder._id }, {
          paymentStatus: 'success',
          isPaid: true
        }, { new: true, lean: true }).populate('user', '_id mobileNumber email Address FullName').populate('courseId', '_id batch_name');
        let date = new Date();
        date = formatDate(date);
        if (newCourseOrder?.paymentStatus == 'success') {
          // condition
          await BatchesTable.findByIdAndUpdate(
            newCourseOrder?.courseId,
            { $addToSet: { student: { $each: [newCourseOrder?.user] } } },
            { new: true, lean: true }
          );
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
            validity : newCourseOrder?.validity , 

          })
          const saveBatch = await myBatch.save();

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
            items: [{ name: newCourseOrder?.courseId?.batch_name ?? "", price: newCourseOrder?.isEmi == true ? parseFloat(newCourseOrder?.eachInstallmentAmount).toFixed(2) : parseFloat(newCourseOrder?.totalAmount).toFixed(2), quantity: 1 }],
            // items : [ { name : newCourseOrder?.courseId?.batch_name ?? "" , price : 2.85 , quantity: 1 }],
            studentEmail: newCourseOrder?.user?.email != 'user@gmail.com' ? newCourseOrder?.user?.email : 'NA',
            studentPhone: newCourseOrder?.user?.mobileNumber,
            studentState: state,
            gstNumber: "09ABBCS1440F1ZN"
          }
          const FileUploadLocation = await pdfGenerate(dataForInvoice);
          const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
          let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
          let ext = path.extname(pdfFilePath)
          //  console.log(fileName)
          let fileLoc = ''
          const helperString = Math.floor(Date.now() / 1000);
          let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
          setTimeout(async () => {
            fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
            // console.log(fileLoc);
            const newOrder = await courseOrdesTable.findByIdAndUpdate(newCourseOrder?._id, { invoice: [{ installmentNumber: "1", fileUrl: fileLoc }] }, { new: true, lean: true })
            if (newOrder?.invoice?.length >= 1) {
              const newInvoice = new invoiceTable({
                invoiceNumber: invoiceNumber,
              })
              newInvoice.save();
            }
          }, 6000);
          // console.log(saveBatch);

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
          txnDate: formatedDate
        })
        const saveTxn = await courseTxnObj.save()
        // console.log(saveTxn)
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
  // res.send('false, check the hash value ');
});

paymentRouter.post("/emiInitiatePayment", ValidateToken, async (req, res) => {
  const { emiId, courseOrderId, amount, installmentNumber } = req.body
  if (!courseOrderId) {
    return res.json({
      status: false,
      data: null,
      msg: `Course Order Id Required`
    })
  }
  try {
    const decode = jwt.verify(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(decode?.studentId);
    if (!userDetails) {
      return res.json({
        status: false,
        data: null,
        msg: `Not An User`
      })
    }
    // console.log(userDetails);
    const allEmis = await emiTxnTable.find({ courseOrderId: courseOrderId, user: userDetails?._id }).sort({ installmentNumber: 1 }).collation({ locale: "en_US", numericOrdering: true });
    // let isFailure = 0 ;
    // let isExist  = false;
    // check  emi will not paid which installment number not greater than given installment number and emiId
    // for( let i = 0 ; i < allEmis.length ; i++){
    //   let emi =  allEmis[]
    //   if( parseInt())
    // }
    let failure = await allEmis?.find((item, index) => {
      if ((parseInt(item?.installmentNumber) < parseInt(installmentNumber)) && item?.isPaid == false) {
        return true;
      }
      if ((parseInt(item?.installmentNumber) >= parseInt(installmentNumber)) && item?.isPaid == true) {
        return true;
      }
    })
    if (failure == true) {
      return res.json({
        status: false,
        data: null,
        msg: `Something went wrong`
      })
    }
    // isEMI exist 
    const isEmiExist = await emiTxnTable.findOne({ _id: emiId, user: userDetails?._id, courseOrderId: courseOrderId }).populate("courseOrderId", "orderId courseId");
    if (!isEmiExist) {
      return res.json({
        status: false,
        data: null,
        msg: `EMI not Exists`
      })
    }
    // for( let emi of allEmis){
    //   if( (parseInt(emi?.installmentNumber) >= parseInt(installmentNumber)) && emi?.isPaid == true){
    //     isFailure++;
    //   }
    //   if( (parseInt(emi?.installmentNumber) < parseInt(installmentNumber)) && emi?.isPaid == false ){
    //     isFailure++;
    //   }
    //   if( emi?._id?.toString() == emiId?.toString()){
    //     isExist = true
    //   }
    // }
    // if( isFailure > 0 ||  isExist == true){
    //   return res.json({
    //     status : false ,
    //     data : null ,
    //     msg : `Sequence not correct Or emi txn not exists`
    //   })
    // }
    // const emiExists = await emiTxnTable.findOne({ id :  emiId , courseOrderId :  courseOrderId , user :  userDetails?._id , });
    // if( !emiExists){
    //   return res.json({
    //     status : false ,
    //     data : null ,
    //     msg :  `Emi details not exist`
    //   })
    // }
    // const isOrderExist = await courseOrdesTable.findOne({ _id: courseOrderId, isEmi: true });
    // if (!isOrderExist) {
    //   return res.json({
    //     status: false,
    //     data: null,
    //     msg: `Order not Exist Or Already Paid`
    //   })
    // }
    // if(parseFloat(amount) != parseFloat(isOrderExist?.eachInstallmentAmount) 
    //    && ((parseInt(isOrderExist?.noOfInstallments) - parseInt(isOrderExist?.pendingInstallment)) == parseInt(installmentNumber))
    //   ){
    //   return res.json({
    //     status : false ,
    //     data : null ,
    //     msg : `Something went wrong`
    //   })
    // }
    const genTxnId = generateRandomCourseTransactionId();
    // check already exist for this installmentNumber 
    // & also check any transaction exist for this installmentNumber
    // 
    // const emis = await emiTxnTable.find({ user : userDetails?._id , courseOrderId : isOrderExist?._id}) ;
    // const isInstallmentExist = await emis.find((item , index) => {
    //   if( ( parseInt(item?.installmentNumber) >= parseInt(installmentNumber) ) && item?.isPaid != true ){
    //     return true ;
    //   }
    // })
    // if( isInstallmentExist && emis.length >= parseInt(installmentNumber)){
    //   return res.json({
    //     status : false ,
    //     data : null ,
    //     msg : `Something went wrong`
    //   })
    // }



    const data = {
      name: userDetails.FullName.replace(/ /g, "") ?? "",
      // amount: isOrderExist?.totalAmount,
      // amount : isOrderExist?.eachInstallmentAmount ,
      amount: isEmiExist?.amount,
      // txnid: isOrderExist?.txnId,
      // courseOrderId : isOrderExist?._id ,
      // emiId : emiId ,
      txnid: genTxnId,
      email: userDetails.email ?? "admin@sdempire.co.in",
      phone: userDetails.mobileNumber ?? "1234567890",
      productinfo: `${isEmiExist?.courseOrderId?.courseId}`,
      surl: `${process.env.BACKEND_API_URL}/payment/courseEmiResponse?courseOrderId=${isEmiExist?.courseOrderId?._id}&emiId=${isEmiExist?._id}`,
      furl: `${process.env.BACKEND_API_URL}/payment/courseEmiResponse?courseOrderId=${isEmiExist?.courseOrderId?._id}&emiId=${isEmiExist?._id}`,
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
    let OrderInfo = {
      id: isEmiExist?.courseOrderId?._id ?? "",
      // genTxnId: isOrderExist?.txnId,
      genTxnId: genTxnId,
      // txnId: isOrderExist?.txnId ?? "",
      txnId: genTxnId,
      userOrderId: isEmiExist?.courseOrderId?.orderId ?? "",
      accessKey: config.key ?? "",
      amount: amount,
      paymentMode: "production"
    }
    // console.log(OrderInfo);
    // await courseOrdesTable.findByIdAndUpdate(isOrderExist?._id, { txnId: genTxnId });
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

paymentRouter.post('/courseEmiResponse', async function (req, res) {
  // console.log(req.body);
  const { emiId, courseOrderId } = req.query;
  if (req.body) {
    const checkOrder = await courseOrdesTable.findOne({ _id: courseOrderId })
    if (checkOrder) {
      let courseTxnObj;
      if (req.body.status == 'success') {
        courseTxnObj = new courseTxnTable({
          user: checkOrder?.user,
          orderId: checkOrder?._id,
          txnAmount: checkOrder?.eachInstallmentAmount,
          txnId: req.body.txnid,
          easePayId: req.body.easepayid,
          isPaid: true,
          reason: "" ?? req.body.error,
          txnDate: formatedDate
        })

        const saveTxn = await courseTxnObj.save()

        // emi Transaction 
        // isemi true 
        let date = moment().format("DD-MM-YYYY");
        // console.log(date); 
        const newEmi = await emiTxnTable.findOneAndUpdate({ _id: emiId, courseOrderId: courseOrderId }, { isPaid: true, transactionId: saveTxn?._id, paidDate: date }, { new: true, lean: true })
        let newPendingInstallment = parseInt(checkOrder?.pendingInstallment) - 1;
        let newNextInstallmentDate = moment(checkOrder?.nextInstallmentDate).add(30, 'days');
        let newPendingAmount = parseFloat(checkOrder?.pendingAmount) - parseFloat(newEmi?.amount) //parseFloat(req.body.amount);
        // validate newPendingAmount 
        await courseOrdesTable.findByIdAndUpdate(checkOrder?._id, { pendingInstallment: newPendingInstallment, nextInstallmentDate: newNextInstallmentDate, pendingAmount: newPendingAmount })
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
          txnDate: formatedDate
        })
        const saveTxn = await courseTxnObj.save()
        // console.log(saveTxn)

        //  no courseorder update 
        // no emitxntable updatation

        res.redirect('https://www.sdcampus.com/orderFailed');
      }


    }

  } else {
    res.redirect('https://www.sdcampus.com/orderFailed');
  }
  // res.send('false, check the hash value ');
});

paymentRouter.post('/verifyPayemnt', ValidateToken, async (req, res) => {
  const { orderId, hash } = req.body
  if (!orderId) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! OrderId, & Hash value"
    });
  }
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "Invalid Request",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {
        const isOrderExist = await storeOrdesTable.findOne({ _id: orderId }).populate('user')
        if (!isOrderExist) {
          return res.json({
            status: false,
            data: null,
            msg: "Invalid OrderId"
          })
        }

        // if (!checkReverseHash(data, config)) {

        // }
        const encodedParams = new URLSearchParams();
        encodedParams.set('txnid', isOrderExist.txnId);
        encodedParams.set('key', config.key);
        encodedParams.set('amount', isOrderExist.totalAmount);
        encodedParams.set('email', userDetails.email);
        encodedParams.set('phone', userDetails.mobileNumber);
        encodedParams.set('hash', hash);

        const options = {
          method: 'POST',
          url: 'https://dashboard.easebuzz.in/transaction/v1/retrieve',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
          },
          data: encodedParams,
        };

        try {
          const { data } = await axios.request(options);
          // console.log("Response data", data);
          if (data.status) {
            return res.json({
              status: true,
              data: data.msg,
              msg: "Payment Verified",
            })
          } else {
            return res.json({
              status: false,
              data: data.msg,
              msg: "Payment Verification Failed"
            })
          }
        } catch (error) {
          console.error(error);
        }


      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });

});

// Cashfree Payment Gateway
paymentRouter.post("/createOrder", ValidateToken, async (req, res) => {
  const { amount } = req.body;
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "not an admin",
      });
    } else {
      const userDetails = await findUserByUserId(Data.studentId);
      if (userDetails) {
        const options = {
          method: "POST",
          url: "https://sandbox.cashfree.com/pg/orders",
          headers: {
            accept: "application/json",
            "x-client-id": "TEST384427db23892cc86e5385d6aa724483",
            "x-client-secret": "TESTf3973fec7a34d4aef07f52c46cef4ec789ebff45",
            "x-api-version": "2022-09-01",
            "content-type": "application/json",
          },
          body: {
            customer_details: {
              customer_id: userDetails._id,
              customer_email: userDetails.email,
              customer_phone: userDetails?.mobileNumber,
            },
            order_amount: amount,
            order_currency: "INR",
          },
          json: true,
        };
        request(options, function (error, response, body) {
          if (error) throw new Error(error);
          else {
            res.json({
              status: true,
              data: {
                appId: "TEST384427db23892cc86e5385d6aa724483",
                appSecret: "TESTf3973fec7a34d4aef07f52c46cef4ec789ebff45",
                userId: userDetails._id,
                amount: amount,
                orderId: response.body.order_id,
                paymentSessionId: response.body.payment_session_id,
              },
              msg: "orderId generated",
            });
          }
        });
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});

paymentRouter.post("/verifyUserPayment", ValidateToken, async (req, res) => {
  try{

    const {
      orderId,
      description,
      mobileNumber,
      userName,
      userEmail,
      batchId,
      price,
      isCoinApplied,
      success,
      payment_id,
      couponId,
    } = req.body;
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "not an admin",
        });
      } else {
        const user = await findUserByUserId(Data.studentId);
        if (user) {
          let coupon = null;
          if (!["", null, undefined]?.includes(couponId)) {
            coupon = await couponTable.findOne({ _id: couponId });
            if (!coupon?._id) {
              return res.json({
                status: false,
                data: null,
                msg: 'Coupon Not Exist'
              })
            }
          }
          const orderidHelper = await presentorderIdtable.findOne({});
          const orderIdNumber = orderidHelper.presentorderId + 1;
          await presentorderIdtable.findByIdAndUpdate(
            { _id: orderidHelper._id },
            { presentorderId: orderIdNumber }
          );
          let orderIdString = "SDCAMPUS" + orderIdNumber;
          const batchDetails = await BatchesTable.findOne({ _id: batchId, is_active: true });
          if (!batchDetails) {
            return res.json({
              status: false,
              data: null,
              msg: "Batch Not Exists or Active"
            })
          }
          if (success) {
            const students = batchDetails.student;
            students.push(user._id);
            await BatchesTable.findByIdAndUpdate(
              { _id: batchDetails._id },
              { student: students }
            );
          }
          const date = new Date(moment().add(5, "hours").add(30, "minutes"));
          let formatedDate = formatDate(date);
  
          if (isCoinApplied) {
            const isAppliedCoins = await AppliedCoinsTable.findOne({
              user: user._id,
              batchOrTestSeriesId: batchId
            })
            if (isAppliedCoins) {
              return res.json({
                status: false,
                data: null,
                msg: `You have already applied Coins on ${batchDetails.batch_name} Batch.`
              })
            }
            const userCoins = await userWalletAmount(user._id)
            if (!(batchDetails.maxAllowedCoins <= userCoins)) {
              return res.json({
                status: false,
                data: null,
                msg: "You Don't have sufficient Coins"
              })
            }
            // update Coins
            const coinsObj = new AppliedCoinsTable({
              user: user._id,
              type: "batch",
              batchOrTestSeriesId: batchId,
              coins: batchDetails.maxAllowedCoins,
              appliedAt: formatedDate
            })
            const saveCoins = await coinsObj.save()
            const txnData = {
              action: 'withdrawal',
              reason: 'purchase',
              amount: batchDetails.maxAllowedCoins,
              dateTime: formatedDate,
            }
            await saveRefAmount(user._id, txnData)
          }
  
          const NewPaymentDetails = new paymentTransactionTable({
            user: user._id,
            name: userName,
            email: userEmail,
            mobileNumber: mobileNumber,
            description: description,
            payment_id: payment_id ?? "",
            amount: price,
            orderId: orderId,
            success: success,
            batch_name: batchDetails.batch_name,
            transactionDate: formatedDate,
            userOrederId: orderIdString,
            couponId: ['', null, undefined].includes(couponId) ? null : coupon?._id,
          });
          let paymentTransaction = await NewPaymentDetails.save();
          let is_paid;
          if (success == true) {
            is_paid = true;
            const findCart = await CartTable.findOne({
              user: user._id,
              batch: batchDetails._id,
            });
            if (findCart) {
              await CartTable.findByIdAndDelete({ _id: findCart._id });
            }
            const newMyBatch = new MybatchTable({
              user: user._id,
              batch_id: batchDetails._id,
              // amount: batchDetails.charges,
              amount: price,
              is_active: true,
              is_paid: is_paid,
              created_at: formatedDate,
            });
            // let messageForNotification = `Thank you ! You are successfully enrolled in ${batchDetails.batch_name}`;
            // addNotificationForUser(
            //   user.userId,
            //   messageForNotification,
            //   "true",
            //   "purchase success"
            // );
            await newMyBatch.save();
            let invoiceNumber = "NA";
            if (parseInt(price) > 0) {
              let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 }).limit(1);
              invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
            }
  
            let addressArray = user?.Address?.split(',');
            let isState = addressArray[addressArray?.length - 2] ?? "";
            let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
            let year = `${moment().format('YY')}-${parseInt(moment().format('YY')) + 1}`
            const dataForInvoice = {
              invoiceNumber: parseInt(price) > 0 ? `${year}/${invoiceNumber}` : `${year}/${"NA"}`,
              invoiceDate: moment().format("DD-MM-YYYY"),
              studentName: user?.FullName,
              studentAddress: user?.Address ?? "",
              SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
              items: [{ name: batchDetails?.batch_name ?? "", price: parseInt(price), quantity: 1 }],
              studentEmail: user?.email != 'user@gmail.com' ? user?.email : 'NA',
              studentPhone: user?.mobileNumber,
              studentState: state,
              gstNumber: parseInt(price) != 0 ? "09ABBCS1440F1ZN" : "NA"
            }
            const FileUploadLocation = await pdfGenerate(dataForInvoice);
            const pdfFilePath = path.join(__dirname, '../', FileUploadLocation);
            let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
            let ext = path.extname(pdfFilePath)
            //  console.log(fileName)
            let fileLoc = ''
            const helperString = Math.floor(Date.now() / 1000);
            let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
            setTimeout(async () => {
  
              fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
              // console.log(fileLoc);
              const newpayment = await paymentTransactionTable.findByIdAndUpdate(paymentTransaction?._id, { invoice: { installmentNumber: "1", fileUrl: fileLoc } }, { new: true, lean: true })
              if (newpayment?.invoice[0].fileUrl != "" && parseInt(price) > 0) {
                const newInvoice = new invoiceTable({
                  invoiceNumber: invoiceNumber,
                })
                newInvoice.save();
              }
            }, 4000);
            let data;
            if (user.language === "hi") {
              data = {
                title: batchDetails.batch_name,
                message: `${batchDetails.batch_name} से जुड़ने के लिए धन्यवाद।`,
                route: "mybatch",
              };
            } else {
              data = {
                title: batchDetails.batch_name,
                message: `${batchDetails.batch_name} is added into your account`,
                route: "mybatch",
              };
            }
            const myNotifi = new myNotificationModel({
              user: user._id,
              title: data.title,
              message: data.message,
              route: data.route,
              createdAt: moment().add(5, "hours").add(30, "minutes"),
            });
            await myNotifi.save();
            // await sendPushNotification(user.fcmToken, data);
            res.json({
              status: true,
              data: newMyBatch,
              msg: "payment successfully completed",
            });
          } else {
            res.json({
              status: false,
              data: null,
              msg: "payment unsuccessful ",
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
  }catch(error){
    return res.json({
      status : false ,
      data : null ,
      msg  : error.message ,
    })
  }
  
});

paymentRouter.post(
  "/verifyUserPaymentForTestSeries",
  ValidateToken,
  async (req, res) => {
    const {
      orderId,
      description,
      mobileNumber,
      userName,
      userEmail,
      TestSeriesId,
      isCoinApplied,
      price,
      success,
    } = req.body;
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "not an admin",
        });
      } else {
        const user = await findUserByUserId(Data.studentId);
        if (user) {
          // const orderidHelper=await presentorderIdtable.findOne({});
          const orderIdNumber = Math.floor(Math.random() * 1000000);
          let orderIdString = "SDCAMPUSTestSeries" + orderIdNumber;
          const TestSeriesdetails = await TestSeriesTable.findOne({
            _id: TestSeriesId, is_active: true
          });
          if (!TestSeriesdetails) {
            return res.json({
              status: false,
              data: null,
              msg: "TestSeries Not Exists or Active"
            })
          }
          const students = TestSeriesdetails.student
            ? TestSeriesdetails.student
            : [];
          students.push(user._id);
          await TestSeriesTable.findByIdAndUpdate(
            { _id: TestSeriesdetails._id },
            { student: students }
          );
          const date = new Date(moment().add(5, "hours").add(30, "minutes"));
          let formatedDate = formatDate(date);

          if (isCoinApplied) {
            const isAppliedCoins = await AppliedCoinsTable.findOne({
              user: user._id,
              batchOrTestSeriesId: TestSeriesId
            })
            if (isAppliedCoins) {
              return res.json({
                status: false,
                data: null,
                msg: `You have already applied Coins on ${TestSeriesdetails.testseries_name} Test Series.`
              })
            }

            const userCoins = await userWalletAmount(user._id)
            if (!(TestSeriesdetails.maxAllowedCoins <= userCoins)) {
              return res.json({
                status: false,
                data: null,
                msg: "You Don't have sufficient Coins"
              })
            }
            // update Coins
            const date = new Date(moment().add(5, "hours").add(30, "minutes"));
            const coinsObj = new AppliedCoinsTable({
              user: user._id,
              type: "testseries",
              batchOrTestSeriesId: TestSeriesId,
              coins: TestSeriesdetails.maxAllowedCoins,
              appliedAt: formatDate(date)
            })
            const saveCoins = await coinsObj.save()
            const txnData = {
              action: 'withdrawal',
              reason: 'purchase',
              amount: batch.maxAllowedCoins,
              dateTime: formatDate(date),
            }
            await saveRefAmount(user._id, txnData)
          }

          const NewPaymentDetails = await new paymentTransactionTable({
            user: user._id,
            name: userName,
            email: userEmail,
            mobileNumber: mobileNumber,
            description: description,
            payment_id: orderId,
            amount: price,
            orderId: orderId,
            success: success,
            batch_name: TestSeriesdetails.testseries_name,
            transactionDate: formatedDate,
            userOrederId: orderIdString,
          });
          await NewPaymentDetails.save();
          let is_paid;
          if (success == true) {
            is_paid = true;
            const newMyTestSeries = new MyTestSeriesTable({
              user: user._id,
              testseries_id: TestSeriesdetails._id,
              amount: TestSeriesdetails.charges,
              is_active: true,
              is_paid: is_paid,
              created_at: formatedDate,
            });
            await newMyTestSeries.save();
            let data;
            if (user.language === "hi") {
              data = {
                title: TestSeriesdetails.testseries_name,
                message: `${TestSeriesdetails.testseries_name} से जुड़ने के लिए धन्यवाद।`,
                route: "mytestseries",
              };
            } else {
              data = {
                title: TestSeriesdetails.testseries_name,
                message: `you have successfully enrolled in the ${TestSeriesdetails.testseries_name}`,
                route: "mytestseries",
              };
            }
            const myNotifi = new myNotificationModel({
              user: user._id,
              title: data.title,
              message: data.message,
              route: data.route,
              createdAt: moment().add(5, "hours").add(30, "minutes"),
            });
            await myNotifi.save();
            // await sendPushNotification(user.fcmToken, data);
            res.json({
              status: true,
              data: newMyTestSeries,
              msg: "payment successfully completed",
            });
          } else {
            res.json({
              status: false,
              data: null,
              msg: "payment unsuccessful ",
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

// <--------------- PAYMENT UPI Ids ----------->
paymentRouter.get("/getPaymentUpiId", ValidateToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.SECRET_KEY);
    const studentDetails = await findUserByUserId(decoded.studentId);
    if (studentDetails) {
      const UPIId = "7068110388@paytm";
      res.json({
        status: true,
        data: UPIId,
        msg: "Success",
      });
    } else {
      res.json({
        status: false,
        data: null,
        msg: "User not found",
      });
    }
  } catch (err) {
    res.status(401).json({
      status: false,
      data: null,
      msg: err.message,
    });
  }
});

paymentRouter.get("/userTransactionDetails", ValidateToken, (req, res) => {
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "not an admin",
      });
    } else {
      const user = await findUserByUserId(Data.studentId);
      if (user) {
        const transactionDetails = await paymentTransactionTable.find({
          user: user._id,
        }).sort({ createdAt: -1 });
        // website transaction details
        // let data = [...transactionDetails];
        let data = [];
        for (let i = 0; i < transactionDetails.length; i++) {
          const findBatch = await BatchesTable.findOne({ batch_name: transactionDetails[i]?.batch_name }).select('_id');
          let obj = {
            ...transactionDetails[i]?._doc, batchId: findBatch?._id ?? "", invoice: (transactionDetails[i]?.invoice == "" || (transactionDetails[i]?.invoice?.length >= 1 && transactionDetails[i]?.invoice[0] == "")) ? [{
              "installmentNumber": "",
              "fileUrl": ""
            }] : transactionDetails[i]?.invoice ?? [{
              "installmentNumber": "",
              "fileUrl": ""
            }], isEmi: false
          };
          data.push(obj);
        }
        const coursesOrder = await courseTxnTable.find({ user: user?._id }).populate({
          path: 'orderId',
          select: "orderId courseId",
          populate: {
            path: "courseId",
            select: "batch_name"
          }
        }).sort({ createdAt: -1 });
        for (let i = 0; i < coursesOrder.length; i++) {
          let obj = {
            id: coursesOrder[i]?._id ?? "",
            _id: coursesOrder[i]?._id ?? "",
            user: user?._id ?? "", // doubt
            name: user?.FullName ?? "",
            email: user?.email ?? "",
            mobileNumber: user?.mobileNumber ?? "",
            description: coursesOrder[i]?.reason ?? "",
            amount: coursesOrder[i]?.txnAmount ?? "",
            orderId: coursesOrder[i]?.orderId?.orderId ?? "",
            userOrederId: coursesOrder[i]?.txnId ?? "",
            batchName: coursesOrder[i]?.orderId?.courseId?.batch_name ?? "",
            batch_name: coursesOrder[i]?.orderId?.courseId?.batch_name ?? "",
            transactionDate: coursesOrder[i]?.txnDate ?? "",
            paymentId: coursesOrder[i]?.easePayId ?? "",
            payment_id: coursesOrder[i]?.easePayId ?? "",
            success: coursesOrder[i]?.isPaid ?? "",
            isEmi: coursesOrder[i]?.isEmi ?? false,
            invoice: (coursesOrder[i]?.invoice == "" || (coursesOrder[i]?.invoice?.length >= 1 && coursesOrder[i]?.invoice[0] == "")) ? [{
              "installmentNumber": "",
              "fileUrl": ""
            }] : coursesOrder[i]?.invoice ?? [{
              "installmentNumber": "",
              "fileUrl": ""
            }],
            v: coursesOrder[i]?.__v ?? "",
            __v: coursesOrder[i]?.__v ?? "",
          }
          // console.log(obj);
          data.push(obj);

        }

        if (transactionDetails) {
          res.json({
            status: true,
            // data: transactionDetails,
            data: data,
            msg: "fetched all the transaction details of the user ",
          });
        } else {
          res.json({
            status: false,
            data: null,
            msg: "No details Found",
          });
        }
      } else {
        res.json({
          status: false,
          data: null,
          msg: "Not an user",
        });
      }
    }
  });
});

paymentRouter.get(
  "/userTransactionDetailsTestSeries",
  ValidateToken,
  (req, res) => {
    jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
      if (err) {
        res.json({
          err: err,
          status: false,
          data: null,
          msg: "not an admin",
        });
      } else {
        const user = await findUserByUserId(Data.studentId);
        if (user) {
          const transactionDetails = await paymentTransactionTestSeries.find({
            user: user._id,
          });
          if (transactionDetails) {
            res.json({
              status: true,
              data: transactionDetails,
              msg: "fetched all the transaction details of the user ",
            });
          } else {
            res.json({
              status: false,
              data: null,
              msg: "No details Found",
            });
          }
        } else {
          res.json({
            status: false,
            data: null,
            msg: "Not an user",
          });
        }
      }
    });
  }
);

paymentRouter.post("/OrderIdGeneration", ValidateToken, async (req, res) => {
  const { batch_id } = req.body;
  jwt.verify(req.token, process.env.ADMIN_SECRET_KEY, async (err, Data) => {
    if (err) {
      res.json({
        err: err,
        status: false,
        data: null,
        msg: "not an admin",
      });
    } else {
      const findBatchDetails = await BatchesTable.findOne({ _id: batch_id });
      if (findBatchDetails) {
        const OrderId = "SDCAMPUS-" + uuidv1();
        res.json({
          status: true,
          data: {
            orderId: OrderId,
          },
          msg: "Order ID generated successfully",
        });
      } else {
        res.json({
          status: false,
          data: null,
          msg: "batch not found",
        });
      }
    }
  });
});

paymentRouter.post("/store_initiate_payment_for_cod", ValidateToken, async (req, res) => {
  const { products, couponId, totalAmount, addressId, orderType, deliveryCharges , platform } = req.body;
  // console.log(req.body);
  if (!products.length || !totalAmount || !addressId || orderType != 'COD' ||  !['app','store' , 'publication'].includes(platform)) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! ProductInfo, amount & addressId OrderType platform"
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
    // const productIds =  products?.map((item) =>{ return item?.productId});
    // const productsArr = await storeProductTable.find({ _id : productIds}).select('_id salePrice');
    // let productsAmount = 0 ;
    //  productsArr.map((item) => {
    //   let productWithQty = products?.find( obj => obj.productId == item?._id) ;
    //   productsAmount += parseFloat(parseFloat( item?.salePrice)*parseFloat(productWithQty?.quantity))
    //  });
    // console.log(userDetails?._id);
    const carts = await storeCartTable.findOne({ user: userDetails?._id }).populate({
      path: 'products.productId',
      select: "_id regularPrice salePrice"
    })
    // console.log(carts)
    let productsAmount = carts?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);
    let couponValue = "";
    let couponType = "";
    let couponCode = ""
    if (couponId) {
      const checkCouponId = await couponTable.findOne({ _id: couponId, is_active: true })
      if (!checkCouponId) {
        return res.json({
          status: false,
          data: null,
          msg: "Coupon Code Not Exists"
        })
      }
      couponType = checkCouponId?.couponType;
      couponValue = checkCouponId?.couponValue;
      couponCode = checkCouponId?.couponCode;
    }

    if (couponCode != "" && ["SDCART-5", "SDCART-10", "SDCART-15"]?.includes(couponCode)) {
      if (productsAmount < 700 && couponCode == "SDCART-15" && couponType == "percentage") {
        return res.json({
          status: false,
          data: null,
          msg: `Coupon will not applicable on this price`
        })
      }
      if (productsAmount < 400 && ["SDCART-10", "SDCART-15"]?.includes(couponCode) && couponType == "percentage") {
        return res.json({
          status: false,
          data: null,
          msg: `Coupon will not applicable on this price`
        })
      }
      // console.log(couponCode);
      if (productsAmount < 200 && ["SDCART-5", "SDCART-10", "SDCART-15"]?.includes(couponCode) && couponType == "percentage") {
        return res.json({
          status: false,
          data: null,
          msg: `Coupon will not applicable on this price`
        })
      }

    }
    let couponDiscount = 0;
    if (couponType == 'fixed') {
      couponDiscount = parseFloat(couponValue);
      productsAmount = parseFloat(productsAmount) - parseFloat(couponDiscount);
    }
    if (couponType == 'percentage') {
      couponDiscount = ((parseFloat(productsAmount) * couponValue) / 100);
      productsAmount = parseFloat(productsAmount) - ((parseFloat(productsAmount) * couponValue) / 100)

    }
    productsAmount = parseFloat(productsAmount) + parseFloat(deliveryCharges);
    // console.log(productsAmount, totalAmount , deliveryCharges);
    if (parseFloat(productsAmount) != parseFloat(totalAmount)) {
      return res.json({
        status: false,
        data: null,
        msg: 'Amount is not right'
      })
    }
    // console.log(totalAmount, couponDiscount, deliveryCharges)
    // if (((parseFloat(totalAmount) - parseFloat(deliveryCharges) + parseFloat(couponDiscount)) <= 499 && parseInt(deliveryCharges) != 100) || (500 < (parseFloat(totalAmount) - parseFloat(deliveryCharges) + parseFloat(couponDiscount)) && parseInt(deliveryCharges) != 60)) {
    //   return res.json({
    //     status: false,
    //     data: null,
    //     msg: 'Some thing went wrong'
    //   })
    // }

    if (parseInt(deliveryCharges) != 40) {
      return res.json({
        status: false,
        data: null,
        msg: 'Delivery charges is not correct'
      })
    }

    // check amount with coupon discount and deliveryCharge

    const genTxnId = generateRandomTransactionId()
    const checkAddress = await storeUserAddressTable.findOne({ user: userDetails._id, _id: addressId })
    if (!checkAddress) {
      return res.json({
        status: false,
        data: null,
        msg: "Invalid AddressId"
      })
    }
    let shippingAddress =  {
      id: checkAddress._id ?? "",
      name: checkAddress?.name ?? "",
      email: checkAddress?.email ?? "",
      phone: checkAddress?.phone ?? "",
      streetAddress: checkAddress?.streetAddress ?? "",
      city: checkAddress?.city ?? "",
      state: checkAddress?.state ?? "",
      country: checkAddress?.country ?? "",
      pinCode: checkAddress?.pinCode ?? "",
    } 
    let genOrderId = "0001";
    const latestOrder = await storeOrdesTable.findOne({}).sort({ _id: -1 });
    if (latestOrder) {
      const latestOrderId = latestOrder.orderId;
      const numericPart = parseInt(latestOrderId, 10);
      genOrderId = (numericPart + 1).toString().padStart(latestOrderId.length, '0');
    }
    // const genTxnId = generateRandomTransactionId()


    let date = new Date();
    // console.log(req.body);
    const storeOrderObj = new storeOrdesTable({
      user: userDetails._id,
      orderId: genOrderId,
      products,
      couponId,
      totalAmount: totalAmount,
      // txnId: genTxnId,
      deliveryStatus: 'processing',
      paymentStatus: 'pending',
      addressId,
      orderType: 'COD',
      deliveryCharges: deliveryCharges,
      isPaid: false,
      purchaseDate: date ,
      shippingAddress , 
      platform
    })
    const saveOrder = await storeOrderObj.save();
    const productIdsToDelete = saveOrder?.products?.map((item) => item.productId);
    // updateInStock
    // updateInStock(saveOrder?.products);

    await storeCartTable.deleteMany({
      user: saveOrder?.user,
      'products.productId': { $in: productIdsToDelete }
    });
    return res.json({
      status: true,
      data1: { genOrderId, orderId: saveOrder?._id },
      data: null,
      msg: 'Your Order is Processing '
    })
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
});

paymentRouter.post("/initiate_payment_app", ValidateToken, async (req, res) => {
  const { batchId, totalAmount, couponId } = req.body;
  if (!batchId || !totalAmount) {
    return res.json({
      status: false,
      data: null,
      msg: "Required! batchId & Amount"
    });
  }
  try {
    const Data = jwt.decode(req.token, process.env.SECRET_KEY);
    const userDetails = await findUserByUserId(Data.studentId);
    if (userDetails) {
      const genTxnId = generateRandomCourseTransactionId()
      const checkbatch = await BatchesTable.findOne({ _id: batchId, is_active: true })
      if (!checkbatch) {
        return res.json({
          status: false,
          data: null,
          msg: "Batch Inactive Or Not Exists"
        })
      }
      // check already purchased or not 
      const isMyBatch = await MybatchTable.findOne({ batch_id: batchId, user: userDetails?._id });
      if (isMyBatch) {
        return res.json({
          status: false,
          data: null,
          msg: "Already Purchased"
        })
      }
      let couponValue = "";
      let couponType = "";
      let couponCode = "";
      if (couponId && !["", null, undefined]?.includes(couponId)) {
        const checkCouponId = await couponTable.findOne({ _id: couponId, is_active: true })
        if (!checkCouponId) {
          return res.json({
            status: false,
            data: null,
            msg: "Coupon Code Not Exists"
          })
        }
        couponType = checkCouponId?.couponType;
        couponValue = checkCouponId?.couponValue;
        couponCode = checkCouponId?.couponCode;
      }
      let batchAmount = checkbatch?.discount;
      // let batchAmountAfterDiscount = parse ;
      let couponDiscount = 0;
      if (couponType == 'fixed') {
        couponDiscount = parseFloat(couponValue);
        batchAmount = parseFloat(batchAmount) - parseFloat(couponDiscount);
      }
      if (couponType == 'percentage') {
        couponDiscount = ((parseFloat(batchAmount) * couponValue) / 100);
        batchAmount = parseFloat(batchAmount) - (parseFloat(couponDiscount))

      }
      // check amount validation
      batchAmount = parseFloat(batchAmount);

      if (parseFloat(batchAmount).toFixed(2) != parseFloat(totalAmount)?.toFixed(2)) {
        return res.json({
          status: false,
          data: null,
          msg: 'Amount is not right'
        })
      }

      function isValidEmail(email) {
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email);
      }

      // verify coupon code with product Ids
      // console.log(isValidEmail(userDetails.email))
      const hashData = {
        txnid: genTxnId,
        amount: totalAmount,
        productinfo: `${checkbatch?._id}`,
        name: userDetails.FullName.replace(/ /g, "") ?? "",
        email: isValidEmail(userDetails.email) == true ? userDetails?.email : "admin@sdempire.co.in",
        // email: userDetails?.email ?? "admin@sdempire.co.in",

        udf1: "",
        udf2: "",
        udf3: "",
        udf4: "",
        udf5: "",
        udf6: "",
        udf7: "",
        udf8: "",
        udf9: "",
        udf10: ""

      }
      // console.log(hashData)
      const genPayHash = generateHash(hashData, config)
      const paymentParams = {
        request_flow: 'SEAMLESS',
        key: config.key,
        txnid: genTxnId,
        amount: totalAmount,
        productinfo: `${checkbatch?._id}`,
        firstname: userDetails.FullName.replace(/ /g, "") ?? "",
        phone: userDetails.mobileNumber ?? "1234567890",
        email: isValidEmail(userDetails.email) == true ? userDetails?.email : "admin@sdempire.co.in",
        surl: 'https://www.sdcampus.com/web-development',
        furl: 'https://www.sdcampus.com/',
        hash: genPayHash,
        salt: config.salt,
        udf1: "",
        udf2: "",
        udf3: "",
        udf4: "",
        udf5: "",
        udf6: "",
        udf7: "",
        udf8: "",
        udf9: "",
        udf10: ""
      };

      const paymentGen = await initiatePaymentLink(paymentParams);
      if (paymentGen.status != 1) {
        return res.json({
          status: false,
          data: paymentGen,
          msg: paymentGen.data ?? ""
        })
      }
      return res.json({
        status: true,
        data: paymentGen?.data,
        msg: "Payment Initiate"
      })


    } else {
      res.json({
        status: false,
        data: null,
        msg: "Not an user",
      });
    }

  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message
    })
  }
})

module.exports = paymentRouter;