const { adminTeacherTable } = require("../models/adminTeacherModel")

const findAdminTeacherUsingUserId=async (userId)=>{
    const adminTeacherdetails=await adminTeacherTable.findOne({userId:userId});
    return adminTeacherdetails;
}


module.exports={
    findAdminTeacherUsingUserId
}