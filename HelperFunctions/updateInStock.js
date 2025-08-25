const { storeProductTable } = require("../models/storeProduct")

const updateInStock = async (products) => {
    for( let i = 0 ; i < products?.length ; i++){
        let pro =  await storeProductTable.findOne({ _id : products[i]?.productId}) ;
        let newStock =  parseInt(pro?.inStock) -  parseInt(products[i]?.quantity);
        newStock =  newStock < 0 ? 0 : newStock ; 
        await storeProductTable.findByIdAndUpdate( pro?._id, { inStock : newStock});
    }
}

module.exports = {
    updateInStock
}