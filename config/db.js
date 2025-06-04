const mongoose = require("mongoose")

function connectToDb(){
     mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
}

module.exports = connectToDb