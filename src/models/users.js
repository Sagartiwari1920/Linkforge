const mongoose = require("mongoose");
const {Schema} = mongoose;

/////VALIDATION/////////////
const userSchema = new Schema({//to apply validation we have to write our schema like this
    name: {
      type:String,

      required : true //user must enter this field
    },

    age: {
      type : Number,
      min:18,//if age is less than 18 then user will not be allowed to enter into database
      max:70,//if age is greater than 70 then user will not be allowed to enter into database
     required : true
    },

    gender:{
      type:String,
      enum:["Male","Female","Others"]
    },

    emailId: {
      type:String,
      required:true,
      unique:true,
      trim:true, 
      lowercase:true
    },

    password: {
      type:String,
      required : true
    }
  });


  //creating collection  // mongoDb will create a collection in database with the name (plural lowercase of your model name i.e. users)
  const User = mongoose.model("User", userSchema);  

  module.exports=User;