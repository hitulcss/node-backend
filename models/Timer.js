const mongoose = require("mongoose");

const TimerSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UsersTable",
  },
  timerDuration: {
    type: String,
  },
  TimerTitle: {
    type: String,
  },
  created_at: {
    type: String,
  },
  updated_at: {
    type: String,
  },
});

const Timer = new mongoose.model("Timer", TimerSchema);

module.exports = {
  Timer,
};
