const express = require("express")
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require("../models/user.models")
const addContacts =require("../models/Add_contact")
const nodemailer = require("nodemailer");
const cors = require("cors")
const axios = require("axios")

const multer = require('multer');
const path = require('path');
const Complaint = require('../models/complaint');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.get("/login",(req,res)=>{
  res.render("login")
})

router.get("/", requireAuth,(req, res) => {
     const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    res.render("index", {
        user: userCookie,
        fullname: userCookie ? userCookie.fullname : 'Guest'
    });

})
router.post("/register",
    body('phone').notEmpty().withMessage('Phone number is required')
        .isMobilePhone().withMessage('Invalid phone number'),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 6 characters'),
    body('username').notEmpty().withMessage('Username is required'),
    body('fullname').notEmpty().withMessage('Full name is required'),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
     
            return res.render('login', { errors: errors.array() })
        }
        const { fullname, email, username, password, phone } = req.body
        console.log(fullname, email, username, password, phone);
        // const hashedPassword = await bcrypt.hash(password, 10);
        const existingUser = await userModel.findOne({
            $or: [
                { username: username },
                { email: email },
                { phone: phone }
            ]
        })
        if (existingUser) {

            if (existingUser.username === username) {
                return res.render('login', { errors: [{ msg: 'Username is already taken' }] });
            }
            if (existingUser.email === email) {
                return res.render('login', { errors: [{ msg: 'Email is already registered' }] });
            }
            if (existingUser.phone === phone) {
                return res.render('login', { errors: [{ msg: 'Phone number is already in use' }] });
            }
        }
        const newUser = await userModel.create({
            fullname: fullname,
            email: email,
            username: username,
            password: password,
            phone: phone

        })
     
        if (errors.isEmpty()) {
     
            return res.render('login', { errors: errors.array() })
        }
    })

// ...existing code...
router.post("/login",   
body('username').trim().isLength({ max: 20 }).notEmpty().withMessage('Username is required'),
body('password').trim().notEmpty().withMessage('Password is required'),

async (req,res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('login', { errors: errors.array() })
    }
    const {username,password} = req.body;
    const newUser = await userModel.findOne({ username: username, password: password });
    if (!newUser) {
        return res.render('login', { errors: [{ msg: 'Invalid username or password' }] });
    }
       res.cookie(
      "user",
      JSON.stringify({
        userid: newUser._id,
        username:newUser.username,
        email:newUser.email,
        fullname:newUser.fullname
       
      
      }),
      {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 365,
      }
    );
    res.redirect("/home")
})

router.get("/home",requireAuth,(req,res)=>{
    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    res.render("index", {
        user: userCookie,
        fullname: userCookie ? userCookie.fullname : 'Guest'
    });
})


router.get('/popup',requireAuth, async(req, res) => {
    const userCookie = req.cookies.user // Retrieve user info from session  
    // console.log("mera", userCookie);
    const user = JSON.parse(userCookie);
    // console.log("apna",user);
    
    const finduser = await userModel.findOne({username: user.username})
    // console.log(finduser);
     if(finduser.contact.length === 0){
        return res.render('popup')
     }else{
        return res.redirect('/contactList')
     }
  
    // if (user) {
    //     // res.send(`Welcome, ${user. username}!`);
    // }
    // if(finduser){
    //     res.send(`home, ${ finduser }`);
    // }
});
router.get('/addcontact',requireAuth, (req, res) => {
    res.render("contactForm")
})
router.post('/addcontact',requireAuth, async (req, res) => {
    const userCookie = req.cookies.user 
    const user = JSON.parse(userCookie);
    let finduser = await userModel.findOne({username: user.username})
    console.log("tera",finduser)
    let {  usercontact,email } = req.body;
    // console.log(usercontact,email)
  let contactData = await addContacts.create({
        user:finduser._id,
        usercontact:usercontact,
        email:email
    })
    finduser.contact.push(contactData._id)
    await finduser.save()
    res.redirect('/popup')
})
router.get("/help",requireAuth,(req,res)=>{
     const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    res.render("help", {
        user: userCookie,
        fullname: userCookie ? userCookie.fullname : 'Guest'
    });
})
router.get("/contactList",requireAuth,async(req,res)=>{
    const userCookie = req.cookies.user
    const user = JSON.parse(userCookie);
    let finduser = await userModel.findOne({username: user.username})
    let userr = await finduser.populate("contact")

    

    res.render("ContactList",{userr})
})
router.get("/logout", (req, res) => {
  res.clearCookie("user"); // Clear the login cookie
  res.redirect("/");       // Redirect to login page
});

