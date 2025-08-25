const { admin } = require("../routes/pushNotification");
const sendPushNotification = async (token, data) => {
  // if (token) {
  //   const payload = {
  //     notification: {
  //       title: data.title,
  //       body: data.message,
  //       imageUrl: data.imageUrl
  //         ? data.imageUrl
  //         : "https://d1mbj426mo5twu.cloudfront.net/Banner/Banner1/1_1698744630.jpg",
  //       icon: "https://d1mbj426mo5twu.cloudfront.net/Banner/Banner1/1_1698744630.jpg",
  //     },
  //     data: {
  //       route: data.route,
  //       rootId: data.rootId || "",
  //       childId: data.childId || "",
  //     },
  //   };
  //   // admin
  //   //   .messaging()
  //   //   .sendToDevice(token, payload)
  //   //   .then((response) => {
  //   //     console.log("Response",)
  //   //     console.log("Push notification sent successfully:");
  //   //   })
  //   //   .catch((error) => {
  //   //     console.error("Error sending push notification:", error);
  //   //   });
  // }
  return [];
};

// const sendBulkPushNotifications = async (tokenArr, data) => {
//   // if (tokenArr.length === 0) {
//   //   return Promise.resolve([]);
//   // }
//   // console.log("ReqData", data)
//   // const batchSize = 100; // Adjust the batch size as per your needs
//   // const numBatches = Math.ceil(tokenArr.length / batchSize);

//   const successes = [];
//   // const failures = [];
//   // console.log("Root ID:", rootIdString);
//   // console.log("Child ID:", childIdString);

//   // const data1 = {
//   //   rootId: data?.rootId.toString() || "",
//   //   childId: data?.childId.toString() || ""
//   // };

//   // const sendBatch = async (tokens) => {
//   //   const payload = {
//   //     notification: {
//   //       title: data.title || "",
//   //       body: data.message || "",
//   //       image:
//   //         data.fileUrl ||
//   //         "",
//   //       // icon: data.fileUrl ||
//   //       // "",
//   //     },
//   //     data: {
//   //       route: data.route || "",
//   //       rootId: data?.rootId || "",
//   //       childId: data?.childId || "",

//   //       // data: JSON.stringify(data1)
//   //     },
//   //     tokens : tokens
//   //   };
//   //   // console.log(tokens)
//   //   // console.log("Payload", payload)
//   //   // try {
//   //   //   // const response = await admin.messaging().sendToDevice(tokens, payload);
//   //   //   // const response = await admin.messaging().sendEachForMulticast(payload);
//   //   //   // console.log(response?.responses[0]?.);

//   //   //   // console.log(response?.responses[0]);
//   //   //   // successes.push(
//   //   //   //   ...response.results.map((result, index) => ({
//   //   //   //     index: tokens[index],
//   //   //   //     response: result,
//   //   //   //   }))
//   //   //   // );
//   //   //   successes.push(
//   //   //     ...response.responses.map((result, index) => ({
//   //   //       index: tokens[index],
//   //   //       response: result,
//   //   //     }))
//   //   //   );
//   //   // } catch (error) {
//   //   //   // console.log(error)
//   //   //   failures.push(...tokens.map((token) => ({ index: token, error })));
      
//   //   // }
//   // };

//   // const sendPromises = [];
//   // for (let i = 0; i < numBatches; i++) {
//   //   const startIdx = i * batchSize;
//   //   const endIdx = startIdx + batchSize;
//   //   const batchTokens = tokenArr.slice(startIdx, endIdx);
//   //   sendPromises.push(sendBatch(batchTokens));
//   // }

//   // await Promise.all(sendPromises);

//   // if (failures.length > 0) {
//   //   const error = new Error("Error sending push notifications");
//   //   error.failures = failures;
//   //   throw error;
//   // }

//   return successes;
// };


const sendBulkPushNotifications = async( tokenArr , data ) => {
  // console.log(data);
  const successes = [];
  const failures = [];
  const batchSize = 100; // Adjust the batch size as per your needs
  const numBatches = Math.ceil(tokenArr.length / batchSize);
  const sendBatch = async (tokens) => {
    const payload = {
      notification: {
        title: data.title || "",
        body: data.message || "",
        image:
          data.fileUrl ||
          "",
        // icon: data.fileUrl ||
        // "",
      },
      data: {
        route: data.route || "",
        rootId: data?.rootId || "",
        childId: data?.childId || "",

        // data: JSON.stringify(data1)
      },
    };

    const payloadForMulticast = {
      notification: {
        title: data.title || "",
        body: data.message || "",
        image:
          data.fileUrl ||
          "",
        // icon: data.fileUrl ||
        // "",
      },
      data: {
        route: data.route || "",
        rootId: data?.rootId || "",
        childId: data?.childId || "",

        // data: JSON.stringify(data1)
      },
      tokens : tokens
    };
    
    const payloadForSendToDevice = {
      notification: {
        title: data.title || "",
        body: data.message || "",
        image:
          data.fileUrl ||
          "",
        // icon: data.fileUrl ||
        // "",
      },
      data: {
        route: data.route || "",
        rootId: data?.rootId || "",
        childId: data?.childId || "",

        // data: JSON.stringify(data1)
      },
    };
    

    try {
      // const response = await admin.messaging().send(tokens, payloadForSendToDevice);
      // console.log(response);
      // const response = await admin.messaging().sendToDevice(tokens, payloadForSendToDevice);

      // const response = await admin.messaging().sendAll(messages);
      const response = await admin.messaging().sendEachForMulticast(payloadForMulticast);
      // sendEachForMulticast
      // console.log(response)
      // console.log('195' , response)
      //  console.log('193' , response?.results[0]?.error);
      // console.log('194' , response?.responses[0]);

      // console.log('196' , response?.results[0]?.error);
      // successes.push(
      //   ...response.results.map((result, index) => ({
      //     index: tokens[index],
      //     response: result,
      //   }))
      // );
      for( let res of response.responses){
        if( res?.success == true){
          successes.push(res);
        }else{
          failures.push(res);
        }
      }
      // successes.push(
      //   ...response.responses.map((result, index) => ({
      //     index: tokens[index],
      //     response: result,
      //   }))
      // );
    } catch (error) {
      // console.log(error)
      failures.push(...tokens.map((token) => ({ index: token, error })));
      
    }
  };

  const sendPromises = [];
  for (let i = 0; i < numBatches; i++) {
    const startIdx = i * batchSize;
    const endIdx = startIdx + batchSize;
    const batchTokens = tokenArr.slice(startIdx, endIdx);
    sendPromises.push(sendBatch(batchTokens));
  }

  await Promise.all(sendPromises);

  // if (failures.length > 0) {
  //   const error = new Error("Error sending push notifications");
  //   error.failures = failures;
  //   throw error;
  // }

  return {successes  , failures} ;
}
module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
};
