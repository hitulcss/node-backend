const { uploadFile } = require("../aws/UploadFile");
const { invoiceTable } = require("../models/Invoice");
const { paymentTransactionTable } = require("../models/paymentTransaction");
const { pdfGenerate } = require("./invoiceGenrationBatch");
const moment = require("moment");
const path = require('path');

const batchExtendInvoiceHelper = async (data,obj) => {
        let invoiceNumber = "NA" ;
        if( parseInt(data.amount) >  0){
            let latestInvoice = await invoiceTable.find({}).sort({ createdAt: -1 });
            invoiceNumber = parseInt(latestInvoice[0]?.invoiceNumber ?? 0) + 1;
        }
        
        let addressArray = data?.user?.Address?.split(",");
        let isState = addressArray[addressArray?.length - 2] ?? "";
        let state = isState != "" ? isState?.trim() : "Uttar Pradesh";
        let year = `${moment().format("YY")}-${parseInt(moment().format("YY")) + 1}`;
        const dataForInvoice = {
            invoiceNumber: parseInt(data.amount) > 0 ? `${year}/${invoiceNumber}` :`${year}/${"NA"}` ,
            invoiceDate: moment().format("DD-MM-YYYY"),
            studentName: data?.user?.FullName,
            studentAddress: data?.user?.Address ?? "",
            SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,Uttar Pradesh, 201005`,
            items: [
            {
                name: data?.batch_name ?? "",
                price: parseFloat(data.amount).toFixed(2),
                quantity: 1,
            },
            ],
            // items : [ { name : newCourseOrder?.courseId?.batch_name ?? "" , price : 2.85 , quantity: 1 }],
            studentEmail:
            data?.user?.email != "user@gmail.com" ? data?.user?.email : "NA",
            studentPhone: data?.user?.mobileNumber,
            studentState: state,
            gstNumber:parseInt(data.amount) > 0 ?  "09ABBCS1440F1ZN" : 'NA',
        };
        const FileUploadLocation = await pdfGenerate(dataForInvoice);
        const pdfFilePath = path.join(__dirname, "../", FileUploadLocation);
        let fileName = path.basename(pdfFilePath, path.extname(pdfFilePath));
        let ext = path.extname(pdfFilePath);
        let fileLoc = "";
        let paymentArr = [];
        const helperString = Math.floor(Date.now() / 1000);
        let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
        setTimeout(async () => {
            fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
            if (parseInt(data.amount) >  0) {
            const newInvoice = new invoiceTable({
                invoiceNumber: invoiceNumber,
            });
            newInvoice.save();
            }
            obj.invoice = [{
                installmentNumber:"1",
                fileUrl:fileLoc
            }];
            paymentArr.push(obj);
            await paymentTransactionTable.insertMany(paymentArr);
        }, 6000);
};

module.exports = {
  batchExtendInvoiceHelper,
};
