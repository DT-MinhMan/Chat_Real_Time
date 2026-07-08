//Cấu hình cho socket.io 
import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";
import { registerCallHandlers } from "./handlers/callSocketHandler.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

//Dùng một danh sách onlineUser để đánh dấu user online
const onlineUsers = new Map(); // { userId: Set<socketId> }

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

io.on("connection", async (socket) => {
  const user = socket.user;

  // console.log(`${user.displayName} online with socket ${socket.id}`);

  const userId = user._id.toString();
  const userSockets = onlineUsers.get(userId) ?? new Set();
  userSockets.add(socket.id);
  onlineUsers.set(userId, userSockets);

  //Thông báo có người dùng mới onl
  io.emit("online-users", getOnlineUserIds());

  //Join room với socket.io để gửi tin nhắn real time 
  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  //Khi user tạo convo mới ở frontend, user sẽ join vào phòng này
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  //Tạo phòng theo user id
  socket.join(userId);

  registerCallHandlers(io, socket, onlineUsers);

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }

    io.emit("online-users", getOnlineUserIds());
    /* console.log(`socket disconnected: ${socket.id}`); */
  });
});

export { io, app, server };
