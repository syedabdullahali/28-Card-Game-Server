const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 
    friend: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("friend", roomSchema);