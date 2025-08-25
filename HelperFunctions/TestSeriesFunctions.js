const { TestSeriesTable } = require("../models/TestSeries");
const { TestSeriesTestTable } = require("../models/testseriestest");



const TestSeriesDetails=async (TestSeriesId)=>{
    const TestSeriesData=await TestSeriesTable.findOne({_id:TestSeriesId});
    return TestSeriesData;
}


const TestDetailsByTestId=async (TestId)=>{
    const TestData=await TestSeriesTestTable.findOne({TestId});
    return TestData;
}

module.exports={
    TestDetailsByTestId,
    TestSeriesDetails
}