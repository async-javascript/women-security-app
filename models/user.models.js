const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    Fullname:{
        type:String,
        required:true,
        trim:true,

    },
    username:{
        type:String,
        required:true,
        trim:true,
        unique:true

    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minLength:[5,'password must be 8 char long']
    },
     phone:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        minLength:[10,'Enter correct phone number']
     },
     contact:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Addcontact'
     }]
     

})
const user = mongoose.model("user",userSchema)
 
module.exports = user;