const express = require("express");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Health Check
app.get("/", (req, res) => {
  res.status(200).send("🚀 CodeSync Server is running smoothly!");
});

// ✅ JDoodle Config
const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  c: { versionIndex: "4" },
  sql: { versionIndex: "3" },
  javascript: { versionIndex: "3" },
};

// ✅ Compile API
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

// ✅ Socket.io setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const userSocketMap = {};
const roomLanguageMap = {}; // Track current language per room
const roomCodeMap = {}; // Track current code per room

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
  }));
};

io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  /** ✅ JOIN ROOM **/
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    if (!username) username = "Anonymous";
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    // ✅ If no state exists for this room, initialize it
    if (!roomLanguageMap[roomId]) roomLanguageMap[roomId] = "python3";
    if (!roomCodeMap[roomId]) roomCodeMap[roomId] = `# Your Python code here\nprint("Hello, CodeSync!")`;

    const clients = getAllConnectedClients(roomId);

    // ✅ Send joined info + current language and code
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
        language: roomLanguageMap[roomId],
        code: roomCodeMap[roomId],
      });
    });
  });

  /** ✅ CODE CHANGE **/
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    roomCodeMap[roomId] = code; // ✅ Update the latest code in memory
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  /** ✅ LANGUAGE CHANGE **/
  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language, code }) => {
    roomLanguageMap[roomId] = language; // ✅ Update room language
    roomCodeMap[roomId] = code; // ✅ Reset code for new language
    socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language, code });
  });

  /** ✅ SYNC CODE for new user **/
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  /** ✅ TOGGLE BOT **/
  socket.on(ACTIONS.TOGGLE_BOT, ({ roomId, isBotOpen }) => {
    socket.in(roomId).emit(ACTIONS.TOGGLE_BOT, { isBotOpen });
  });

  /** ✅ DISCONNECT **/
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

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
