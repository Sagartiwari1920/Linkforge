const express=require("express");
const authRouter=express.Router();
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const User=require("../models/users");
const redisClient = require("../config/redis");
const crypto = require("crypto");
const mailer = require("../config/emailSender");

const register = async (req, res, next) => {
  try {
    const { name, age, gender, emailId, password } = req.body;

    // Check if already registered
    const existingUser = await User.findOne({ emailId });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // Generate OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Hash password before temporarily storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store pending registration data in Redis
    await redisClient.set(
      `register:${emailId}`,
      JSON.stringify({
        name,
        age,
        gender,
        emailId,
        password: hashedPassword,
        otp
      })
    );

    // Expire after 5 minutes
    await redisClient.expire(
      `register:${emailId}`,
      300
    );

    // Send OTP
    // Send OTP
    try {
      await mailer.sendMail({
        to: emailId,
        subject: "Verify your email",
        text: `Your verification OTP is ${otp}. It expires in 5 minutes.`
      });
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
      await redisClient.del(`register:${emailId}`);

      return res.status(500).json({
        message: "Failed to send OTP"
      });
    }

    return res.status(200).json({
      message: "OTP sent to your email"
    });

  } catch (err) {
    next(err);
  }
};

const verifyRegisterOtp = async (req, res, next) => {
  try {
    const { emailId, otp } = req.body;

    // Get pending registration
    const data = await redisClient.get(
      `register:${emailId}`
    );

    if (!data) {
      return res.status(400).json({
        message: "OTP expired or registration not found"
      });
    }

    const pendingUser = JSON.parse(data);

    // Check OTP
    if (pendingUser.otp !== String(otp)) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // Remove OTP before storing in MongoDB
    const {
      otp: storedOtp,
      ...userData
    } = pendingUser;

    // Create verified user
    await User.create(userData);

    // Delete pending data
    await redisClient.del(
      `register:${emailId}`
    );

    return res.status(201).json({
      message: "Email verified and user registered successfully"
    });

  } catch (err) {
    next(err);
  }
};

const login=async(req,res,next)=>{
  try{
        const people = await User.findOne({ emailId: req.body.emailId });
        if (!people) throw new Error("Invalid credential");
        const password=req.body.password;
        if(!password)
          throw new Error("Enter password!");
        const isAllowed = await bcrypt.compare(password, people.password);
        if (!isAllowed) throw new Error("Invalid credential");   

      //we also send a jw token as soon as the user logged in 
      //we send the jw token by puting it in cookie

      //generation of jwt 
      const token= jwt.sign({_id : people.id,emailId:people.emailId},process.env.JWT_KEY,{expiresIn:700}); //format=jwt.sign({payload},"key");
      res.cookie("token", token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  maxAge: 700 * 1000
                    }); //("nameOfToken(as your wish",actual generated token);

      res.send("Login successfully");
      
      
      }
  catch(err){
    next(err);
  }
}

const logout=async(req,res,next)=>{
  try {
//puting the blocked tokens into redis
   const {token}=req.cookies; 
    await redisClient.set(`token:${token}`,"blocked")   //(key,value);

//we remove the blocked token from redis also as soon as that token expires because after expiry that token is no longer usefull
   const payload=jwt.decode(token);//it returns payload with creation and expiry time in  seconds(iat(creation),exp(expiry time )) both iat and exp are calculated from 1 january 1970 in seconds
   await redisClient.expireAt(`token:${token}`,payload.exp)//it removes the token from redis after payload.exp seconds after 1 jan 1970

    res.cookie("token",null,{expires:new Date(Date.now())}); //jo jwt pahle tha use badal kar null send kar diya ab o user pahle login tha vo api req nhi maar payega matlab logout ho gya
         res.send("logout successfully");
    
  } catch (err) {
    next(err);
  } 
}


module.exports={verifyRegisterOtp,register,login,logout}