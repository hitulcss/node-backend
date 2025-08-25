
const { storeOrdesTable } = require("../models/storeOrders")
const { storeProductTable } = require("../models/storeProduct");
const { userStoreLogsTable } = require("../models/userStoreLogs");

const getMostSaleProducts =  async() =>{
    let query = {
        $or : [
            { isPaid : true } , 
            { orderType : 'COD'}
        ]
    }
    const orders =  await storeOrdesTable.find({...query}).populate('products.productId');
    let products = [];
    orders?.map((item) => {
        // return { }
        let orderProducts =  item?.products?.map((item2) => {
            return item2.productId?._id
            // return item2.productId

        })
        products =  products.concat(orderProducts);
    })


    return products ;
}

const getTopSeach =  async( userId ) => {
    const searchQuery = await userStoreLogsTable.find({ user : userId ,  type : 'store'});
    let searchTextArray = searchQuery?.map((item) => {
        return  item.search;
    })
    let query = {
        isActive: true,
        isTrash: false,
        inStock: { $gte: "1" },
      };
      let resArray =  []  ; 
      searchTextArray.map((item) => {
        resArray.push({ title: { $regex: item, $options: "i" } });
        resArray.push({ desc: { $regex: item, $options: "i" } });
        resArray.push({ tags: { $regex: item, $options: "i" } });
        resArray.push({ badge: { $regex: item, $options: "i" } })
      })
    //   query.$or = [
    //     { title: { $regex: search, $options: "i" } },
    //     { desc: { $regex: search, $options: "i" } },
    //     { tags: { $regex: search, $options: "i" } },
    //     { badge: { $regex: search, $options: "i" } },
    //   ]
    query.$or = resArray ;
    // console.log(resArray);
    const products =  await storeProductTable.find(query).select('_id');
    return products?.map((item) => { return item?._id})
    
}

module.exports = {
    getTopSeach ,
    getMostSaleProducts , 
}