const mongoose = require("mongoose");
const BatchesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    },
    batch_name: {
        type: String,
        default: ""
    },
    slug: {
        type: String,
        default: ""
    },
    exam_type: {
        type: String,
        default: ""
    },
    student: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UsersTable"
    }],
    subject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubjectTable'
    }],
    teacher: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminTeacherTable'
    }],
    starting_date: {
        type: String,
        default: ""
    },
    ending_date: {
        type: String,
        default: ""
    },
    mode: {
        type: String,
        default: ""
    },
    materials: {
        type: String,
        default: ""
    },
    language: {
        type: String,
        default: ""
    },
    charges: {
        type: String,
        default: ""
    },
    discount: {
        type: String,
        default: "0"
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
    banner: [{
        type: Object
    }],
    language: {
        type: String,
        enum: ["hi", "en", 'enhi']
    },
    stream: {
        type: String,
        default: ""
    },
    remark: {
        type: String,
        default: ""
    },
    demoVideo: [{
        type: Object,
        // default:""
    }],
    validity: {
        type: String,
        default: ""
    },
    is_active: {
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
    course_review: {
        type: String,
        default: ""
    },
    batchOrder: {
        type: String,
        default: ""
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
    created_at: {
        type: String,
        default: ""
    },
    isEmi: {
        type: Boolean,
        default: false,
    },
    batchId: {
        type: String,
        default: ""
    },
    emiOptions: {
        type: [String],
        default: '1',
        validate: {
            validator: function (value) {
                return value.every(option => ['1', '2', '3', '6'].includes(option))
            },
            message: props => `${props.value} is not a valid option!`
        }
    },
    faqs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'faqsTable',
        default: null
    }],
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryTable',
        default: null
    }],
    subCategory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subCategoryTable',
        default: null
    }],
    features: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BatchFeature"
    }],
    featureVideo: {
        type: Object,
        default: {
            videoType: "yt", // yt , upload
            url: "https://www.youtube.com/watch?v=iWTDZdv9llw",
        }
    }
}, { timestamps: true })

// BatchesSchema.pre('save', function (next) {
//     if (parseFloat(this.discount) === 0) {
//         this.isPaid = false;
//     } else {
//         this.isPaid = true;
//     }
//     next();
// });
const BatchesTable = new mongoose.model("BatchesTable", BatchesSchema);
BatchesSchema.index({ is_active: 1, charges: 1, discount: 1, isPaid: 1 }, { name: 'paidAndFree' })
BatchesSchema.index({ is_active: 1, stream: 1 }, { name: 'streamActive' })
module.exports = {
    BatchesTable
}