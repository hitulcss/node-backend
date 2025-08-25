const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    FullName: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    created_at: {
      type: String,
    },
    RefreshToken: {
      type: String,
    },
    mobileNumber: {
      type: String,
    },
    emailVerificationOTP: {
      type: String,
      default: "1234",
    },
    mobileNumberVerificationOTP: {
      type: String,
      default: "1234"
    },
    otpcreatedDate: {
      type: String,
    },
    profilePhoto: {
      type: String,
      default:
        "https://d1mbj426mo5twu.cloudfront.net/assets/Avtar.png",
    },
    mobileNumberVerified: {
      type: Boolean,
      default: false,
    },
    userEmailVerified: {
      type: Boolean,
      default: true,
    },
    TimeStamp: {
      type: String,
    },
    language: {
      type: String,
      default: "en",
      enum: ["hi", "en", "enhi"],
    },
    Stream: [
      {
        type: String,
        // default:["IAS"]
        // enum:["IAS","PCS","RAS"]
      },
    ],
    deviceName: {
      type: String,
    },
    deviceConfig: {
      type: String,
    },
    fcmToken: {
      type: String,
      default: "",
    },
    Address: {
      type: String,
      default: "",
    },
    enrollId: {
      type: String || '',
      default: ''
    },
    signinType: {
      type: String,
    },
    myReferralCode: {
      type: String,
      default: ""
    },
    refUserIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersTable'
    }],
    is_active: {
      type: Boolean,
      default: true,
    },
    utm_campaign: {
      type: String,
      default: ""
    },
    utm_source: {
      type: String,
      default: ""
    },
    utm_medium: {
      type: String,
      default: ""
    },
    signUpDate: {
      type: Date,
      default: new Date()
    },
    parentVerificationOtp : {
      type : String ,
      default : "" , 
    },
    masterOtp : {
      type : Number ,
    } , 
    category : [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'categoryTable',
      default: null
    }], 
    subCategory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'subCategoryTable',
      default: null
    }],
    isVerified : {
      type : Boolean ,
      default : false
    },
    platform : {
      type : String ,
      default : 'app' ,
      enum  : ['app','ios' , 'website' , 'store' , 'publication']
    },
    lastActive: {
      type: Date,
      default: null
    },
    viewedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LectureTable',
      default: []
    }],
  }, { timestamps: true });

// Function to increment and pad the enrollId
function incrementAndPad(enrollId) {
  const numericPart = parseInt(enrollId);
  const nextNumericPart = numericPart + 1;
  const nextEnrollId = nextNumericPart.toString().padStart(enrollId.length, "0");
  return nextEnrollId;
}

// Pre-save middleware to calculate and set enrollId
UserSchema.pre("save", async function (next) {
  if (this.isNew) {  // Only execute this on new document creation
    const lastDocument = await UserTable.findOne({}, {}, { sort: { enrollId: -1 } }); // Find the last document
    const nextEnrollId = lastDocument
      ? incrementAndPad(lastDocument.enrollId)  // Increment and pad
      : "";  // Set to "" if no previous document
    this.enrollId = nextEnrollId;
  }
  next();
});

const UserTable = new mongoose.model("UsersTable", UserSchema);

module.exports = {
  UserTable,
};
