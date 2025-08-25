const mongoose = require("mongoose");

const ParentIssueSchema = new mongoose.Schema({
    parentId :{
        type : mongoose.Schema.Types.ObjectId,
        ref: 'ParentTable'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UsersTable'
    },
    title:{
        type: String
    },
    description : {
        type: String
    },
    status:{
        type: String,
        default: 'pending',
        enum: ['pending', 'resolved']
    }
}, {timestamps: true});

const ParentIssueTable = new mongoose.model('ParentIssueTable', ParentIssueSchema);

module.exports = ParentIssueTable;
