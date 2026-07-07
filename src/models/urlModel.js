const mongoose=require("mongoose");
const {Schema}=mongoose;
const urlSchema=new Schema({
    originalUrl:{
        type:String,
        required:true
    },
    shortCode:{
        type:String,
        unique:true,
        required:true
    },
    clicks:{
        type:Number,
        default:0
    },
    userId: { 
        type: Schema.Types.ObjectId,
        ref: "User" }
},{timestamps:true})

const  Url=mongoose.model("Url",urlSchema);
 module.exports=Url;