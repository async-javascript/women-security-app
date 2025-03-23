const express = require('express');
const userRouter = require("./routes/index");
const session = require('express-session');
const dotenv = require('dotenv');
const path = require("path");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const flash = require('connect-flash');
dotenv.config();

const connectToDb = require("./config/db");
connectToDb();


const app = express();
app.use(cors({
  origin: "*"
}))

// Set EJS as the view engine
app.set("view engine", "ejs");

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (important to add this before your routes)
app.use(session({
  secret: 'yourSecretKey',  // Use a strong secret key here
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,  // Helps prevent XSS attacks
    secure: false,   // Set to true in production (HTTPS)
    maxAge: 1000 * 60 * 60 * 24 * 365  // Session expiration in 1 day
  }
}));

// Middleware for parsing cookies
app.use(cookieParser());

// Flash middleware (for passing messages between requests)
app.use(flash());

// Routes middleware (should be after session, cookie-parser, and flash)
app.use("/", userRouter);

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
