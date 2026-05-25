const mongoose = require("mongoose");

const OTPSchema =new mongoose.Schema({
    otp:{required:true, type:String},
    email:{required:true, type:String},
    createdAt:{type:Date, default:Date.now, expires:300}
})

const OTPModel= mongoose.model( "otp", OTPSchema)

module.exports= OTPModel