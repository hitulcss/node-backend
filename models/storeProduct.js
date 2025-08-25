const mongoose = require("mongoose");

const storeProductSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "adminTeacherTable"
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "productCategoryTable"
        },
        categories:[ {
            type: mongoose.Schema.Types.ObjectId,
            ref: "productCategoryTable"
        }],
        title: {
            type: String,
            default: "",
        },
        slug: {
            type: String,
            default: ""
        },
        code: {
            type: String,
            default: ""
        },
        desc: {
            type: String,
            default: ""
        },
        publication: {
            type: String,
            default: ""
        },
        metaTitle: {
            type: String,
            default: ""
        },
        metaDesc: {
            type: String,
            default: ""
        },
        regularPrice: {
            type: String,
            default: ""
        },
        salePrice: {
            type: String,
            default: ""
        },
        schedule: {
            startDate: {
                type: Date,
                default: Date.now,
            },
            endDate: {
                type: Date,
                default: Date.now,
            }
        },
        tags: [{
            type: String,
            default: "sd"
        }],
        inStock: {
            type: String,
            default: "0"
        },
        deliveryType: {
            type: String,
            default: "both",
            enum: ['both', 'cod', 'online']
        },
        featuredImage: {
            type: String,
            default: "",
        },
        images: [{
            type: String,
            default: ""
        }],
        preview : {
            type : String ,
            default : ""
        },
        videoType : {
            type : String ,
            default : 'yt' ,
            enum: ['yt' , 'upload']
        },
        videos: [{
            type: String,
            default: ""
        }],
        language: {
            type: String,
            enum: ["hi", "en", "enhi"]
        },
        productType: {
            type: String,
            default: 'simple',
            enum: ['simple', 'grouped', 'variable']
        },
        groupedProduct: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ProductsTable'
            }
        ],
        marketingCat: {
            type: String,
            enum: ['POPULAR', 'BOOK', 'SA', 'HDC', 'HDP'],
            default: "POPULAR"
        },
        // isCouponCode: {
        //     type: Boolean,
        //     default: false
        // },
        // couponCode: [{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "couponTable",
        //     default: null
        // }],
        maxPurchaseQty: {
            type: String,
            default: "0"
        },
        badge: {
            type: String,
            // default: "",
            default : "NEW ARRIVAL" , 
            enum : ["NEW ARRIVAL" , "TOP TRENDING" , "PRICE DROP" , "FREEDOM SALE"]
        },
        isCoinApplicable: {
            type: Boolean,
            default: false
        },
        maxAllowedCoins: {
            type: String,
            default: "0"
        },
        attributes: [
            {
                type: Object
            }
        ],
        variations: [
            {
                type: Object
            }
        ],
        isActive: {
            type: Boolean,
            default: true
        },
        keyFeature: {
            type: String,
            default: ""
        },
        isTrash : {
            type : Boolean ,
            default : false,
        } ,
        shareLink : {
            type : Object ,
            default : {
                link : "" ,
                text : ""
            }
        },
        saleExpire : {
            type : Date , 
            default :  Date.now ,
        }
    },
    {
        timestamps: true,
    })

const storeProductTable = new mongoose.model("ProductsTable", storeProductSchema);
storeProductSchema.index({ isActive : 1 , isTrash : 1 , inStock : 1} , { name : 'activeAndTrashAndStock'})
module.exports = {
    storeProductTable
}