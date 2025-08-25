const mongoose = require("mongoose");

const BlockUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
}, { timestamps: true });

const UsersBlockedTable = new mongoose.model("BlockUserLogin", BlockUserSchema);

module.exports = {
  UsersBlockedTable,
};
