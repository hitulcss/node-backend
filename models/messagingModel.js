const mongoose = require("mongoose")


const conversation_schema = new mongoose.Schema({
  from: {
    type: String,
    // ref: 'adminTe'
  },
  to: {
    type: String,
    // ref: 'admin'
  },
  messageBody: {  // body of the message(text body/ image blob/ video blob)
    type: String,
  },
  messageTime: {
    type: String
  },
  createdAt: { // when was this message goit created
    type: String,
    // default: ,
  },
}, { timestamps: true });

const privatemessagingmodel = new mongoose.model("privateMessageModel", conversation_schema);

module.exports = {
  privatemessagingmodel
}
