const axios = require('axios');

const url = 'https://graph.facebook.com/v22.0/618193478041525/messages';
// const token = 'EAAJDr25ZCK9kBO2Yyg6yaBosG90NeueRI8YrGw2Nz58uryuyQrGt9Yqd1BuZAlLbF3On34f8EcgEkY3gZBj4GT68BjLeJt4nkyHZAT9ZC1whvMyQ9gF3S4wKsiqLb3ishxeQFKCdaPcxBuZC1VdtQUsWtiZAWj5w04ZA31WrPYHVgZAaa2lgTrmmZB5uHvr6AbbHVzfQZDZD'; // Replace with your actual access token
const token = 'EAAPJwz4rdhEBPL3xasoem991KTiyOxXrZCXYgUzwMDgT20O9XEAC6AIFYSJbNQibXe0MhzBs473ZCjgZC3n6yG7q283UyahlQ037m66EdtKAmFxjJxNXAR31ElYlR97UXwQzuWqTLEG0jk4uciTTiuKxlTumRZBIY5r2pI2MZCZAjbIx7UNeDwr2DfpfzVxeA59AZDZD';
async function sendOTP(mobileNumber, otpCode) {

    const data = {
        messaging_product: "whatsapp",
        to: `+91${mobileNumber}`,
        type: "template",
        template: {
            name: "sdcampus_otp_verify",
            language: {
                code: "en_US"
            },
            components: [
                {
                    type: "BODY",
                    parameters: [
                        {
                            type: "text",
                            text: `${otpCode}`
                        }
                    ]
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                        {
                            type: "text",
                            text: otpCode
                        }
                    ]
                }
            ]
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

async function sendWhatsAppMessage(mobileNumber, fullName) {

    const data = {
        messaging_product: "whatsapp",
        to: `+91${mobileNumber}`,
        type: "template",
        template: {
            name: "inactive_alert_7days_to_parents_sd_campus",
            language: {
                code: "en"
            },
            
            components: [
                {
                    "type": "header",
                    "parameters": [
                      {
                        "type": "image",
                        "image": {
                          "link": "https://static.sdcampus.com/assets/alert-sign-attention-warning-attacker-alert-sign-technology-cyber-security-protection-concept-stock-illustration-vector_1754547624.jpg"
                        }
                      }
                    ]
                },
                // {
                //     type: "body",
                //     parameters: [
                //         {
                //             type: "text",
                //             text: `Hello ${fullName}, this is a reminder for your upcoming session.`
                //         }
                //     ]
                // }
            ]
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.warn('Success:', response.data);
    } catch (error) {
        console.error('Error sending 7 days alert:', error.response ? error.response.data : error.message);
    }
}

const sendWAOTP = async (phone, otp) => {
    const data = {
        messaging_product: "whatsapp",
        to: `+91${phone}`,
        type: "template",
        template: {
            name: "sdcampus_otp_verify",
            language: { code: "en_US" },
            components: [
                {
                    type: "body",
                    parameters: [{ type: "text", text: `${otp}` }]
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [{ type: "text", text: otp }]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending OTP...');
        return false;
    }
};

const campusSignup = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: `+91${dataObj.phone}`,
        type: "template",
        template: {
            name: "sdcampus_signup",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: `https://static.sdcampus.com/assets/app_download_17329572271_1743746150.png`,
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: `*${dataObj.name}*`
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending campusSignup...', error);
        return false;
    }
};

const batchPurchaseSuccess = async (dataObj) => {
    // console.log("dataObj", dataObj);
    const data = {
        messaging_product: "whatsapp",
        to: `+91${dataObj.phone}`,
        type: "template",
        template: {
            name: "batch_purchase",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "document",
                            document: {
                                link: `${dataObj.invoiceUrl}`,
                                filename: "Invoice.pdf"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: `*${dataObj.name}*`
                        },
                        {
                            type: "text",
                            text: `*${dataObj.batchName}*`
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.warn("batch purchase success",responseData.data)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending batchPurchaseSuccess...', error);
        return false;
    }
};

const demoWelcomeImmediately = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: `+91${dataObj.phone}`,
        type: "template",
        template: {
            name: "welcome_demowa_sainik_jnv_immediately",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://static.sdcampus.com/makerting_banners/demo_immidately.jpg"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: `*${dataObj.name}*`
                        },
                        {
                            type: "text",
                            text: `*${dataObj.eventName}*`
                        },
                        {
                            type: "text",
                            text: `*${dataObj.date},${dataObj.startTime}*`
                        },
                        {
                            type: "text",
                            text: `${dataObj.meetLink}`
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending demoWelcomeImmediately...');
        return false;
    }
};

const demoReminder1HrBefore = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: dataObj.phone,
        type: "template",
        template: {
            name: "reminder1_demowa_sainik_jnv_1hrs_before",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://static.sdcampus.com/makerting_banners/demo_reminder_1hrs_left.jpg"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: `*${dataObj.eventName}*`
                        },
                        {
                            type: "text",
                            text: `*${dataObj.date},${dataObj.startTime}*`
                        },
                        {
                            type: "text",
                            text: `${dataObj.meetLink}`
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending demoReminder1HrBefore...', error);
        return false;
    }
};

const demoReminder15MinBefore = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: dataObj.phone,
        type: "template",
        template: {
            name: "reminder2_demowa_sainik_jnv_15min_before",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://static.sdcampus.com/makerting_banners/demo_reminder_15min_left.jpg"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: `*${dataObj.eventName}*`
                        },
                        {
                            type: "text",
                            text: `*${dataObj.date},${dataObj.startTime}*`
                        },
                        {
                            type: "text",
                            text: `${dataObj.meetLink}`
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending demoReminder15MinBefore...');
        return false;
    }
};

const demoReminder5MinBefore = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: dataObj.phone,
        type: "template",
        template: {
            name: "reminder3_demowa_sainik_jnv_5min_before",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://static.sdcampus.com/makerting_banners/demo_reminder_5min_left.jpg"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: `*${dataObj.eventName}*`
                        },
                        {
                            type: "text",
                            text: `*${dataObj.date},${dataObj.startTime}*`
                        },
                        {
                            type: "text",
                            text: `${dataObj.meetLink}`
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending demoReminder5MinBefore...');
        return false;
    }
};

const demoFollowUpAfter2Min = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: dataObj.phone,
        type: "template",
        template: {
            name: "thankyou_demowa_sainik_jnv_2minafter",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://static.sdcampus.com/makerting_banners/demo_thank_you_2min_after.jpg"
                            }
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending demoFollowUpAfter2Min...');
        return false;
    }
};

const demoFollowUpAfter24Hrs = async (dataObj) => {
    const data = {
        messaging_product: "whatsapp",
        to: dataObj.phone,
        type: "template",
        template: {
            name: "followup_demowa_sainik_jnv_24hrsafter",
            language: { code: "en" },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://static.sdcampus.com/makerting_banners/demo_followup_after24hrs.jpg"
                            }
                        }
                    ]
                }
            ]
        }
    };

    try {
        const responseData = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log(responseData)
        // Return true if the message status is 'accepted'
        return responseData?.statusText === 'OK';
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending demoFollowUpAfter24Hrs...');
        return false;
    }
};


module.exports = {
    sendWAOTP,
    campusSignup,
    batchPurchaseSuccess,
    demoWelcomeImmediately,
    demoReminder1HrBefore,
    demoReminder15MinBefore,
    demoReminder5MinBefore,
    demoFollowUpAfter2Min,
    demoFollowUpAfter24Hrs,
    sendWhatsAppMessage,
    sendOTP,
};

// Example usage
// sendOTP("+919983904397", "123456");
