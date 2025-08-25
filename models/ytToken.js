const mongoose = require("mongoose");

const ytTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminTeacherTable",
  },
  token: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const ytTokenTable = new mongoose.model("ytTokenTable", ytTokenSchema);

module.exports = {
  ytTokenTable,
};
