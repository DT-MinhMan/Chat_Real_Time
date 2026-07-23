import { chatService } from "@/services/chatServices";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

// Store quản lý toàn bộ trạng thái chat.
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,

      // Trạng thái loading cho danh sách hội thoại.
      convoLoading: false,

      // Trạng thái loading riêng cho danh sách tin nhắn trong một hội thoại.
      messageLoading: false,

      // Loading chung cho các thao tác khác (ví dụ: tạo hội thoại).
      loading: false,

      // Đặt hội thoại đang được mở.
      setActiveConversation: (id) => set({ activeConversationId: id }),

      // Reset toàn bộ state chat về mặc định.
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        });
      },

      // Lấy danh sách hội thoại của người dùng.
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Error when fetchConversations:", error);
          set({ convoLoading: false });
        }
      },

      // Lấy tin nhắn theo hội thoại (hỗ trợ phân trang bằng cursor).
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        // Ưu tiên conversationId truyền vào, nếu không thì lấy hội thoại đang active.
        const convoId = conversationId ?? activeConversationId;

        // Không có hội thoại thì không fetch.
        if (!convoId) return;

        // Lấy trạng thái phân trang hiện tại của hội thoại.
        const current = messages?.[convoId];
        const nextCursor = current?.nextCursor === undefined ? "" : current?.nextCursor;

        // nextCursor = null nghĩa là đã hết dữ liệu.
        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          // Đánh dấu tin nhắn do chính người dùng gửi.
          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          // Ghép dữ liệu mới vào đầu danh sách cũ (để giữ thứ tự lịch sử).
          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },

      // Gửi tin nhắn direct (1-1).
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined
          );

          // Sau khi gửi, reset seenBy để cập nhật trạng thái đã xem theo thời gian thực.
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Error when send direct message", error);
          throw error;
        }
      },

      // Gửi tin nhắn nhóm.
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl);

          // Sau khi gửi, reset seenBy tương tự direct message.
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Error when send group message", error);
        }
      },

      // Thêm tin nhắn mới vào state khi nhận realtime hoặc sau khi gửi.
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          // Lấy danh sách tin nhắn cũ của hội thoại.
          let prevItems = get().messages[convoId]?.items ?? [];

          // Nếu chưa có dữ liệu local thì fetch trước để tránh thiếu lịch sử.
          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            // Chống thêm trùng tin nhắn (theo _id).
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when add message:", error);
        }
      },

      // Cập nhật lại dữ liệu một hội thoại có sẵn.
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },

      updateDirectBlockStatus: (userId, blockStatus) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (
              conversation.type !== "direct" ||
              !conversation.participants.some((participant) => participant._id === userId)
            ) {
              return conversation;
            }

            return { ...conversation, blockStatus };
          }),
        }));
      },

      // Đánh dấu hội thoại hiện tại là đã xem.
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          // Nếu chưa đọc = 0 thì không cần gọi API.
          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          // Đồng bộ unreadCounts trong local state.
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error when call markAsSeen in store", error);
        }
      },

      // Xóa tin nhắn chỉ ở phía người dùng hiện tại.
      deleteMessageForMe: async (conversationId, messageId) => {
        try {
          await chatService.deleteMessageForMe(messageId);

          set((state) => {
            const currentMessages = state.messages[conversationId];

            if (!currentMessages) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [conversationId]: {
                  ...currentMessages,
                  items: currentMessages.items.filter((message) => message._id !== messageId),
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when delete message for me", error);
          throw error;
        }
      },

      // Xóa toàn bộ tin nhắn trong hội thoại chỉ ở phía người dùng hiện tại.
      clearConversationMessagesForMe: async (conversationId) => {
        try {
          await chatService.clearConversationMessagesForMe(conversationId);

          set((state) => {
            const nextMessages = { ...state.messages };
            delete nextMessages[conversationId];

            return {
              conversations: state.conversations.filter((c) => c._id !== conversationId),
              messages: nextMessages,
              activeConversationId:
                state.activeConversationId === conversationId
                  ? null
                  : state.activeConversationId,
            };
          });
        } catch (error) {
          console.error("Error when clear conversation messages for me", error);
          throw error;
        }
      },

      // Thêm hội thoại mới vào đầu danh sách và chuyển active sang hội thoại đó.
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists ? state.conversations : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },

      // Tạo hội thoại mới (direct/group) và join socket room tương ứng.
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(type, name, memberIds);

          get().addConvo(conversation);

          useSocketStore.getState().socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Error when call createConversation in store", error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "chat-storage",

      // Chỉ persist danh sách hội thoại.
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
