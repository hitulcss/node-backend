// const express = require("express");
// const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");
// const app = express();
// const cors = require("cors");
// const https = require("https");
// const http = require("http");
// const { Server } = require("socket.io");
// const session = require("express-session");
// const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
// const { privatemessagingmodel } = require("./models/messagingModel");
// const { faqsTable } = require("./models/FAQs");
// // require('events').EventEmitter.prototype._maxListeners = 0;
// // require('events').EventEmitter.defaultMaxListeners = Infinity;
// require('events').EventEmitter.defaultMaxListeners = 0
// // const emitter = new EventEmitter()
// // emitter.setMaxListeners(0)
// // const { CodOrderPlaced } = require("./HelperFunctions/whatsAppService.js")
// const rateLimiter = require('./middleware/rateLimiter');

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const rateLimiter = require('./middleware/rateLimiter');
const { privatemessagingmodel } = require("./models/messagingModel");
require('events').EventEmitter.defaultMaxListeners = 50;

app.set('trust proxy', 1);
// let corsOptions = {
//     origin: [ "http://localhost:4011","http://localhost:3002", "http://localhost:3001",
//         'https://sdcampus.com', 'https://www.sdcampus.com', 'https://dev.sdcampus.com', 'https://stage.sdcampus.com', 
//         'https://calendar.sdcampus.com', 'https://clerk.sdcampus.com', 'https://accounts.sdcampus.com', 
//         'https://dev.sdpublication.com', 'https://stage.sdpublication.com', 'https://www.sdpublication.com', 
//         'https://dev.sdpublication.com', 'https://stage.sdpublication.com', 'https://www.sdpublication.com', 
//         'https://sdpublication.com', 'https://www.sdcampus.com', 'https://store.sdcampus.com', 
//         'https://dev-cms.sdcampus.com', 'https://cms.sdcampus.com', 'https://dev-twoway-frontend.sdcampus.com', 
//         'https://live-class.sdcampus.com', 'https://sales.sdcampus.com','https://next-sdcampus-website.vercel.app'],
//     optionsSuccessStatus: 200
// }
// app.use(cors(corsOptions));

// Allowed origins
const allowedOrigins = [
  "http://localhost:4011",
  // "http://localhost:3002",
  // "http://localhost:3001",
  "https://sdcampus.com",
  "https://www.sdcampus.com",
  "https://dev.sdcampus.com",
  "https://stage.sdcampus.com",
  "https://calendar.sdcampus.com",
  "https://clerk.sdcampus.com",
  "https://accounts.sdcampus.com",
  "https://dev.sdpublication.com",
  "https://stage.sdpublication.com",
  "https://www.sdpublication.com",
  "https://sdpublication.com",
  "https://store.sdcampus.com",
  "https://dev-cms.sdcampus.com",
  "https://cms.sdcampus.com",
  "https://dev-twoway-frontend.sdcampus.com",
  "https://live-class.sdcampus.com",
  "https://sales.sdcampus.com",
  "https://next-sdcampus-website.vercel.app",
  "https://test-series.sdcampus.com"
];

const webhookPaths = [
  "/api/v1/purchase/validityAppResponse",
  "/api/v1/purchase/validityResponse",
  "/api/v1/purchase/courseResponse",
  "/api/v1/purchase/courseAppResponse",
  "/api/v1/payment/courseresponse",
  "/api/v1/payment/response",
  "/api/v1/payment/courseEmiResponse"
];

// // Custom CORS middleware
// const corsOptionsDelegate = (req, callback) => {
//   // Skip CORS check for webhook paths
//   if (webhookPaths.includes(req.path)) {
//     console.warn(`[CORS] Webhook path detected: ${req.path}, allowing all origins`);
//     return callback(null, { origin: true }); // Allow all origins for webhooks
//   }

//   const origin = req.header("Origin");
//   if (allowedOrigins.includes(origin)) {
//     console.warn(`[CORS] Allowed: ${origin} -> ${req.path}`);
//     callback(null, { origin: true, credentials: true });
//   } else {
//     console.warn(`[CORS] Blocked origin: ${origin || "No Origin Header"} -> ${req.path}`);
//     callback(new Error("Not allowed by CORS"));
//   }
// };

