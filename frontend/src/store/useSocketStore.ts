import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

// Store quản lý kết nối socket và danh sách người dùng online.
export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  // Khởi tạo kết nối socket nếu chưa tồn tại.
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    // Return sớm để tránh tạo nhiều kết nối socket cùng lúc.
    if (existingSocket) return;

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Connect successfully with socket");
    });

    // Cập nhật danh sách user đang online.
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Nhận tin nhắn mới từ server.
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      // Thêm message vào store chat.
      useChatStore.getState().addMessage(message);

      // Chuẩn hóa lastMessage theo shape UI đang dùng.
      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      // Nếu user đang mở đúng hội thoại thì đánh dấu đã xem ngay.
      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      // Đồng bộ hội thoại trong danh sách conversation.
      useChatStore.getState().updateConversation(updatedConversation);
    });

    // Nhận sự kiện đã đọc tin nhắn.
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // Nhận hội thoại nhóm mới, thêm vào danh sách và join room tương ứng.
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });
  },

  // Ngắt kết nối socket khi logout/unmount.
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
