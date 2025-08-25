const { BatchesTable } = require("../models/BatchesSchema")

const getLatestBatchId = async() => {
    const lastBatch = await BatchesTable.find({}).sort({ createdAt : -1 }).limit(1);
    let batchId =  `SDB` + (parseInt(lastBatch[0]?.batchId?.substring(3)) + 1);
    return batchId;
}
module.exports = {
    getLatestBatchId
}