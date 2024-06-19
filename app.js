const cluster = require("cluster");
const os = require("os");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userBooking = require("./routes/booking");
const picnicPlan = require("./routes/plan");
const payment = require("./routes/payment");
const coupon = require("./routes/coupon");
const qrCode = require("./services/qrCode");
const generateqr = require("./services/qrCode");
const admin = require("./routes/admin");
const logger = require("logger-npm-package-softtech");
const limiter = require("./middlewares/rateLimiter");
require("dotenv").config();

//SSL Part Start//
const https = require("node:https");
const fs = require("node:fs");
const privateKey = __dirname + "/ssl_key/privkey.pem";
const fullChainKey = __dirname + "/ssl_key/fullchain.pem";

//SSL Part end

const Port = process.env.PORT || 8000;

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking for ${numCPUs} CPUs`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new worker...`);
    cluster.fork();
  });
} else {
  // Worker processes
  const app = express();

  // app.use(logger.newLogMiddleware);

  // Database connection...
  mongoose
    .connect(process.env.MONGODB_URL, {})
    .then(() => console.log("Database Connection Success!"))
    .catch((error) => console.error("DB Connection Failed! |", error));

  // Middlewares
  app.use(limiter);

  app.use(cors());
  // Parse URL-encoded bodies (form data)
  app.use(bodyParser.urlencoded({ extended: true }));

  // Parse JSON bodies (if needed)
  app.use(express.json());

  

  // Routes...

  app.use("/api", userBooking);
  app.use("/api", picnicPlan);
  app.use("/api", coupon);
  app.use("/api", admin);
  app.use("/api/payment", payment);
  app.use("/api/generateqr", generateqr);

// ========================================================

// // ssl code start
const options = {
    key: fs.readFileSync(privateKey),
    cert: fs.readFileSync(fullChainKey),
    // key: fs.readFileSync("/etc/letsencrypt/live/bhartitextile.com/privkey.pem"),
    // cert: fs.readFileSync("/etc/letsencrypt/live/bhartitextile.com/fullchain.pem")
  };

  https
    .createServer(options, (req, res) => {
      res.writeHead(200);
      res.end("hello world\n");
    })
    .listen(447);
  // //SSL Part END//

  // //ssl listen port and application port  start
  const server = https.createServer(options, app);

//   server.listen(Port, () => {
//     console.log(`Server is listening on port ${Port}`);
//   });
  // ssl listen port and application port  end

// =======================================================


  // server Running...

  app.listen(Port, () =>
    console.log(`SERVER RUNNING ON :: http://localhost:${Port}`)
  );
}
