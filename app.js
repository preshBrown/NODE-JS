// Imported Packages & Tools 
const path = require("path");
// const fs = require('fs');
// const https = require('https');
const express = require("express");
const bodyParser = require("body-parser");

// Imported Error Controllers
const errorController = require("./controllers/error");

// mongooseConnect
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
// console.log(`ENV=${process.env.NODE_ENV}`);
// console.log(process.env.NODE_ENV);
// `mongodb+srv://presh:professional19@cluster0.aef170i.mongodb.net/mongooseShop`;
const MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.aef170i.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
// console.log(app.get('env'));
// console.log(process.env);
const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: "sessions",
});
const csrfProtection = csrf();

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`DESTINATION WORKS--`);
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    console.log(`FILE-NAME WORKS--`);
    // cb(null, new Date().toISOString() + '-' + file.originalname);
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Template Engine SetUp
app.set("view engine", "ejs");
app.set("views", "views");

// Models
const User = require("./models/user");

// Imported Routes Body
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const { createPrivateKey } = require("crypto");

app.use(helmet());
app.use(compression());

app.use(bodyParser.urlencoded({ extended: false }));
// app.use( multer({ dest: "./images", fileFilter: fileFilter }).single('image'));
app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
// "/images",
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//MIDDLEWARE
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  console.log(`SUBMITCHECK ERR(APP.js)-${error}`);
  res.status(500).render("500", {
    pageTitle: "ERROR",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URL)
  .then((result) => {
    app.listen(process.env.PORT || 3000);
    // https.createServer({key: privateKey, cert: certificate}, app)
    // .listen(process.env.PORT || 3000);
    console.log("CONNECTED");
  })
  .catch((err) => console.log(` DB-SERVER-DOWN..${err}`));

// mongodb+srv://presh:<password>@cluster0.aef170i.mongodb.net/?retryWrites=true&w=majority
// mongodb+srv://presh:<password>@cluster0.aef170i.mongodb.net/?retryWrites=true&w=majority
// mongodb+srv://presh:professional19@cluster0.aef170i.mongodb.net/shop?retryWrites=true&w=majority
