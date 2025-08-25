const { uploadFile } = require("../aws/UploadFile");
const { invoiceTable } = require("../models/Invoice");
const { paymentTransactionTable } = require("../models/paymentTransaction");
const { pdfGenerate } = require("./invoiceGenrationBatch");
const moment = require("moment");
const path = require('path');

const invoiceHelper = async (data) => {
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
  const helperString = Math.floor(Date.now() / 1000);
  let FileUploadLocation2 = `invoice/invoice/${fileName}_${helperString}${ext}`;
  setTimeout(async () => {
    fileLoc = await uploadFile(pdfFilePath, FileUploadLocation2);
    // console.log(fileLoc);

    const newOrder = await paymentTransactionTable.findOneAndUpdate(
      {
        user: data?.user?._id,
        email: data?.user?.email,
        payment_id: data?.transactionId,
        batch_name: data?.batch_name,
      },
      { invoice: [{ installmentNumber: "1", fileUrl: fileLoc }] },
      { new: true, lean: true }
    );
    // console.log(newOrder)
    if (newOrder?.invoice?.length >= 1 && parseInt(data.amount) >  0) {
      const newInvoice = new invoiceTable({
        invoiceNumber: invoiceNumber,
      });
      newInvoice.save();
    }
  }, 6000);
};

module.exports = {
  invoiceHelper,
};
