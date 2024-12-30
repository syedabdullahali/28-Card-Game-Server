const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const Room = require("./schema/room");
const http = require("http");
const { Server } = require("socket.io");
const rootEndPoint = require("./config/endpoint");
const app = express();
const databaseConnect = require("./config/database");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.use(bodyParser.json());
databaseConnect();

const userRoute = require("./router/userRoute");
const roomRoute = require("./router/roomRoute");
const routes = [
  {
    path: `${rootEndPoint}/user/`,
    func: userRoute,
  },
  {
    path: `${rootEndPoint}/room/`,
    func: roomRoute,
  },
];

routes.forEach(({ path, func }) => {
  app.use(path, func);
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
const createDeck = () => {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  const deck = [];
  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push(`${value} of ${suit}`);
    });
  });
  return shuffle(deck);
};
const dealCards = async (room) => {
  const deck = createDeck();
  const cardsPerPlayer = Math.floor(deck.length / room.playerLimit);
  room.players.forEach((player, index) => {
    player.hand = deck.splice(0, cardsPerPlayer);
  });
  room.deck = deck;
  room.gameStarted = true;
  await room.save();
};
const onlineUsers = {};  
const turnIndices = {};  
const queue = [];  
const countdowns = {};  
const  startGameCountdown=async(roomId)=> {
  if (countdowns[roomId]) {
      clearTimeout(countdowns[roomId]);
  }

  countdowns[roomId] = setTimeout(async () => {
      const room = await Room.findOne({ roomId });
      if (room && room.players.length === room.playerLimit) {
          await dealCards(room);
          io.to(roomId).emit('start-game', room.players);
      } else {
          io.to(roomId).emit('error', 'Not enough players to start the game');
      }
  }, 20000); 
}
const matchPlayers=()=> {
  while (queue.length >= 4) { 
      const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
      const playerLimit = 4;  
      const roomPlayers = queue.splice(0, playerLimit);

      const newRoom = new Room({
          roomId,
          playerLimit,
          players: roomPlayers.map(userId => ({
              userId,
              socketId: null,
              online: true
          })),
      });

      newRoom.save();

      roomPlayers.forEach(userId => {
          const socketId = onlineUsers[userId];
          if (socketId) {
              io.to(socketId).emit('matched', { roomId });
              io.sockets.sockets.get(socketId).join(roomId);
          }
      });

      startGameCountdown(roomId);
  }
}
io.on('connection', (socket) => {

  console.log('New client connected:', socket.id);

  socket.on('play-online', ({ userId }) => {
      onlineUsers[userId] = socket.id;
      console.log("userId",userId);
      queue.push(userId);
      console.log("user in Ques>>",queue);
      matchPlayers();  
  });

  socket.on('join-room', async ({ roomId, userId }) => {
      const room = await Room.findOne({ roomId });

      if (!room) {
          socket.emit('error', 'Room not found');
          return;
      }

      if (room.gameEnded) {
          socket.emit('error', 'Room is closed');
          return;
      }

      room.players = room.players.map(player => 
          player.userId === userId ? { ...player, socketId: socket.id, online: true } : player
      );
      await room.save();

      socket.join(roomId);
      onlineUsers[userId] = socket.id;

      if (!turnIndices[roomId]) {
          turnIndices[roomId] = 0;
      }

      io.to(roomId).emit('update-room', { players: room.players, onlineUsers: onlineUsers[roomId], currentTurn: turnIndices[roomId] });
      
      const playersOnline = room.players.filter(p => p.online).length;
      if (playersOnline === room.playerLimit) {
          startGameCountdown(roomId);
      }
  });

  socket.on('play-card', async ({ roomId, card }) => {
      const room = await Room.findOne({ roomId });
      const player = room.players.find(p => p.socketId === socket.id);

      if (turnIndices[roomId] !== room.players.findIndex(p => p.socketId === socket.id)) {
          socket.emit('error', 'Not your turn');
          return;
      }

      const cardIndex = player.hand.indexOf(card);
      if (cardIndex === -1) {
          socket.emit('error', 'Card not in hand');
          return;
      }

      player.hand.splice(cardIndex, 1);

      if (player.hand.length === 0) {
          room.winner = player.userId;
          room.gameEnded = true;
          await room.save();
          io.to(roomId).emit('game-over', { winner: player.userId });
          return;
      }

      turnIndices[roomId] = (turnIndices[roomId] + 1) % room.playerLimit;
      await room.save();

      io.to(roomId).emit('update-room', { players: room.players, currentTurn: turnIndices[roomId] });
  });

  socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);

      for (const roomId in onlineUsers) {
          const userId = Object.keys(onlineUsers).find(id => onlineUsers[id] === socket.id);
          if (!userId) continue;

          delete onlineUsers[userId];

          const room = await Room.findOne({ roomId });
          if (room) {
              room.players = room.players.map(player => 
                  player.userId === userId ? { ...player, online: false } : player
              );

              const onlineCount = room.players.filter(player => player.online).length;
              if (onlineCount < room.playerLimit && !room.gameStarted) {
                  clearTimeout(countdowns[roomId]);
                  io.to(roomId).emit('error', 'A player disconnected. Waiting for a new player.');
                  matchPlayers();
              } else if (room.gameStarted) {
                  player.hand = [];
                  io.to(roomId).emit('player-quit', { loser: player.userId });
              }

              await room.save();
              io.to(roomId).emit('update-room', { players: room.players, onlineUsers: onlineUsers[roomId], currentTurn: turnIndices[roomId] });
          }
      }
  });
});
