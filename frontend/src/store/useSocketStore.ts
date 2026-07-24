import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";

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

    socket.on("friend-request:received", (request) => {
      useFriendStore.getState().addReceivedRequest(request);
      toast.info("You received a new friend request.");
    });

    socket.on("friend-request:sent", (request) => {
      useFriendStore.getState().addSentRequest(request);
    });

    socket.on("friend-request:accepted", ({ requestId, friend, acceptedBy }) => {
      const friendStore = useFriendStore.getState();
      const wasSentRequest = friendStore.sentList.some(
        (request) => request._id === requestId
      );
      friendStore.removeRequestFromState(requestId);

      if (friend) {
        friendStore.addFriendToState(friend);
      }

      if (wasSentRequest || acceptedBy !== useAuthStore.getState().user?._id) {
        toast.success("Friend request accepted.");
      }
    });

    socket.on("friend-request:declined", ({ requestId }) => {
      useFriendStore.getState().removeRequestFromState(requestId);
    });

    socket.on("friendship:removed", ({ friendId }) => {
      useFriendStore.getState().removeFriendFromState(friendId);
    });

    socket.on("user-block:updated", ({ userId, blockStatus }) => {
      useChatStore.getState().updateDirectBlockStatus(userId, blockStatus);
    });

    // Nhận tin nhắn mới từ server.
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      // Thêm message vào store chat.
      useChatStore.getState().addMessage(message);

      // Chuẩn hóa lastMessage theo shape UI đang dùng.
      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        type: conversation.lastMessage.type,
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
      const chatState = useChatStore.getState();
      const conversationExists = chatState.conversations.some(
        (c) => c._id === updatedConversation._id
      );

      if (conversationExists) {
        chatState.updateConversation(updatedConversation);
      } else {
        chatState.fetchConversations();
      }
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

    socket.on("conversation:removed", ({ conversationId }) => {
      useChatStore.getState().removeConversation(conversationId);
    });

    socket.on("group:member-left", ({ conversationId, participants }) => {
      useChatStore.getState().updateConversation({
        _id: conversationId,
        participants,
      });
    });

    socket.on("group:member-added", ({ conversationId, participants }) => {
      useChatStore.getState().updateConversation({
        _id: conversationId,
        participants,
      });
    });

    // Nhận hội thoại nhóm mới, thêm vào danh sách và join room tương ứng.
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    socket.on("call:incoming", (payload) => {
      useCallStore.getState().receiveIncomingCall(payload);
    });

    socket.on("call:outgoing", (payload) => {
      useCallStore.getState().handleOutgoingCall(payload);
    });

    socket.on("call:accepted", (payload) => {
      useCallStore.getState().handleCallAccepted(payload);
    });

    socket.on("call:rejected", (payload) => {
      useCallStore.getState().handleCallRejected(payload);
    });

    socket.on("call:ended", (payload) => {
      useCallStore.getState().handleRemoteEndCall(payload);
    });

    socket.on("call:offer", (payload) => {
      useCallStore.getState().handleOffer(payload);
    });

    socket.on("call:answer", (payload) => {
      useCallStore.getState().handleAnswer(payload);
    });

    socket.on("call:ice-candidate", (payload) => {
      useCallStore.getState().handleIceCandidate(payload);
    });

    socket.on("call:busy", () => {
      useCallStore.getState().handleCallError({ reason: "User is busy." });
    });

    socket.on("call:unavailable", () => {
      useCallStore.getState().handleCallError({ reason: "User is offline." });
    });

    socket.on("call:error", (payload) => {
      useCallStore.getState().handleCallError(payload);
    });
  },

  // Ngắt kết nối socket khi logout/unmount.
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      useCallStore.getState().cleanupCall();
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
