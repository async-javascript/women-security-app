const mongoose = require("mongoose")

function connectToDb(){
    mongoose.connect("mongodb://127.0.0.1:27017/WomenSecurity")
    .then(() => console.log("Connected to MongoDB"))
}

module.exports = connectToDb