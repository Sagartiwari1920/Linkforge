const shortid=require("shortid");

const shortCode=function shortCode()
{
    return shortid.generate();
}
module.exports=shortCode;