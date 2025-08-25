const mongoose = require("mongoose");
const { formatDate } = require("../middleware/dateConverter");

const attemptTestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestSeriesTestTable",
  },
  score: {
    type: String,
    default: "NA",
  },
  answer_arr: {
    type: Object,
  },

  is_active: {
    type: Boolean,
    default: false,
  },
  is_testlive: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: String,
    default: formatDate(new Date()),
  },
  updated_at: {
    type: String,
    default: formatDate(new Date()),
  },
}, { timestamps: true });

const attemptTest = new mongoose.model("attemptTest", attemptTestSchema);

module.exports = {
  attemptTest,
};
