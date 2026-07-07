require("dotenv").config();
const path = require("path");
const express = require("express");
const connectDB = require("./src/config/database");
const errorHandler = require("./src/middleware/errorHandler");
const UrlValidator = require("./src/middleware/validateUrl");
const authRouter=require("./src/routes/authRoutes");
const urlRouter=require("./src/routes/urlRoutes");
const redisClient=require("./src/config/redis");
const app = express();
const cookieParser = require("cookie-parser");
const {redirectToOriginal}=require("./src/controller/urlController");

app.use(cookieParser());

app.use(express.json());

//connection with public
app.use(express.static(path.join(__dirname, "public")));

//Routing
app.use("/auth",authRouter);

app.use("/url",urlRouter);

app.get("/:shortCode",redirectToOriginal);


app.use(errorHandler);


///making connections
const PORT = process.env.PORT || 5000;
async function connections()
{
  try{

  //redis
  await redisClient.connect();
  console.log("connected to redis");

  //database 
  await connectDB();
  console.log("Connected to database");

  //server start
  app.listen(PORT,()=>{
    console.log("listening at 5000 port");
  })
}
  catch(err){
    console.log("Error " + err);
  }
}

connections();


