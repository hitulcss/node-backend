const { productCategoryTable } =  require("../models/productCategory")

const getStoreCategoryByText = async(text) => {
    // let query = {
    //     $or : [
    //         {  title : {$regex :  text , $options: "i"}} ,
    //     ]
    // }
    const categories =  await productCategoryTable.find({ title : {$regex :  text , $options: "i"}})
    // console.log(categories);
    return categories?.map((item) => { return item?._id })
}

module.exports = {
    getStoreCategoryByText
}