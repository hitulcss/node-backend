const  axios = require('axios') ;
var sha512 = require('js-sha512');

var paymentConfig = {
    key: process.env.EASEBUZZ_KEY,
    salt: process.env.EASEBUZZ_SALT,
    env: process.env.EASEBUZZ_ENV,
    enable_iframe: process.env.EASEBUZZ_IFRAME,
  };

  let generateHash = function (data) {
    console.log("Hash Data", data)
    var hashstring = paymentConfig.key + "|" + data.txnid + "|" + paymentConfig.salt;
    // data.hash = sha512.sha512(hashstring);
    // console.log(hashstring);
    let hash =  sha512.sha512(hashstring);
    // let hash =  
    // return (data.hash);
    return hash;
  }

const checkPayment = async (txnid  ) => {
    // console.log(txnid);
    const hash = generateHash({txnid}) ;
    // console.log(hash);
    let url =  `https://dashboard.easebuzz.in/transaction/v2.1/retrieve`;
    const config = {
        headers: {
            'Accept': 'application/json' ,
            'Content-Type': 'application/x-www-form-urlencoded' 
        },
    };
    let reqData = {
        txnid :  txnid ,
        key :  paymentConfig.key ,
        hash : hash 
    }
    // console.log(reqData)
    try {
        const response =  await axios.post(url ,reqData , config );
        // const data = await exists(reqData)
        // console.log(data)
        // const res =  await response.json();
        // console.log(res.data)
        if( response.data.status ){
            return {
                status : true ,
                data : null ,
                msg : response.data.msg
            }
        }else{
            return {
                status : true ,
                data : response.data.msg ,
                msg : `Payment Details fetched`
            }

        }

    }catch(error){
        return {
            status : false ,
            data : null ,
            msg : error.message 
        }
    }
}

module.exports = {
    checkPayment
}
