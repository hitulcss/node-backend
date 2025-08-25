const express = require('express');
const { adminTeacherTable } = require('../models/adminTeacherModel');
const Oms = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const { omsVerify } = require('../middleware/authenticateToken');
const { storeProductTable } = require('../models/storeProduct');
const { findUserByEmail } = require('../HelperFunctions/userFunctions');
const { findAdminTeacherUsingUserId } = require('../HelperFunctions/adminTeacherFunctions');
const { storeOrdesTable } = require('../models/storeOrders');
require("dotenv").config();

const statusMap = new Map();
// statusMap.set('pending', 'pending');
// statusMap.set('new', 'processing');
// statusMap.set('packed', 'placed');
// statusMap.set('ready_to_ship', 'shipped');
// statusMap.set('in_transit', 'inTransit');
// statusMap.set('delivered', 'delivered');
// statusMap.set('customer_return', 'customerReturn');
// statusMap.set('cancelled', 'cancelled');
// statusMap.set('courier_return', 'courierReturn');

statusMap.set('pending', 'pending');
statusMap.set('new', 'processing');
statusMap.set('packed', 'packed');
statusMap.set('ready_to_ship', 'shipped');
statusMap.set('in_transit', 'inTransit');
statusMap.set('delivered', 'delivered');
statusMap.set('customer_return', 'customerReturn');
statusMap.set('cancelled', 'cancelled');
statusMap.set('courier_return', 'courierReturn');

function getByValue(searchValue) {
    if (searchValue == 'userCancelled') {
        return 'cancelled'
    }
    for (let [key, value] of statusMap.entries()) {
        if (value === searchValue)
            return key;
    }
}

Oms.post("/auth", async (req, res) => {
    const { username, password } = req.body;
    // console.log('auth');
    // console.log('auth');
    try {
        const admin = await adminTeacherTable.findOne({ email: username });
        const isSame = await bcrypt.compare(password, admin.password);
        // console.log(isSame)
        if (isSame) {
            const RefreshTokenAuth = jwt.sign(
                { studentId: admin.userId },
                process.env.ADMIN_SECRET_KEY,
                { expiresIn: "365d" }
            );

            return res.status(200).json({
                token: RefreshTokenAuth,
                token_expires_on: 0
            })
        }
        return res.json({
            msg: 'bad response'
        })
    } catch (error) {
        return res.json({
            status: false,
            data: null,
            msg: error.message
        })
    }
})

