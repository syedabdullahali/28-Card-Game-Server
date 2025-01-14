const mongoose = require("mongoose");


const userModel = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
    },
    password: {
      type: String,
    },
  
    otp: {
      type: Number,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("user", userModel);
module.exports = User;
