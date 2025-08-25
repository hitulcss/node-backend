var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://sdcampus-d00f3-default-rtdb.firebaseio.com/",
});

module.exports = { admin };
