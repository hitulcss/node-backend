const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const convertAmountToWordsIndian = (amount) => {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(num) {
      if (num === 0) return '';
      else if (num < 10) return units[num];
      else if (num < 20) return teens[num - 11];
      else return tens[Math.floor(num / 10)] + ' ' + units[num % 10];
  }

  function convertToWords(number) {
      if (number === 0) return 'Zero';

      const crore = Math.floor(number / 10000000);
      const lakh = Math.floor((number % 10000000) / 100000);
      const thousand = Math.floor((number % 100000) / 1000);
      const remainder = number % 1000;

      let result = '';

      if (crore > 0) result += convertGroup(crore) + ' Crore ';
      if (lakh > 0) result += convertGroup(lakh) + ' Lakh ';
      if (thousand > 0) result += convertGroup(thousand) + ' Thousand ';
      if (remainder > 0) result += convertGroup(remainder);

      return result.trim();
  }

  return convertToWords(amount);
}


function generateInvoicePdf(data) {

    const fonts = {
        Roboto: {
          normal: "C:/Users/abhisDesktopTrandoSD CAMPUSbackendHelperFunctionsfontsrobotoRoboto-Regular.ttf",
          bold: "C:/Users/abhis/Desktop/Trando/SD CAMPUS/backend/HelperFunctions/fonts/roboto/Roboto-Medium.ttf",
          italics: "C:/Users/abhis/Desktop/Trando/SD CAMPUS/backend/HelperFunctions/fonts/roboto/Roboto-Italic.ttf",
          bolditalics: "C:/Users/abhis/Desktop/Trando/SD CAMPUS/backend/HelperFunctions/fonts/roboto/Roboto-MediumItalic.ttf",
        },
      };
  const total = data.items.reduce((sum, item) => sum + (item.price*item.quantity) , 0);
  const printer = new PdfPrinter(fonts);
  var docDefinition = {

    
    content: [
      {
        fontSize: 11,
        table: {
          widths: ["50%", "50%"],

          body: [
            [
                {
                    image:"data:image/png;base64,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",
                    width: 160,
                    height: 40, // Set the width of the image as needed
                    border: [false, false, false, true],
                    margin: [-5, 0, 0, 10],
                  },
              {
                stack: [
                  {
                    text: `Invoice Date: ${moment().format("DD-MM-YYYY")}`,
                    margin: [0, 0, 0, 20],
                    bold:true
                  },
                  {
                    text: `Invoice# ${data.invoiceNumber}`,
                    margin: [0, 0, 0, 20],
                    bold:true,
                  },
                ],
                alignment: "right",
                border: [false, false, false, true],
              },
            ],
          ],
        },
      },
      {
        fontSize: 11,
        table: {
          widths: ["50%", "50%"],
          body: [
            [
              {
                text: `Bill To`,
                border: [false, false, false, true],
                margin: [-5, 0, 0, 10],
                bold:true,
              },
              {
                text: "Bill From ",
                alignment: "right",
                border: [false, false, false, true],
                margin: [0, 0, 0, 10],
                bold:true
              },
            ],
            [
              {
                text: `${data.studentName}`,
                border: [false, false, false, false],
                margin: [0, 0, 0, 0],
              },
              {
                text: "SD EMPIRE",
                alignment: "right",
                border: [false, false, false, false],
                margin: [0, 0, 0, 0],
              },
            ],
            [
              {
                text: `Address: ${data.studentAddress}`,
                border: [false, false, false, false],
                margin: [0, 0, 0, 0],
              },
              {
                text: `Address :${data.SDAddress} `,
                alignment: "right",
                border: [false, false, false, false],
                margin: [0, 0, 0, 0],
              },
            ],
            [
              {
                text: `Email : ${data?.studentEmail}`,
                border: [false, false, false, false],
                margin: [0, 0, 0, 0],
              },
              {
                text: ``,
                border: [false, false, false, false],
                margin: [0, 0, 0, 0],
              },
            ],
            [
              {
                text: `Mobile Number : ${data?.studentPhone}`,
                border: [false, false, false, false],
                margin: [0, 0, 0, 20],
              },
              {
                text: ``,
                border: [false, false, false, false],
                margin: [0, 0, 0, 20],
              },
            ],
          ],
        },
      },
      {
        fontSize: 11,
        table: {
          widths: ["8%", "53%", "13%", "13%", "13%"],
          body: [
            [
              { text: "S NO", border: [true, true, false, true], bold:true },
              { text: "Item", border: [true, true, false, true] ,bold:true},
              { text: "Unit Price", border: [true, true, false, true] ,bold:true},
              {
                text: "Quantity",
                alignment: "center",
                border: [true, true, false, true],
                bold:true
              
              },
              { text: "Total", border: [true, true, true, true],bold:true },
            ],
            ...data.items.map((item , index) => [
                
                    { text: `${index+1}`, border: [true, true, false, false] },
                    { text: `${item.name}`, border: [true, true, false, false] },
                    {
                      text: `₹ ${item.price - item.price * 0.18}`,
                      border: [true, true, false, false],
                    },
                    {
                      text: `${item.quantity}`,
                      alignment: "center",
                      border: [true, true, false, false],
                    },
                    {
                      text: `₹  ${((item.quantity * item.price) -((item.quantity * item.price) * 0.18)).toFixed(2)}`,
                      border: [true, true, true, false],
                      // margin: [0, 0, 0, 0],
                    },
            ]),
            [
                { text: "", border: [true, false, false, false] },
                { text: "", border: [true, false, false, false] },
                { text: "", border: [true, false, false, false] },
                { text: "", border: [true, false, false, false] },
                { text: "", border: [true,false, true, false] },
            ]
          ],
        },
      },
      {
        // layout: "noBorders",
        fontSize: 11,
        // margin: [0, 0, 0, 0],
        table: {
          widths: ["88%", "12%"],
          body: [
            [
              { text: "Subtotal:", alignment: "right" },
              {
                text: `₹ ${(total - total*0.18).toFixed(
                  2
                )}`,
                // alignment:''
                // margin: [0, 0, 0, 0],
              },
            ],
            data.studentState === "Uttar Pradesh"
              ? [
                  { text: "CGST (9%):", alignment: "right" },
                  `₹ ${(total * 0.09).toFixed(2)}`,
                ]
              : [
                  { text: "GST (18%):", alignment: "right" },
                  `₹ ${(total * 0.18).toFixed(2)}`,
                ],
            data.studentState === "Uttar Pradesh"
              ? [
                  { text: "IGST (9%):", alignment: "right" },
                  `₹ ${(total * 0.09).toFixed(2)}`,
                ]
              : [{ text: "", alignment: "right" },
              ``,],
          ],
        },
      },

      {
        fontSize: 11,
        table: {
          widths: ["88%", "12%"],
          body: [
            [
              {
                text: "Payable Amount:",
                alignment: "right",
                border: [true, false, true, false],
                margin: [0, 0, 0, 10],
                color: "red",
              },
              {
                text: `₹ ${total}`,
                border: [true, false, true, false],
                margin: [0, 0, 0, 10],
                color: "red",
              },
            ],
          ],
        },
      },
      {
        // layout: 'noBorders',
        fontSize: 11,
        margin:[0,0,0,0],
        table:{
          widths: ['30%','70%'],
          body:[
            [{ text: "Amounts in Words:", border: [true, true, false, false],bold:true }, { text: "", border: [false, true, true, false] , }],
            [{ text: `${convertAmountToWordsIndian(total)}`, border: [true, false, false,true], bold:true }, 
            {
              text:"", // Set the width of the image as needed
              alignment: 'right',
              border: [false, false, true, true],
              // margin: [5, 5, 5, 0],
            }]
          ]
        }
      },
      {
        // layout: 'noBorders',
        fontSize: 11,
        margin:[0,0,0,0],
        table:{
          widths: ['30%','70%'],
          body:[
            [{ text: "", border: [true, false, false, false] }, { text: "For SD Publication:", border: [false, false, true, false] , alignment: 'right'}],
            [{ text: "", border: [true, false, false,false] }, 
            {
              image:"data:image/png;base64,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",
              width: 160,
              height: 40, // Set the width of the image as needed
              alignment: 'right',
              border: [false, false, true, false],
              // margin: [5, 5, 5, 0],
            }],
            [{ text: "", border: [true, false, false, true] }, { text: "Authorized Signatory", border: [false, false, true, true] , alignment: 'right'}]
          ]
        }
      },
      {
        fontSize: 11,
        margin:[0,16,0,0],
        table: {
          widths: ["40%", "20%", "20%", "20%"],
          body: [
            [
              // { text: "S NO", border: [true, true, false, true], bold:true },
              { text: `Payment Transaction ID:${data.transactionId} `, border: [true, true, false, true] },
              { text: `Date & Time :${data.transactionDateTime} `, border: [true, true, false, true] },
              {
                text: `InVoice Value : ${data.inVoiceValue}`,
                alignment: "center",
                border: [true, true, false, true]
               
              
              },
              { text: `Mode of Payment:${data.paymentMode}`, border: [true, true, true, true] },
            ]
          ]
        }
      }
    ],
  };

  const options = {};
  const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
  return pdfDoc;
}

// const data = {
//   invoiceNumber: 12345,
//   invoiceDate: "2023-10-25",
//   studentName: "XYZ ....",
//   studentAddress: `House No - 04, Village - ****** , Post & Tehsil - ******* - ******* pincode - 123456 `,
//   SDAddress: `Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,
//     Uttar Pradesh 201005`,
//   hash: "examplehash",
//   items: [{name:"Batch1" , price :2000, quantity: 1 },{name:"BAtch2", price:2000 ,quantity: 2}],
//   studentEmail: "Testing@gmial.com",
//   studentPhone: "1234567",
//   studentState: "Uttar Pradesh",
  
// };
const pdfStoreGenerate = (data) => {
    const pdfDoc = generateInvoicePdf(data);
    // const randomNumber = Math.random();
    pdfDoc.pipe(fs.createWriteStream(`invoices_${data.invoiceNumber}.pdf`));
    pdfDoc.end();
}

module.exports = {
    pdfStoreGenerate
}