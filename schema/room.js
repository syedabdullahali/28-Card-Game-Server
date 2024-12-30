const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  userId: { type: String },
  socketId: { type: String },
  online: { type: Boolean },
  hand: [{ type: String }],
  score: { type: Number, default: 0 },
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String },
  playerLimit: Number,
  players: [playerSchema],
  deck: [{ type: String }],
  gameStarted: { type: Boolean, default: false },
  winner: { type: String },
  gameEnded: { type: Boolean, default: false },
},
);

module.exports = mongoose.model("Room", roomSchema);
