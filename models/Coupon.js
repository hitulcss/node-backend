const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable",
  },
  couponCode: {
    type: String,
    default: ""
  },
  couponType: {
    type: String,
    enum: ["percentage", "fixed"],
  },
  link: {
    type: String,
    default: "none",
    enum: ['none', 'batch', 'category' ,'testSeries', 'product', 'productCategory']
  },
  linkWith: {
    type: String,
    default: "NA"
  },
  linkWiths : [{
    type: String,
    default: "NA"
  } ], 
  couponValue: {
    type: Number,
    default: 0
  },
  expirationDate: {
    type: Date,
    default: new Date()
  },
  couponAccess: {
    type: String,
    enum: ["all", "single"],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
    default : null , 
  },
  count : {
    type :  Number ,
    default : 0 , 
  } , 
  is_active: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: new Date()
  },
  updated_at: {
    type: Date,
    default: new Date()
  },
}, { timestamps: true });

const couponTable = new mongoose.model("couponTable", couponSchema);

module.exports = {
  couponTable,
};