Oms.get('/catalogue', omsVerify, async (req, res) => {
    let { page_number, page_size, status } = req.query;
    // console.log('catalogue');

    try {
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(200).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        page_number = parseInt(page_number) || 1;
        page_size = parseInt(page_size) || 0;
        // status =  status ? true : false ;
        // console.log(typeof(status));
        let query = {};
        if (!status || ["", undefined, null]?.includes(status)) {
            query = {}
        } else {
            query = {
                isActive: status == 'active' ? true : false
            }
        }
        // console.log(query);
        const products = await storeProductTable.find({ ...query }).populate('category', '_id title slug').skip((page_number - 1) * page_size).limit(page_size);
        let response = products.map((item) => {
            // let selling_price =  item?.salePrice ;
            // selling_price = + selling_price 
            return {


                "product_id": item?._id,
                "category": item?.category?.title,
                "variants": [
                    {
                        "variant_id": item?._id,
                        // "variant_id" :  "" , 
                        "sku_code": item?.code,
                        "title": item?.title,
                        "in_stock": parseInt(item?.inStock),
                        "selling_price": parseFloat(parseFloat(item?.salePrice).toFixed(2)),
                        "retail_price": parseFloat(parseFloat(item?.regularPrice).toFixed(2)),
                        "image_url": item?.featuredImage,
                        "site_url": `https://store.sdcampus.com/p/${item?.category?.slug ?? 'category'}/${item?.slug}`,
                        "size": ""
                    }
                ]

            }

        })
        // console.log('catalogue Response', response)
        return res.status(200).json({
            has_more: true,
            items: response
        })

    } catch (error) {
        // console.log(error.message)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/inventory', omsVerify, async (req, res) => {
    // let {} = req.body ;
    // console.log('inventory', req.body);
    try {
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        let response = await Promise.all(req?.body?.map(async (item) => {
            const product = await storeProductTable.findOneAndUpdate({ _id: item?.product_id, code: item?.sku_code }, { inStock: item?.in_stock }, { new: true, lean: true });

            return {
                "success": true,
                "message": null,
                "product_id": product?._id,
                // "variant_id": "",
                "variant_id": product?._id,
                "sku_code": product?.code,
                "in_stock": product?.inStock,
            }

        }))
        // console.log('inventory response ', response);
        return res.status(200).json({
            has_error: false,
            items: response
        })

    } catch (error) {
        // console.log('inventory', error.message)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.get('/orders', omsVerify, async (req, res) => {
    let { page_number, page_size, order_date_from, order_date_to, order_ids, sub_order_ids, status } = req.query;
    // console.log(req.query); 
    if (!page_number || !page_size || !order_date_from || !order_date_to) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
    // console.log('orders', req.query);
    try {
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        page_number = parseInt(page_number) || 1;
        page_size = parseInt(page_size) || 0;
        // status =  status ? true : false ;

        // status not matched
        let query = { createdAt: { $gte: new Date(order_date_from * 1000), $lte: new Date(order_date_to * 1000) } };
        if (status && ["new", "packed", "ready_to_ship", "in_transit", "delivered", "cancelled", "customer_return", "pending", "courier_return"]?.includes(status)) {
            query.deliveryStatus = statusMap.get(status);
        }
        if (order_ids) {
            // query._id = order_ids ; 
            query.orderId = order_ids;
        }
        query.$or = [
            { isPaid: true },
            { orderType: 'COD' }
        ]
        // console.log('orders', query);
        const orders = await storeOrdesTable.find({ ...query }).populate('couponId').populate('products.productId').populate('addressId').skip((page_number - 1) * page_size).limit(page_size).sort({ createdAt: -1 });
        let response = orders.map((item) => {
            let totalItem = item?.products?.length;
            let totalAmount = item?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);
            let deliveryChargesPerItem = parseFloat(parseFloat(parseFloat(item?.deliveryCharges) / totalItem).toFixed(2));
            let couponType = item?.couponId?.couponType == 'fixed' ? 'fixed' : item?.couponId?.couponType == 'percentage' ? 'percentage' : null;
            let promoDiscountsPerItem = 0.00;
            if (couponType == 'percentage') {
                let totalDiscount = parseFloat(totalAmount * ((parseFloat(item?.couponId?.couponValue) / 100)));
                promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
            }
            if (couponType == 'fixed') {
                let totalDiscount = (parseFloat(item?.couponId?.couponValue));
                promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
            }
            return {
                "order_date": Math.floor((item?.createdAt).getTime() / 1000),
                "sla_date": 0,
                "warehouse": "",
                "shipping_address": {
                    "name": item?.shippingAddress?.name,
                    "address1": item?.shippingAddress?.streetAddress,
                    "address2": "",
                    "city": item?.shippingAddress?.city,
                    "state": item?.shippingAddress?.state,
                    "pincode": item?.shippingAddress?.pinCode,
                    "country": "IN",
                    "phone": item?.shippingAddress?.phone,
                    "email": item?.shippingAddress?.email,
                    "gst": "09ABBCS1440F1ZN"
                },
                "billing_address": {
                    "name": item?.shippingAddress?.name,
                    "address1": item?.shippingAddress?.streetAddress,
                    "address2": "",
                    "city": item?.shippingAddress?.city,
                    "state": item?.shippingAddress?.state,
                    "pincode": item?.shippingAddress?.pinCode,
                    "country": "IN",
                    "phone": item?.shippingAddress?.phone,
                    "email": item?.shippingAddress?.email,
                    "gst": "09ABBCS1440F1ZN"
                },
                "shipping_company": item?.shippingCompany ?? "",
                "shipment_tracker": item?.awbNumber ?? "",
                "order_type": item?.orderType == "prePaid" ? "PrePaid" : 'COD',
                "order_items": item?.products?.map((item2, index) => {
                    return {
                        // "order_id": item?._id,
                        "order_id": item?.orderId,
                        "sub_order_id": `${item?.orderId}-${index + 1}`,
                        "replacement_for_sub_order_id": "",
                        "sku_code": item2?.productId?.code,
                        "qty": parseInt(item2?.quantity),
                        "selling_price_per_item": parseFloat(parseFloat(item2?.productId?.salePrice).toFixed(2)),
                        "shipping_charge_per_item": parseFloat(parseFloat(deliveryChargesPerItem) / parseFloat(item2?.quantity)) ?? 0.00,
                        "promo_discounts": promoDiscountsPerItem ?? 0.00,
                        "gift_wrap_charges": 0.00,
                        "gift_message": "",
                        "transaction_charges": 0.00,
                        "invoice_amount": parseFloat(parseFloat(parseFloat(item2?.productId?.salePrice) * parseFloat(item2?.quantity)) - parseFloat(promoDiscountsPerItem) + parseFloat(deliveryChargesPerItem)),
                        "cod_collectible_amount": 0.00,
                        "invoice_number": "",
                        "invoice_date": (item?.invoiceDate !== null && item?.invoiceDate !== undefined) ? Math.floor((item?.invoiceDate)?.getTime() / 1000) : 0,
                        "currency_code": "INR",
                        "tax_rate": 0,
                        "tax_amount": 0.00,
                        "igst_rate": 0,
                        "igst_amount": 0.00,
                        "cgst_rate": 0,
                        "cgst_amount": 0,
                        "sgst_rate": 0,
                        "sgst_amount": 0.00,
                        "status": getByValue(item?.deliveryStatus),
                        "last_status_update_date": Math.floor((item?.updatedAt).getTime() / 1000),
                        "return_shipping_company": "",
                        "return_shipment_tracker": "",
                        "return_qty": 0,
                        "return_reason": ""
                    }
                }),
                "is_channel_fulfilled": false,
                "order_notes": "Handle order with special care"
            }
        })
        // console.log('orders response', response);
        return res.status(200).json({
            has_more: true,
            orders: response
        })

    } catch (error) {
        // console.log('orders Error', error?.message);
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.get('/order', omsVerify, async (req, res) => {
    let { order_id } = req.query;
    // console.log('order Api ');
    if (!order_id) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
    try {
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        const order = await storeOrdesTable.findOne({ orderId: order_id }).populate('couponId').populate('products.productId').populate('addressId');
        let totalItem = order?.products?.length
        let totalAmount = order?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);;
        // console.log(totalAmount);
        let deliveryChargesPerItem = parseFloat(parseFloat(parseFloat(order?.deliveryCharges) / totalItem).toFixed(2));
        let couponType = order?.couponId?.couponType == 'fixed' ? 'fixed' : order?.couponId?.couponType == 'percentage' ? 'percentage' : null;
        let promoDiscountsPerItem = 0.00;
        if (couponType == 'percentage') {
            let totalDiscount = parseFloat(totalAmount * ((parseFloat(order?.couponId?.couponValue) / 100)));
            // console.log(totalDiscount);
            promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
        }
        if (couponType == 'fixed') {
            let totalDiscount = (parseFloat(order?.couponId?.couponValue));
            promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
        }
        // console.log( order[0]?.couponId)
        return res.status(200).json({

            "order_date": Math.floor((order?.createdAt).getTime() / 1000),
            "sla_date": 0,
            "warehouse": "",
            "shipping_address": {
                "name": order?.shippingAddress?.name,
                "address1": order?.shippingAddress?.streetAddress,
                "address2": "",
                "city": order?.shippingAddress?.city,
                "state": order?.shippingAddress?.state,
                "pincode": order?.shippingAddress?.pinCode,
                "country": "IN",
                "phone": order?.shippingAddress?.phone,
                "email": order?.shippingAddress?.email,
                "gst": "09ABBCS1440F1ZN"
            },
            "billing_address": {
                "name": order?.shippingAddress?.name,
                "address1": order?.shippingAddress?.streetAddress,
                "address2": "",
                "city": order?.shippingAddress?.city,
                "state": order?.shippingAddress?.state,
                "pincode": order?.shippingAddress?.pinCode,
                "country": "IN",
                "phone": order?.shippingAddress?.phone,
                "email": order?.shippingAddress?.email,
                "gst": "09ABBCS1440F1ZN"
            },
            "shipping_company": order?.shippingCompany,
            "shipment_tracker": order?.awbNumber,
            "order_type": order?.orderType == "prePaid" ? "PrePaid" : 'COD',
            "order_items": order?.products?.map((item2, index) => {
                // console.log(item2)
                return {
                    // "order_id": order?._id,
                    "order_id": order?.orderId,
                    "sub_order_id": `${order?.orderId}-${index + 1}`,
                    "replacement_for_sub_order_id": "",
                    "sku_code": item2?.productId?.code,
                    "qty": parseInt(item2?.quantity),
                    "selling_price_per_item": parseFloat(parseFloat(item2?.productId?.salePrice).toFixed(2)),
                    "shipping_charge_per_item": parseFloat(parseFloat(deliveryChargesPerItem) / parseFloat(item2?.quantity)) ?? 0.00,
                    "promo_discounts": promoDiscountsPerItem ?? 0.00,
                    "gift_wrap_charges": 0.00,
                    "gift_message": "",
                    "transaction_charges": 0.00,
                    "invoice_amount": parseFloat(parseFloat(parseFloat(item2?.productId?.salePrice) * parseFloat(item2?.quantity)) - parseFloat(promoDiscountsPerItem) + parseFloat(deliveryChargesPerItem)),
                    "cod_collectible_amount": 0.00,
                    "invoice_number": "",
                    "invoice_date": (order?.invoiceDate !== null && order?.invoiceDate !== undefined) ? Math.floor((order?.invoiceDate)?.getTime() / 1000) : 0,
                    "currency_code": "INR",
                    "tax_rate": 0,
                    "tax_amount": 0.00,
                    "igst_rate": 0,
                    "igst_amount": 0.00,
                    "cgst_rate": 0,
                    "cgst_amount": 0,
                    "sgst_rate": 0,
                    "sgst_amount": 0.00,
                    "status": getByValue(order?.deliveryStatus),
                    "last_status_update_date": Math.floor((order?.updatedAt).getTime() / 1000),
                    "return_shipping_company": "",
                    "return_shipment_tracker": "",
                    "return_qty": 0,
                    "return_reason": ""
                }
            }),
            "is_channel_fulfilled": false,
            "order_notes": "Handle order with special care"
        }
        )

    } catch (error) {
        // console.log('order', error?.message)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/self_ship_dispatch_orders', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = findAdminTeacherUsingUserId(req.userId);
        // console.log('self _ Dispatch Order', req.body);
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        let response = await Promise.all(req?.body?.map(async (item) => {
            let query = {
                shippingCompany: item?.shipping_company,
                awbNumber: item?.shipment_tracker,
                trackingLink: item?.tracking_url
            }
            if (item?.dispatch_date) {
                let date = new Date(item?.dispatch_date * 1000);
                query.dispatchDate = date;
            }
            // let date = new Date(item?.dispatch_date * 1000);
            const order = await storeOrdesTable.findOneAndUpdate({ orderId: item?.order_id },
                // {
                //     shippingCompany: item?.shipping_company, awbNumber: item?.shipment_tracker, trackingLink: item?.tracking_url
                //     , dispatchDate: date
                // },
                { ...query, deliveryStatus: "shipped" },
                { new: true, lean: true });
            if (order?._id) {
                return {
                    "success": true,
                    "message": null,
                    // "order_id": order?._id ,
                    "order_id": order?.orderId,
                    "sub_order_id": item?.sub_order_id ?? ""
                }
            }
        }))
        // if( response?.includes(undefined) ){
        //     return res.status(400).json({
        //         "message": "Invalid Params",
        //         "code": "0010",
        //         "data": "json object with issue details"
        //     })
        // }
        // console.log('self Dispatch Response', response)
        return res.status(200).json({
            has_error: false,
            orders: response
        })
    } catch (error) {
        // console.log('Self Disaptc Order', error.message)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/update_self_ship_orders', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        // console.log('update Self APi ', req.body);
        let response = await Promise.all(req?.body?.map(async (item) => {
            let status = statusMap.get(item?.status);
            // console.log(status);
            let query = {
                deliveryStatus: status
            }
            if (item?.return_received_date) {
                let returnDate = new Date(item?.return_received_date * 1000);
                query.returnDate = returnDate;

            }
            if (item?.delivered_date) {
                let deliveredDate = new Date(item?.delivered_date * 1000);
                query.deliveredDate = deliveredDate;

            }
            // let returnDate = new Date(item?.return_received_date * 1000);
            // let deliveredDate = new Date(item?.delivered_date * 1000);
            // console.log(query);
            const order = await storeOrdesTable.findOneAndUpdate({ orderId: item?.order_id },
                // { deliveryStatus: status, returnDate: returnDate, deliveredDate: deliveredDate },
                { ...query },
                { new: true, lean: true });
            return {
                "success": true,
                "message": null,
                // "order_id": order?._id ,
                "order_id": order?.orderId,
                "sub_order_id": item?.sub_order_id ?? ""
            }
        }))

        // console.log('update_self resppnse ', response);
        return res.status(200).json({
            has_error: false,
            orders: response
        })
    } catch (error) {
        // console.log('update_self', error.message)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.get('/return_orders', omsVerify, async (req, res) => {
    let { page_number, page_size, return_date_from, return_date_to, status } = req.query;
    if (!page_number || !page_size || !return_date_from || !return_date_to) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
    try {
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        page_number = parseInt(page_number) || 1;
        page_size = parseInt(page_size) || 0;
        let query = { returnDate: { $gte: new Date(return_date_from * 1000), $lte: new Date(return_date_to * 1000) } };
        if (status && status != 'both') {
            query.deliveryStatus = statusMap.get(status);
        } else {
            query.deliveryStatus = { $in: ['customerReturn', 'courierReturn'] }
        }
        // console.log(query);
        query.$or = [
            { isPaid: true },
            { orderType: 'COD' }
        ]
        const orders = await storeOrdesTable.find({ ...query }).populate('couponId').populate('products.productId').populate('addressId').skip((page_number - 1) * page_size).limit(page_size).sort({ createdAt: -1 });
        let response = orders.map((item) => {
            let totalItem = item?.products?.length
            let totalAmount = item?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);
            let deliveryChargesPerItem = parseFloat(parseFloat(parseFloat(item?.deliveryCharges) / totalItem).toFixed(2));
            let couponType = item?.couponId?.couponType == 'fixed' ? 'fixed' : item?.couponId?.couponType == 'percentage' ? 'percentage' : null;
            let promoDiscountsPerItem = 0.00;
            if (couponType == 'percentage') {
                let totalDiscount = parseFloat(totalAmount * (parseFloat(item?.couponId?.couponValue) / 100));
                promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
            }
            if (couponType == 'fixed') {
                let totalDiscount = (parseFloat(item?.couponId?.couponValue));
                promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
            }
            return {
                "order_date": Math.floor((item?.createdAt).getTime() / 1000),
                "sla_date": 0,
                "warehouse": "",
                "shipping_address": {
                    "name": item?.shippingAddress?.name,
                    "address1": item?.shippingAddress?.streetAddress,
                    "address2": "",
                    "city": item?.shippingAddress?.city,
                    "state": item?.shippingAddress?.state,
                    "pincode": item?.shippingAddress?.pinCode,
                    "country": "IN",
                    "phone": item?.shippingAddress?.phone,
                    "email": item?.shippingAddress?.email,
                    "gst": "09ABBCS1440F1ZN"
                },
                "billing_address": {
                    "name": item?.shippingAddress?.name,
                    "address1": item?.shippingAddress?.streetAddress,
                    "address2": "",
                    "city": item?.shippingAddress?.city,
                    "state": item?.shippingAddress?.state,
                    "pincode": item?.shippingAddress?.pinCode,
                    "country": "IN",
                    "phone": item?.shippingAddress?.phone,
                    "email": item?.shippingAddress?.email,
                    "gst": "09ABBCS1440F1ZN"
                },
                "shipping_company": item?.shippingCompany ?? "",
                "shipment_tracker": item?.awbNumber ?? "",
                "order_type": item?.orderType == "prePaid" ? "PrePaid" : 'COD',
                "order_items": item?.products?.map((item2, index) => {
                    return {
                        // "order_id": item?._id,
                        "order_id": item?.orderId,
                        "sub_order_id": `${item?.orderId}-${index + 1}`,
                        "replacement_for_sub_order_id": "",
                        "sku_code": item2?.productId?.code,
                        "qty": parseInt(item2?.quantity),
                        "selling_price_per_item": parseFloat(parseFloat(item2?.productId?.salePrice).toFixed(2)),
                        "shipping_charge_per_item": parseFloat(parseFloat(deliveryChargesPerItem) / parseFloat(item2?.quantity)) ?? 0.00,
                        "promo_discounts": promoDiscountsPerItem ?? 0.00,
                        "gift_wrap_charges": 0.00,
                        "gift_message": "",
                        "transaction_charges": 0.00,
                        "invoice_amount": parseFloat(parseFloat(parseFloat(item2?.productId?.salePrice) * parseFloat(item2?.quantity)) - parseFloat(promoDiscountsPerItem) + parseFloat(deliveryChargesPerItem)),
                        "cod_collectible_amount": 0.00,
                        "invoice_number": "",
                        "invoice_date": (item?.invoiceDate !== null && item?.invoiceDate !== undefined) ? Math.floor((item?.invoiceDate)?.getTime() / 1000) : 0,
                        "currency_code": "INR",
                        "tax_rate": 0,
                        "tax_amount": 0.00,
                        "igst_rate": 0,
                        "igst_amount": 0.00,
                        "cgst_rate": 0,
                        "cgst_amount": 0,
                        "sgst_rate": 0,
                        "sgst_amount": 0.00,
                        "status": getByValue(item?.deliveryStatus),
                        "last_status_update_date": Math.floor((item?.updatedAt).getTime() / 1000),
                        "return_shipping_company": "",
                        "return_shipment_tracker": "",
                        "return_qty": 0,
                        "return_reason": ""
                    }
                }),
                "is_channel_fulfilled": false,
                "order_notes": "Handle order with special care"
            }
        })
        return res.status(200).json({
            has_more: true,
            orders: response
        })

    } catch (error) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.get("/cancelled_orders", omsVerify, async (req, res) => {
    let { page_number, page_size, cancel_date_from, cancel_date_to } = req.query;
    if (!page_number || !page_size || !cancel_date_from || !cancel_date_to) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
    try {
        const admin = await findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        page_number = parseInt(page_number) || 1;
        page_size = parseInt(page_size) || 0;
        let query = { deliveryStatus: { $in: ['cancelled', 'userCancelled'] }, cancelDate: { $gte: new Date(cancel_date_from * 1000), $lte: new Date(cancel_date_to * 1000) } };
        query.$or = [
            { isPaid: true },
            { orderType: 'COD' }
        ]
        const orders = await storeOrdesTable.find({ ...query }).populate('couponId').populate('products.productId').populate('addressId').skip((page_number - 1) * page_size).limit(page_size).sort({ createdAt: -1 });
        let response = orders.map((item) => {
            let totalItem = item?.products?.length
            let totalAmount = item?.products?.reduce((accumulator, currentValue) => accumulator + (parseFloat(currentValue.productId?.salePrice) * parseInt(currentValue?.quantity)), 0);
            let deliveryChargesPerItem = parseFloat(parseFloat(parseFloat(item?.deliveryCharges) / totalItem).toFixed(2));
            let couponType = item?.couponId?.couponType == 'fixed' ? 'fixed' : item?.couponId?.couponType == 'percentage' ? 'percentage' : null;
            let promoDiscountsPerItem = 0.00;
            if (couponType == 'percentage') {
                let totalDiscount = parseFloat(totalAmount * (parseFloat(item?.couponId?.couponValue) / 100));
                promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
            }
            if (couponType == 'fixed') {
                let totalDiscount = (parseFloat(item?.couponId?.couponValue));
                promoDiscountsPerItem = parseFloat(parseFloat(totalDiscount / totalItem)?.toFixed(2))
            }
            return {
                "order_date": Math.floor((item?.createdAt).getTime() / 1000),
                "sla_date": 0,
                "warehouse": "",
                "shipping_address": {
                    "name": item?.shippingAddress?.name,
                    "address1": item?.shippingAddress?.streetAddress,
                    "address2": "",
                    "city": item?.shippingAddress?.city,
                    "state": item?.shippingAddress?.state,
                    "pincode": item?.shippingAddress?.pinCode,
                    "country": "IN",
                    "phone": item?.shippingAddress?.phone,
                    "email": item?.shippingAddress?.email,
                    "gst": "09ABBCS1440F1ZN"
                },
                "billing_address": {
                    "name": item?.shippingAddress?.name,
                    "address1": item?.shippingAddress?.streetAddress,
                    "address2": "",
                    "city": item?.shippingAddress?.city,
                    "state": item?.shippingAddress?.state,
                    "pincode": item?.shippingAddress?.pinCode,
                    "country": "IN",
                    "phone": item?.shippingAddress?.phone,
                    "email": item?.shippingAddress?.email,
                    "gst": "09ABBCS1440F1ZN"
                },
                "shipping_company": item?.shippingCompany ?? "",
                "shipment_tracker": item?.awbNumber ?? "",
                "order_type": item?.orderType == "prePaid" ? "PrePaid" : 'COD',
                "order_items": item?.products?.map((item2, index) => {
                    return {
                        // "order_id": item?._id,
                        "order_id": item?.orderId,
                        "sub_order_id": `${item?.orderId}-${index + 1}`,
                        "replacement_for_sub_order_id": "",
                        "sku_code": item2?.productId?.code,
                        "qty": parseInt(item2?.quantity),
                        "selling_price_per_item": parseFloat(parseFloat(item2?.productId?.salePrice).toFixed(2)),
                        "shipping_charge_per_item": parseFloat(parseFloat(deliveryChargesPerItem) / parseFloat(item2?.quantity)) ?? 0.00,
                        "promo_discounts": promoDiscountsPerItem ?? 0.00,
                        "gift_wrap_charges": 0.00,
                        "gift_message": "",
                        "transaction_charges": 0.00,
                        "invoice_amount": parseFloat(parseFloat(parseFloat(item2?.productId?.salePrice) * parseFloat(item2?.quantity)) - parseFloat(promoDiscountsPerItem) + parseFloat(deliveryChargesPerItem)),
                        "cod_collectible_amount": 0.00,
                        "invoice_number": "",
                        "invoice_date": (item?.invoiceDate !== null && item?.invoiceDate !== undefined) ? Math.floor((item?.invoiceDate)?.getTime() / 1000) : 0,
                        "currency_code": "INR",
                        "tax_rate": 0,
                        "tax_amount": 0.00,
                        "igst_rate": 0,
                        "igst_amount": 0.00,
                        "cgst_rate": 0,
                        "cgst_amount": 0,
                        "sgst_rate": 0,
                        "sgst_amount": 0.00,
                        "status": getByValue(item?.deliveryStatus),
                        "last_status_update_date": Math.floor((item?.updatedAt).getTime() / 1000),
                        "return_shipping_company": "",
                        "return_shipment_tracker": "",
                        "return_qty": 0,
                        "return_reason": ""
                    }
                }),
                "is_channel_fulfilled": false,
                "order_notes": "Handle order with special care"
            }
        })
        return res.status(200).json({
            has_more: true,
            orders: response
        })

    } catch (error) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/pushOrderStatus', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }

        // console.log('pUsh order Status Api', req.body);
        let response = await Promise.all(req?.body?.map(async (item) => {
            // let date = new Date (item?.dispatch_date*1000) ;
            let status = statusMap.get(item?.status);
            // console.log(status)
            const order = await storeOrdesTable.findOneAndUpdate({ orderId: item?.order_id },
                { deliveryStatus: status },
                { new: true, lean: true });
            if (order?._id) {
                return {
                    "success": true,
                    "message": null,
                    "order_id": order?.orderId,
                    "sub_order_id": item?.sub_order_id ?? ""
                }
            }

        }))
        // console.log('psuh Order staus response ', response);
        return res.status(200).json({
            has_error: false,
            orders: response
        })

    } catch (error) {
        // console.log(error)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/acknowledge', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        let query = {
            $or: [
                { isPaid: true },
                { orderType: 'COD' }
            ],
            // deliveryStatus : 'processing'
        }

        let response = await Promise.all(req?.body?.map(async (item) => {
            const order = await storeOrdesTable.findOne({ orderId: item?.order_id, ...query });
            if (order?._id) {
                return {
                    "success": true,
                    "message": null,
                    "order_id": order?.orderId,
                    "sub_order_id": item?.sub_order_id ?? ""
                }
            } else {
                return {
                    "success": false,
                    "message": null,
                    "order_id": item.order_id,
                    "sub_order_id": item?.sub_order_id ?? ""
                }
            }

        }))
        return res.status(200).json({
            has_error: false,
            orders: response
        })

    } catch (error) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/dispatch_orders', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }
        let query = {
            $or: [
                { isPaid: true },
                { orderType: 'COD' }
            ]
        }

        let response = await Promise.all(req?.body?.map(async (item) => {
            const order = await storeOrdesTable.findOneAndUpdate({ orderId: item?.order_id, ...query }, { deliveryStatus: 'shipped' }, { new: true, lean: true });
            // console.log(order)
            if (order?._id) {
                return {
                    "success": true,
                    "message": null,
                    "order_id": order?.orderId,
                    "sub_order_id": item?.sub_order_id ?? ""
                }
            } else {
                return {
                    "success": false,
                    "message": null,
                    "order_id": item?.order_id,
                    "sub_order_id": item?.sub_order_id ?? ""
                }
            }

        }))
        return res.status(200).json({
            // has_more: true,
            has_error: false,
            manifest_id: "",
            manifest_url: "",
            orders: response
        })

    } catch (error) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/pack_orders', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }

        let responseArr = [];
        let response = await Promise.all(req?.body.map(async (item) => {
            for (let order of item?.order_items) {
                let query = {};
                if (order?.invoice_date) {
                    let invoiceDate = new Date(order.invoice_date * 1000);
                    query.invoiceDate = invoiceDate;
                }
                if (order?.invoice_number) {
                    query.invoice = order?.invoice_number
                }
                // let invoiceDate = new Date(order.invoice_date * 1000)
                const storeOrder = await storeOrdesTable.findOneAndUpdate({ orderId: order?.order_id },
                    // { invoiceDate: invoiceDate, invoice: order?.invoice_number, },
                    { ...query },
                    { new: true, lean: true });
                // console.log(order)
                let obj;
                if (storeOrder?._id) {
                    obj = {
                        "success": true,
                        "message": null,
                        "order_id": storeOrder?.orderId,
                        "sub_order_id": order?.sub_order_id,
                        "tax_rate": 0.0,
                        "taxable_value": 0,
                        "tax_amount": 0,
                        "invoice_number": storeOrder?.invoice,
                        "invoice_date": Math.floor((storeOrder?.invoiceDate)?.getTime() / 1000),
                        "shipping_company": storeOrder?.shippingCompany,
                        "shipment_tracker": storeOrder?.awbNumber,
                    }
                } else {
                    obj = {
                        "success": false,
                        "message": null,
                        "order_id": order?.order_id,
                        "sub_order_id": order?.sub_order_id,
                        "tax_rate": 0.0,
                        "taxable_value": 0.0,
                        "tax_amount": 0.0,
                        "invoice_number": "",
                        "invoice_date": 0,
                        "shipping_company": "",
                        "shipment_tracker": ""
                    }
                }
                responseArr.push(obj);
            }


        }))
        return res.status(200).json({
            has_error: false,
            orders: responseArr
        })

    } catch (error) {
        // console.log(error.message)
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

Oms.post('/invoices', omsVerify, async (req, res) => {
    try {
        if (req.body?.length < 1) {
            return res.status(400).json({
                "message": "Invalid Params",
                "code": "0010",
                "data": "json object with issue details"
            })
        }
        const admin = findAdminTeacherUsingUserId(req.userId)
        if (!admin) {
            return res.status(401).json({
                "message": "Auth Token expired/invalid",
                "code": "-0001"
            })
        }


        let invoiceString = '';
        let response = await Promise.all(req?.body?.map(async (item) => {
            const order = await storeOrdesTable.findOne({ orderId: item?.order_id });
            // console.log(order)
            if (order?._id) {
                invoiceString = order?.invoice
            }

        }))
        return res.status(200).json(invoiceString)

    } catch (error) {
        return res.status(400).json({
            "message": "Invalid Params",
            "code": "0010",
            "data": "json object with issue details"
        })
    }
})

module.exports = Oms;