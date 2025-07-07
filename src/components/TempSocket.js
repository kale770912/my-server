// // Socket.js
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// // Create HTTP server
// const server = http.createServer(app);

// // Initialize Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // Log when client connects
// io.on("connection", (socket) => {
//   console.log(`🔌 Client connected: ${socket.id}`);

//   // Handle client joining a room
//   socket.on("joinRoom", (room) => {
//     const clients = io.sockets.adapter.rooms.get(room);
//     const numClients = clients ? clients.size : 0;

//     console.log(
//       `📥 ${socket.id} attempting to join room: ${room} (${numClients} in room)`
//     );

//     if (numClients === 0) {
//       socket.join(room);
//       socket.emit("created");
//       console.log(`✅ Room ${room} created by ${socket.id}`);
//     } else if (numClients === 1) {
//       socket.join(room);
//       socket.emit("joined");
//       socket.to(room).emit("ready");
//       console.log(`👥 ${socket.id} joined room ${room}`);
//     } else {
//       socket.emit("full");
//       console.log(`❌ Room ${room} is full`);
//     }

//     // Forward signaling messages
//     socket.on("offer", (data) => {
//       socket.to(data.room).emit("offer", data.sdp);
//       console.log(`📤 Offer from ${socket.id} to room ${data.room}`);
//     });

//     socket.on("answer", (data) => {
//       socket.to(data.room).emit("answer", data.sdp);
//       console.log(`📤 Answer from ${socket.id} to room ${data.room}`);
//     });

//     socket.on("candidate", (data) => {
//       socket.to(data.room).emit("candidate", {
//         label: data.label,
//         id: data.id,
//         candidate: data.candidate,
//       });
//       console.log(`📤 Candidate from ${socket.id} to room ${data.room}`);
//     });

//     // Handle disconnect
//     socket.on("disconnect", () => {
//       console.log(`❎ Client disconnected: ${socket.id}`);
//       socket.broadcast.emit("userDisconnected");
//     });
//   });
// });

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.status(200).send("OK");
// });

// // Start server
// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`🚀 Signaling server running on http://<YOUR-IP>:${PORT}`);
// });

// socket.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

let broadcaster;

io.on("connection", (socket) => {
  console.log(`🔌 New socket connected: ${socket.id}`);

  socket.on("joinRoom", (room) => {
    socket.join(room);

    if (!broadcaster) {
      broadcaster = socket.id;
      socket.emit("viewer"); // You are broadcaster
      console.log(`🎥 Broadcaster: ${socket.id}`);
    } else {
      socket.emit("broadcaster"); // You are viewer
      io.to(broadcaster).emit("watcher", socket.id);
    }

    socket.on("offer", (id, message) => {
      io.to(id).emit("offer", socket.id, message);
    });

    socket.on("answer", (id, message) => {
      io.to(id).emit("answer", socket.id, message);
    });

    socket.on("candidate", (id, message) => {
      io.to(id).emit("candidate", socket.id, message);
    });

    socket.on("disconnect", () => {
      console.log(`❎ Disconnected: ${socket.id}`);
      socket.broadcast.emit("disconnectPeer", socket.id);
      if (socket.id === broadcaster) broadcaster = null;
    });
  });
});

server.listen(3001, () => {
  console.log("🚀 Signaling server running on http://10.10.40.79:3001");
});
