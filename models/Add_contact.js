const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema({
   user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',

   },
    usercontact:{
        type:String,
        trim:true,
      

    },
  
 
     email:{
        type:String,
        trim:true,
     }

})
const Addcontacts = mongoose.model("Addcontact",contactSchema)
 
module.exports = Addcontacts;