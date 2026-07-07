const redisClient = require("../config/redis");
const User=require("../models/users");
const jwt=require("jsonwebtoken");

const userAuth= async (req,res,next)=>{
    try {
        const {token}= req.cookies;
        if(!token)
            throw new Error("token doesnt exist");
        //checking the blocked token in redis
        const isBlocked=await redisClient.exists(`token:${token}`);
        if(isBlocked)
            throw new Error("token invalid");
        //verifying token validity 
        const payload=jwt.verify(token,process.env.JWT_KEY);//returns payload
        const {_id}=payload;
        if(!_id){
            throw new Error("id is missing");
        }

         const result=await User.findById((_id));
         if(!result)
            throw new Error("user not found");
        req.result=result;
        next()

        
    } catch (err) {
       next(err);
    }
}

module.exports=userAuth;