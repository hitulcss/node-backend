const mongoose = require("mongoose");
const NewTestSeriesSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adminTeacherTable'
  },
  testSeriesName: {
    type: String,
    default: ""
  },
  slug: {
    type: String,
    default: ""
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCategoryTable',
    default: null
  }],
  subCategory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSubCategoryTable',
    default: null
  }],
  subject: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSubjectTable'
  }],
  startdate: {
    type: Date,
  },
  endDate: {
    type: Date
  },
 
  regularPrice: {
    type: Number,
    default: 0
  },
  salePrice: {
    type: Number,
    default: 0 
  },
  shareLink: {
    type: Object,
    default: {
      link: "",
      text: ""
    }
  },
  description: {
    type: String,
    default: ""
  },
   banner : {
    type : String ,
    default : "" , 
   },
  language: {
    type: String,
    enum: ["hi", "en", 'enhi']
  },
  keyFeatures: [{
    type: String,
    default:""
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  isCoinApplicable: {
    type: Boolean,
    default: false
  },
  maxAllowedCoins: {
    type: String,
    default: "0"
  },
  planner: {
    type: Object,
    default: {
      fileLoc: "",
      fileName: "",
      fileSize: "",
    },
  },
  metaTitle: {
    type: String,
    default: ""
  },
  metaDesc: {
    type: String,
    default: ""
  },
  faqs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'faqsTable',
    default: null
  }],
}, { timestamps: true })

const NewTestSeriesTable = new mongoose.model("NewTestSeriesTable", NewTestSeriesSchema);
module.exports = {
  NewTestSeriesTable
}