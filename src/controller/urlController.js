const generateShortCode =require("../utils/shortCodeGenerator")
const QRCode = require("qrcode");
const Url=require("../models/urlModel")

const createShortUrl = async (req, res, next) => {
    try {
        const { originalUrl } = req.body;
        const userId = req.result._id;  

        const present = await Url.findOne({ originalUrl, userId });   
        if (present) {
            const shortenedUrl = `${process.env.BASE_URL}/${present.shortCode}`;
            const qrCode = await QRCode.toDataURL(shortenedUrl);
            return res.status(200).json({
                success: true,
                alreadyPresent: true,
                shortenedUrl,
                qrCode
            })
        }

        const shortCode = generateShortCode();
        const url = await Url.create({
            originalUrl,
            shortCode,
            userId              
        })

        const shortenedUrl = `${process.env.BASE_URL}/${url.shortCode}`;
        const qrCode = await QRCode.toDataURL(shortenedUrl);

        return res.status(201).json({
            success: true,
            shortenedUrl,
            qrCode
        })
    }
    catch (err) {
        next(err);
    }
}


const redirectToOriginal=async (req,res,next)=>{
  try{
        const {shortCode}=req.params;
        const original=await Url.findOne({shortCode});
       if (!original) {
    return res.status(404).json({
        success: false,
        message: "Short URL not found"
    });
}
       
   await Url.findOneAndUpdate(
    { shortCode },
    { $inc: { clicks: 1 } }
);

return res.redirect(original.originalUrl);

  }
  catch(err){
    next(err);
  }
}

const allData = async (req, res, next) => {
    try {
        const userId = req.result._id;              
        const allInfo = await Url.find({ userId });   
        return res.status(200).json({
            success: true,
            totalUrls: allInfo.length,
            data: allInfo
        })
    }
    catch (err) {
        next(err);
    }
}



module.exports={createShortUrl,redirectToOriginal,allData};