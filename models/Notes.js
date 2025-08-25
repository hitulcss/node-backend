const mongoose = require("mongoose")

const NotesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adminTeacherTable'
  },
  title: {
    type: String
  },
  file_url: {
    type: Object
  },
  notes_type: {
    type: String
  },
  is_active: {
    type: Boolean
  },
  language: {
    type: String,
    enum: ['hi', 'en', 'enhi']
  },
  created_At: {
    type: String
  },
  resource_type: {
    type: String,
    default: 'file'
  } , 
  category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categoryTable",
      default : null ,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCategoryTable",
      default : null 
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubjectTable",
    },
}, { timestamps: true })

const NotesTable = new mongoose.model("NotesTable", NotesSchema);

module.exports = {
  NotesTable
}