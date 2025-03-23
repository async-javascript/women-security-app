const express = require("express")
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require("../models/user.models")
const addContacts =require("../models/Add_contact")
const nodemailer = require("nodemailer");
const cors = require("cors")




router.get("/", (req, res) => {
    res.render("login")

})
router.post("/register",
    body('phone').notEmpty().withMessage('Phone number is required')
        .isMobilePhone().withMessage('Invalid phone number'),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 6 characters'),
    body('username').notEmpty().withMessage('Username is required'),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
     
            return res.render('login', { errors: errors.array() })
        }
        const { Fullname, email, username, password, phone } = req.body
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
            Fullname: Fullname,
            email: email,
            username: username,
            password: password,
            phone: phone

        })
        if (errors.isEmpty()) {
     
            return res.render('login', { errors: errors.array() })
        }
    })

// router.get("/login",(req,res)=>{
//     res.render("login")
// })
router.post("/login",   
body('username').trim().isLength({ max: 20 }).notEmpty().withMessage('Username is required'),
body('password').trim().notEmpty().withMessage('Password is required'),

async (req,res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.render('login', { errors: errors.array() })
    }
    const {username,password} = req.body;
    const user = await userModel.findOne({ username: username });
    if (!user) {
        return res.render('login', { errors: [{ msg: 'Invalid username or password' }] });
    }
    const isValidPassword = await userModel.findOne({ password: password });
    if(!isValidPassword){
        return res.render('login', { errors: [{ msg: 'Invalid username or password' }] });
    }
    res.cookie('user', JSON.stringify({
        userid: user._id,
        username: user.username,
        email: user.email
    }), {
        httpOnly: true,  // Can't be accessed via JavaScript
        secure: false,   // Set to true in production (with HTTPS)
        maxAge: 1000 * 60 * 60 * 24 * 365  // 1 year
    });




    res.redirect("/home")
})
router.get("/logout",(req,res)=>{
    res.redirect("/")
})
router.get("/home",(req,res)=>{
    res.render("index")
})
router.get('/popup', async(req, res) => {
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
router.get('/addcontact', (req, res) => {
    const userCookie = req.cookies.user 
    const user = JSON.parse(userCookie);
    console.log(user);
    
    res.render("contactForm")
})
router.post('/addcontact', async (req, res) => {
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
router.get("/contactList",async(req,res)=>{
    const userCookie = req.cookies.user
    const user = JSON.parse(userCookie);
    let finduser = await userModel.findOne({username: user.username})
    let userr = await finduser.populate("contact")

    

    res.render("ContactList",{userr})
})


router.post('/submitPhoneNumbers', (req, res) => {
    const userCookie = req.cookies.user
    const user = JSON.parse(userCookie);
   const {email} = req.body
   
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
    subject: `Women Security  Emergency Message from ${user.username}`,              // Subject of the email
    text: "I am in danger track my location,https://chacha-tracker.onrender.com",                   // Email body
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




module.exports = router;

