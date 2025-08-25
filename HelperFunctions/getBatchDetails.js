const { BatchesTable } = require("../models/BatchesSchema");
const { courseOrdesTable } = require("../models/courseOrder");

const getBatchDetailsByBatchName =  async (batchName) => {
    let batchDetails = await BatchesTable.findOne({batch_name : batchName})
    return batchDetails;
}

const getBatchDetailsByOrderId =  async ( orderId) => {
    let courseOrder  = await courseOrdesTable.findOne({ _id :  orderId}).populate("courseId").select({courseId : 1});
    return courseOrder.courseId ;
}

module.exports  = {
    getBatchDetailsByBatchName,
    getBatchDetailsByOrderId
}