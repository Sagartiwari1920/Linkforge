const { createShortUrl, allData ,redirectToOriginal} = require("../controller/urlController");
const express = require("express");
const urlRouter = express.Router();
const UrlValidator = require("../middleware/validateUrl");
const userAuth=require("../middleware/userAuth");

urlRouter.post("/shorten", UrlValidator,userAuth, createShortUrl);

urlRouter.get("/analytics",userAuth, allData);



module.exports = urlRouter;