router.post('/submitPhoneNumbers',requireAuth, (req, res) => {
    const userCookie = req.cookies.user
    const user = JSON.parse(userCookie);
   const {email} = req.body

   console.log( email,"hhh");
   
   
  // Create the transport object using Gmail's SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true, // true for port 465 (secure connection)
    auth: {
      user: "piu17526@gmail.com",  // Your Gmail address
      pass: "lvkheosfzzqregtm",    // Your Gmail app password
    },
  });

  // Define the email data
  const receiver = {
    from: "piu17526@gmail.com",           // Sender email address
    to: email,  // Recipient email address
    subject: `Women Security  Emergency Message from ${user.fullname}`,              // Subject of the email
    text: "I am in danger track my location,https://realtime-tracker-5.onrender.com",                   // Email body
  };

  // Send the email using the transporter
  transporter.sendMail(receiver, (error, emailResponse) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).send("Error sending email.");
    }

    console.log("Email sent successfully:", emailResponse);

    
  });
});



router.get("/complaint",requireAuth,async(req,res)=>{
         
               const userCookie = req.cookies.user;
        const user = JSON.parse(userCookie);
  let finduser = await userModel.findOne({username: user.username})
  
    res.render("complaint",{finduser})
})
router.post('/complaints',requireAuth, upload.array('evidenceFiles', 10), async (req, res) => {
    try {
        const userCookie = req.cookies.user;
        const user = JSON.parse(userCookie);
  let finduser = await userModel.findOne({username: user.username})
        const data = req.body;

        const complaintdata = await Complaint.create({
            user: finduser._id, // Associate with the logged-in user
            incidentType: data.incidentType,
            urgencyLevel: data.urgencyLevel,
            incidentDate: data.incidentDate,
            incidentTime: data.incidentTime,
            incidentLocation: data.incidentLocation,
            incidentDescription: data.incidentDescription,
            suspectDescription: data.suspectDescription,
            witnessesPresent: data.witnessesPresent === 'on',
            witnessInfo: data.witnessInfo,
            reportAnonymously: data.reportAnonymously === 'on',
            reporterName: data.reporterName,
            reporterPhone: data.reporterPhone,
            reporterEmail: data.reporterEmail,
            contactPreference: data.contactPreference,
            policeReported: data.policeReported === 'on',
            policeReportNumber: data.policeReportNumber,
            evidenceFiles: req.files.map(file => file.path)
        });
 finduser.complaint.push(complaintdata._id)
        await finduser.save();

        res.json({ success: true, referenceId: complaintdata._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


router.get('/nearplaces',requireAuth, async (req, res) => {
  const { lat, lng, type } = req.query;
  console.log(lat, lng, type);
  if (!lat || !lng || !type) {
    return res.json({ results: [], error: 'Missing parameters.' });
  }

  try {
    const response = await axios.get('https://maps.gomaps.pro/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: 2000,
        type: type.toLowerCase().replace(/station/g, '').trim(),
        key: process.env.GOMAPS_API_KEY
      }
    });

    const results = response.data.results || [];
    res.json({ results });
  } catch (err) {
    console.error('GoMaps API error:', err.message);
    res.json({ results: [], error: 'Error fetching data from GoMaps API.' });
  }
});

router.get('/map',requireAuth, (req, res) => {
  res.render('map');  // Just render the page
});

router.get('/leaflet',requireAuth, (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.send("Missing destination coordinates.");
  res.render('leaflet', { lat, lng });
});

// Nodemailer setup - replace with your Gmail + App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'piu17526@gmail.com',
    pass: 'lvkheosfzzqregtm' // <-- Use Gmail App Password here
  }
});

