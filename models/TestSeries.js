const mongoose = require("mongoose");

const TestSeriesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable",
  },
  testseries_name: {
    type: String,
  },
  exam_type: {
    type: String,
  },

  student: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersTable",
    },
  ],
  teacher: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "adminTeacherTable",
    },
  ],
  
  starting_date: {
    type: String,
  },
  charges: {
    type: String,
    default: ""
  },
  discount: {
    type: String,
    default: "0",
  },
  description: {
    type: String,
  },
  banner: [
    {
      type: Object,
    },
  ],
  language: {
    type: String,
    enum: ["hi", "en", "enhi"],
  },
  stream: {
    type: String,
  },
  remark: {
    type: String,
    default: "",
  },
  no_of_test: {
    type: Number,
    default: 0
  },
  validity: {
    type: String,
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  is_active: {
    type: Boolean,
  },
  isCoinApplicable: {
    type: Boolean,
    default: false
  },
  maxAllowedCoins: {
    type: String,
    default: "0"
  },
  created_at: {
    type: String,
  }
});

TestSeriesSchema.pre('save', function (next) {
  if (parseFloat(this.charges) === 0 && parseFloat(this.discount) === 0) {
    this.isPaid = false;
  } else {
    this.isPaid = true;
  }
  next();
});

const TestSeriesTable = new mongoose.model("TestSeriesTable", TestSeriesSchema)

module.exports = {
  TestSeriesTable
}