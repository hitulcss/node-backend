const mongoose = require("mongoose");

const adminTeacherSchema = new mongoose.Schema({
  FullName: {
    type: String,
    default: "",
  },
  Role: {
    type: String,
    enum: ["admin", "teacher", "subadmin", "moderator"],
  },
  accessToContent: [
    {
      type: String,
    },
  ],
  userId: {
    type: String,
  },
  mobileNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  is_active: {
    type: Boolean,
  },
  profilePhoto: {
    type: String,
    default:
      "https://d1mbj426mo5twu.cloudfront.net/assets/Avtar.png",
  },
  otp: {
    type: Number,
    default: null,
  },
  created_at: {
    type: String,
  },
  updated_at: {
    type: String,
    default: "",
  },
  subject: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectTable",
    },
  ],
  qualification: {
    type: String,
    default: "",
  },
  is_Special: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  demoVideo: {
    type: String,
    default: "",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categoryTable',
    default:  null ,
   },
   categories : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'categoryTable',
      default:  null ,
     }
   ],
  access: {
    type: String,
    default: "read",
    enum: ['read', 'readWrite']
  },
  deleteAccess: {
    type: Boolean,
    default: false,
  } ,
  refreshToken: {
    type: String,
    default : ""
  },
}, { timestamps: true });

const adminTeacherTable = new mongoose.model(
  "adminTeacherTable",
  adminTeacherSchema
);
adminTeacherSchema.index({ Role : 1 , isActive : 1} , { name : 'roleAndTeacher'})
module.exports = {
  adminTeacherTable,
};