function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: 'piu17526@gmail.com',
    to,
    subject: 'Your OTP Code',
    html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`
  };
  return transporter.sendMail(mailOptions);
}
const otps = {};
router.get('/forgot-password', (req, res) => {
  res.render('Forget', { message: null, success: null });
});

router.post('/forgot-password', async (req, res) => {
const email = req.body.email?.trim();
    const finduser = await userModel.findOne({ email: email });
    console.log(finduser)
     if (!finduser) {
    return res.render('Forget', { message: 'Entered your Registered email.', success: false });
  }
  if (!email) {
    return res.render('Forget', { message: 'Please enter your email.', success: false });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP with expiration (5 minutes)
  otps[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
  req.session.email = email;

  try {
    await sendOtpEmail(email, otp);
    res.redirect('/otp');
  } catch (error) {
    console.error(error);
    res.render('Forget', { message: 'Failed to send OTP. Please try again.', success: false });
  }
});
router.get('/otp', (req, res) => {
  if (!req.session.email) return res.redirect('/forgot-password');
  res.render('otp', { message: null, success: null });
});

router.post('/verify-otp', (req, res) => {
  const { otp } = req.body;
  const email = req.session.email;

  if (!email || !otps[email]) {
    return res.redirect('/forgot-password');
  }

  if (Date.now() > otps[email].expires) {
    delete otps[email];
    return res.render('otp', { message: 'OTP expired. Please request again.', success: false });
  }

  if (otp === otps[email].otp) {
    delete otps[email];
    // OTP verified, redirect to reset password page or success page
    res.render('Reset', { message: null, success: null });
  } else {
    res.render('otp', { message: 'Invalid OTP. Please try again.', success: false });
  }
});
router.get('/resend-otp', async (req, res) => {
  const email = req.session.email;
  if (!email) return res.redirect('/forgot-password');

  // Generate new OTP and resend
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendOtpEmail(email, otp);
    res.render('otp', { message: 'OTP resent successfully.', success: true });
  } catch (error) {
    console.error(error);
    res.render('otp', { message: 'Failed to resend OTP.', success: false });
  }
});
// GET reset password page (only if user passed OTP verification)
router.get('/reset', (req, res) => {
  if (!req.session.emailVerified) {
    return res.redirect('/forgot-password');
  }
  res.render('Reset', { message: null, success: null });
});

// POST reset password form submission
router.post('/reset', async (req, res) => {
  if (!req.session.email) {
    return res.redirect('/forgot-password');
  }

  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.render('reset', { message: 'Please fill all fields.', success: false });
  }

  if (password.length <=4) {
    return res.render('reset', { message: 'Passwords must be 5 char long.', success: false });
  }
  if (password !== confirmPassword) {``
    return res.render('reset', { message: 'Passwords do not match.', success: false });
  }

  try {
    const updatedUser = await userModel.findOneAndUpdate(
      { email: req.session.email },           
      { password: password },                
      { new: true }                           
    );

    if (!updatedUser) {
      return res.render('reset', { message: 'User not found.', success: false });
    }

    req.session.destroy(); 
    res.render('Forget', { message: 'Password reset successful! You can now login.', success: true });

  } catch (error) {
    console.error("Error updating password:", error);
    res.render('reset', { message: 'Something went wrong.', success: false });
  }
});
router.get("/delete-contact/:id",requireAuth, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userCookie = req.cookies.user;
    const user = JSON.parse(userCookie);
    const finduser = await userModel.findOne({ username: user.username });

    finduser.contact.pull(contactId);
    await finduser.save();
    await addContacts.findByIdAndDelete(contactId);

    if (finduser.contact.length === 0) {
      return res.render("contactForm"); // prevents double redirect
    }

    return res.redirect("/contactList"); // default redirect
  } catch (error) {
    console.error("Error deleting contact:", error);
    return res.status(500).send("Something went wrong.");
  }
});


router.get("/searchContactList",requireAuth, async (req, res) => {
    const userCookie = req.cookies.user;
    const user = JSON.parse(userCookie);
    const searchQuery = req.query.search || "";
      console.log(searchQuery)
    const finduser = await userModel.findOne({ username: user.username }).populate("contact");
    
    let filteredContacts = finduser.contact;
    if (searchQuery) {
        const regex = new RegExp(searchQuery, "i");
        filteredContacts = filteredContacts.filter(contact =>
            regex.test(contact.usercontact) || regex.test(contact.email)
        );
    } 
  

    res.render("searchContactList", { userr: { ...finduser.toObject(), contact: filteredContacts } ,searchQuery: searchQuery});
});
function requireAuth(req, res, next) {
  const userCookie = req.cookies.user;
  if (!userCookie) {
    return res.redirect('/login');
  }

  try {
    req.user = JSON.parse(userCookie); // Save parsed user for use in routes
    next();
  } catch (err) {
    return res.redirect('/login');
  }
}

module.exports = router;