// CORS setup
// const corsOptions = {
//   origin: function (origin, callback , req) {
//     console.warn(`[CORS] Request from origin: ${origin} -> ${req}`);
//     // const req = this.req;
//     // if (origin && webhookPaths.includes(req.path)) {
//     //   console.warn(`[CORS] Webhook path detected: ${req.path}, allowing all origins`);
//     //   return callback(null, { origin: true });
//     // }
//     if (!origin || allowedOrigins.includes(origin)) {
//       console.warn(`[CORS] Allowed: ${origin} -> ${this}`);
//       callback(null, true);
//     } else {
//       console.warn(`[CORS] Blocked origin: ${origin || "No Origin Header"} -> ${this}`);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["X-Requested-With", "Content-Type", "Authorization"],
//   credentials: true,
//   optionsSuccessStatus: 200
// };

app.use((req, res, next) => {
  const corsOptions = {
    origin: (origin, callback) => {
      console.warn(`[CORS] Request from origin: ${origin} for ${req.path}`);

      if (webhookPaths.includes(req.path)) {
        console.warn(`[CORS] Webhook path detected: ${req.path}, allowing all origins`);
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["X-Requested-With", "Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
  };

  cors(corsOptions)(req, res, next);
});

app.options("*", (req, res, next) => {
  const corsOptions = {
    origin: (origin, callback) => {
      console.warn(`[CORS] Request from origin: ${origin} for ${req.path}`);

      if (webhookPaths.includes(req.path)) {
        console.warn(`[CORS] Webhook detected: ${req.path}, allowing all origins`);
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["X-Requested-With", "Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
  };

  cors(corsOptions)(req, res, next);
});

// app.use(cors(corsOptions));

// // Handle preflight OPTIONS requests globally
// app.options("*", cors(corsOptions));

// app.use(cors(corsOptionsDelegate));

// // Handle preflight OPTIONS requests globally
// app.options("*", cors(corsOptionsDelegate));


app.use(rateLimiter);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(function (req, res, next) {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader(
//         "Access-Control-Allow-Methods",
//         "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//     );
//     res.setHeader(
//         "Access-Control-Allow-Headers",
//         "X-Requested-With,content-type"
//     );
//     res.setHeader("Access-Control-Allow-Credentials", true);
//     next();
// });

// app.use((req, res, next) => {
//     const allowedOrigins = ["http://localhost:4011",
//         'https://sdcampus.com', 'https://www.sdcampus.com', 'https://dev.sdcampus.com', 'https://stage.sdcampus.com', 
//         'https://calendar.sdcampus.com', 'https://clerk.sdcampus.com', 'https://accounts.sdcampus.com', 
//         'https://dev.sdpublication.com', 'https://stage.sdpublication.com', 'https://www.sdpublication.com', 
//         'https://dev.sdpublication.com', 'https://stage.sdpublication.com', 'https://www.sdpublication.com', 
//         'https://sdpublication.com', 'https://www.sdcampus.com', 'https://store.sdcampus.com', 
//         'https://dev-cms.sdcampus.com', 'https://cms.sdcampus.com', 'https://dev-twoway-frontend.sdcampus.com', 
//         'https://live-class.sdcampus.com', 'https://sales.sdcampus.com','https://next-sdcampus-website.vercel.app'];
//     const webhookPaths = ["/api/v1/purchase/validityAppResponse", "/api/v1/purchase/validityResponse",
//         "/api/v1/purchase/courseResponse","/api/v1/purchase/courseAppResponse","/api/v1/payment/courseresponse",
//         "/api/v1/payment/response", "/api/v1/payment/courseEmiResponse"];
  
//     if (webhookPaths.includes(req.path)) return next(); // ⬅️ Allow payment callbacks
  
//     const origin = req.headers.origin;
//     const referer = req.headers.referer;
  
//     if (
//       origin && !allowedOrigins.includes(origin) &&
//       referer && !allowedOrigins.some((r) => referer.startsWith(r))
//     ) {
//       return res.status(403).send("Forbidden");
//     }
  
//     next();
//   });

app.use(
    session({
      secret: "thisismysecrctekey",
      saveUninitialized: true,
      resave: false,
    })
  );

// const MONGODB_URI = "mongodb+srv://sdcampusUser:Y47fjIxPP6gcAJgP@cluster0.xxy7xke.mongodb.net/SDCampusDB?retryWrites=true&w=majority";
// const MONGODB_URI = "mongodb+srv://sdProdSDUser:2rg1uZyrssBHxBoF@sdproductioncluster.vemfx.mongodb.net/SDProdDB?retryWrites=true&w=majority"
// const connectionParams = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// };
// mongoose.set('strictQuery', false);
// if (!global._mongooseClient) {
//     global._mongooseClient = mongoose
//         .connect(MONGODB_URI, connectionParams)
//         .then(() => {
//             console.log("Connected to database ");
//         })
//         .catch((err) => {
//             console.error(`Error connecting to the database. \n${err}`);
//         });
// }

mongoose.set('strictQuery', false);
const MONGODB_URI = "mongodb+srv://sdProdSDUser:2rg1uZyrssBHxBoF@sdproductioncluster.vemfx.mongodb.net/SDProdDB?retryWrites=true&w=majority"
const connectionParams = { useNewUrlParser: true, useUnifiedTopology: true };
if (!global._mongooseClient) {
  global._mongooseClient = mongoose.connect(MONGODB_URI, connectionParams)
    .then(() => console.log("Connected to database"))
    .catch(err => console.error(`DB Connection Error: ${err}`));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let users = [], roomViewers = {};
const addUser = (userId, username, socketId) => {
  if (!users.some(user => user.userId === userId))
    users.push({ userId, username, socketId });
};
const getUser = userId => users.find(user => user.userId === userId);
const removeUser = socketId => {
  users = users.filter(user => user.socketId !== socketId);
};

io.on("connection", (socket) => {
    console.warn("New connection:", socket.id);
  
    // Rate limiter per socket
    socket._rateLimit = {};
  
    const checkRateLimit = (eventName, limitMs) => {
      const now = Date.now();
      const last = socket._rateLimit[eventName] || 0;
      if (now - last < limitMs) {
        console.warn(`Rate limit hit for ${eventName} from ${socket.id}`);
        return false;
      }
      socket._rateLimit[eventName] = now;
      return true;
    };
  
    // Cleanup on disconnect
    const cleanup = () => {
      const roomId = socket.roomId;
      if (roomId && roomViewers[roomId]) {
        roomViewers[roomId] = Math.max(roomViewers[roomId] - 1, 0);
        io.to(roomId).emit("viewer-count", roomViewers[roomId]);
      }
      removeUser(socket.id);
      debounceEmitUsers();
      console.warn("Disconnected:", socket.id);
    };
  
    socket.on("create", (roomId) => {
      try {
        socket.join(roomId);
        socket.roomId = roomId;
        roomViewers[roomId] = (roomViewers[roomId] || 0) + 1;
        io.to(roomId).emit("viewer-count", roomViewers[roomId]);
      } catch (err) {
        console.error("Room join failed:", err);
      }
    });
  
    socket.on("leave-room", (roomId) => {
      try {
        socket.leave(roomId);
        if (roomViewers[roomId]) {
          roomViewers[roomId] = Math.max(roomViewers[roomId] - 1, 0);
          io.to(roomId).emit("viewer-count", roomViewers[roomId]);
        }
      } catch (err) {
        console.error("Leave room error:", err);
      }
    });
  
    socket.on("send-message", (message, name, roomId, imgUrl, batchName, batchId) => {
      if (!checkRateLimit("send-message", 300)) return;
      if (message.length > 50) {
        console.warn("Message too long:", message.length);
        return;
      }
      try {
        io.to(roomId).emit("receive-message", message, name, imgUrl, batchName, batchId);
      } catch (err) {
        console.error("Broadcast error:", err);
      }
    });
  
    // Debounced getUsers emitter
    let updateUserTimeout;
    const debounceEmitUsers = () => {
      if (updateUserTimeout) clearTimeout(updateUserTimeout);
      updateUserTimeout = setTimeout(() => {
        io.emit("getUsers", users);
      }, 1000);
    };
  
    socket.on("addUser", (data) => {
      try {
        addUser(data.id, data.username, socket.id);
        debounceEmitUsers();
      } catch (err) {
        console.error("addUser failed:", err);
      }
    });
  
    socket.on("sendMessage", async ({ senderId, receiverId, text, time }) => {
      if (!checkRateLimit("sendMessage", 300)) return;
      if (!text || !senderId || !receiverId) return;
  
      try {
        const newMessage = new privatemessagingmodel({
          to: receiverId,
          from: senderId,
          messageBody: text,
          messageTime: time,
          createdAt: Date.now()
        });
  
        await newMessage.save();
  
        const user = getUser(receiverId);
        if (user?.socketId) {
          io.to(user.socketId).emit("getMessage", { senderId, text });
        }
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });
  
    socket.on("disconnect", cleanup);
    socket.on("error", (err) => {
      console.error("Socket error:", err);
      cleanup();
    });
  });
  

app.get("/api/v1/home", async (req, res) => {
    // const msgData = {
    //     phone: '9983904397',
    //     bodyValues: ['Govind', '0006783', '0006783', '789']
    // }
    // console.log("WP", await CodOrderPlaced(msgData))
    res.send("Welcome to SD Campus api page !");
});
// app.use(
//     session({
//         secret: "thisismysecrctekey",
//         saveUninitialized: true,
//         // cookie: { maxAge: "10" },
//         resave: false,
//     })
// );
// process.setMaxListeners(20);
// app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"],
//     },
// });

// let users = [];
// const addUser = (userId, username, socketId) => {
//     !users.some((user) => user.userId === userId) &&
//         users.push({ userId, username, socketId });
// };
// const getUser = (userId) => {
//     return users.find((user) => user.userId === userId);
// };

// const removeUser = (socketId) => {
//     users = users.filter((user) => user.socketId !== socketId);
// };

// app.get("/api/v1/adminPanel/getMessages", async (req, res) => {
//     const { admin, teacher } = req.query;
//     const mesaagees = await privatemessagingmodel
//         .find({
//             $or: [
//                 { from: admin, to: teacher },
//                 { from: teacher, to: admin },
//             ],
//         })
//         .sort({ createdAt: 1 });
//     res.send({
//         status: true,
//         data: mesaagees,
//         msg: "fetched all the messages",
//     });
// });
// const roomViewers = {};
// // app.get('/dashboard/message', async () => {
// io.on("connection", (socket) => {

//     // count students who are live
    

//     socket.on("create", (roomId) => {
//         socket.join(roomId);
//         socket.roomId = roomId;
//         roomViewers[roomId] = (roomViewers[roomId] || 0) + 1;
//         io.to(roomId).emit("viewer-count", roomViewers[roomId]);
//     });
    

//     socket.on("leave-room", (roomId) => {
//         socket.leave(roomId);
//         roomViewers[roomId] = Math.max((roomViewers[roomId] || 1) - 1, 0);
//         io.to(roomId).emit("viewer-count", roomViewers[roomId]);
//     });

//     socket.on("send-message", (message, name, roomId, imgUrl, batchName, batchId) => {

//         // console.log("Live Chat :", message, "Name :", name, "roomId :", roomId, "Image Url:", imgUrl)
//         io.to(roomId).emit("receive-message", message, name, imgUrl, batchName, batchId);
//     });

//     // console.log(`User Connected: ${socket.id}`);
//     socket.on("addUser", (data) => {
//         addUser(data.id, data.username, socket.id);
//         io.emit("getUsers", users);
//     });
//     socket.on("sendMessage", async ({ senderId, receiverId, text, time }) => {
//         const date = new Date();
//         const newprivateMessageModel = new privatemessagingmodel({
//             to: receiverId,
//             from: senderId,
//             messageBody: text,
//             messageTime: time,
//             // messageTime:formatTime(new Date()),
//             createdAt: date.getTime(),
//         });
//         await newprivateMessageModel.save();
//         const user = getUser(receiverId);
//         if (user) {
//             io.to(user.socketId).emit("getMessage", {
//                 senderId,
//                 text,
//             });
//         } else {
//             // console.log("user offline");
//         }
//     });
//     //when disconnect
//     socket.on("disconnect", () => {

//         const roomId = socket.roomId;

//         if (roomId && roomViewers[roomId]) {
//         roomViewers[roomId] -= 1;
//         if (roomViewers[roomId] < 0) roomViewers[roomId] = 0;

//         io.to(roomId).emit("viewer-count", roomViewers[roomId]);
//         }

//         removeUser(socket.id);
//         io.emit("getUsers", users);
//     });

    // });
// });


const authRouter = require("./routes/userAuthentication");
app.use("/api/v1/authentication/", authRouter);

const StreamingRouter = require("./routes/Streaming");
app.use("/api/v1/Streaming/", StreamingRouter);

const adminTeacher = require("./routes/TeacherAdminSection");
app.use("/api/v1/adminTeacher", adminTeacher);

const AdminPanel = require("./routes/adminPanel");
app.use("/api/v1/adminPanel", AdminPanel);

const WebContains = require("./routes/webContain");
app.use("/api/v1/webContains", WebContains);

const store = require("./routes/store");
app.use("/api/v1/store", store);

const Community = require("./routes/community");
app.use("/api/v1/community", Community);

const { NotificationRoutes } = require("./routes/pushNotificationHelper");
app.use("/api/v1/Notification", NotificationRoutes);

const paymentRouter = require("./routes/razorpay");
const { formatDate, formatTime } = require("./middleware/dateConverter");
app.use("/api/v1/payment", paymentRouter);

const StreamChatRouter = require("./routes/streamChat")
app.use("/api/v1/streamChat", StreamChatRouter)

const liveLecture = require("./routes/liveLecture");
app.use("/api/v1/lecture", liveLecture)

const oms = require("./routes/oms");
app.use("/api/v1/omsguru_api", oms)

const Ebook = require("./routes/ebook");
app.use("/api/v1/Ebook", Ebook)

const parentRoute = require("./routes/parentRoute");
app.use("/api/v1/parent", parentRoute);

const testSeriesRoute = require("./routes/TestSeriesRoute");
app.use('/api/v1/testSeries', testSeriesRoute);

const adminRoute = require("./routes/adminSection");
app.use("/api/v1/adminSection", adminRoute)

const quickLearning = require('./routes/quickLearning');
app.use("/api/v1/learning", quickLearning);

const notification = require("./routes/notification");
// const { sendWhatsappMessage } = require("./HelperFunctions/sendWhatsappMessage");
app.use("/api/v1/notification", notification);

const awsRoutes = require('./routes/awsRoutes');
const { EventEmitter } = require("stream");

const userRoutes = require('./routes/userRoutes.js')
app.use("/api/v1/user", userRoutes);

const paymentRoute = require('./routes/paymentRoute.js')
app.use("/api/v1/purchase", paymentRoute);

const libraryRoute = require("./routes/library.js");
app.use("/api/v1/library", libraryRoute);

const calendarRoute = require("./routes/calendar.js");
app.use("/api/v1/calendar", calendarRoute);
const teleCRMServiceRoute = require("./routes/teleCRMService.js");
app.use("/api/v1/telecrm_service", teleCRMServiceRoute);

const { cronjobs } = require("./routes/cron");
cronjobs()

app.use('/api/v1/aws', awsRoutes);


server.listen(3000, () => {
    console.log("Server Started...");
});
