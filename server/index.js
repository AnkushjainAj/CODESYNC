const express = require("express");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.status(200).send("🚀 CodeSync Server is running smoothly!");
});

// ✅ Language Config
const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  c: { versionIndex: "4" },
  sql: { versionIndex: "3" },
  javascript: { versionIndex: "3" },
};

// ✅ JDoodle Compile API
app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  if (!languageConfig[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const jdoodleLang = language === "javascript" ? "nodejs" : language;

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: jdoodleLang,
      versionIndex: languageConfig[language].versionIndex,
      clientId: process.env.jDoodle_clientId,
      clientSecret: process.env.kDoodle_clientSecret,
    });

    res.json(response.data);
  } catch (err) {
    console.error("Compile error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to compile code" });
  }
});

// ✅ Socket.io Setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
  }));
};

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) =>
      io.to(socketId).emit(ACTIONS.JOINED, { clients, username, socketId: socket.id })
    );
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.BOT_TOGGLE, ({ roomId, isBotOpen }) => {
    socket.in(roomId).emit(ACTIONS.BOT_TOGGLE, { isBotOpen });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
