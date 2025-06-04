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
app.use(cors())

// Set EJS as the view engine
app.set("view engine", "ejs");

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));


// Static files middleware (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (important to add this before your routes)
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret in production
  resave: false,             // Don't save session if unmodified
  saveUninitialized: true,   // Save new sessions
  cookie: {
    secure: false,           // Set to true if using HTTPS (production)
    maxAge: 1000 * 60 * 30  // Session expiration: 30 minutes
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
