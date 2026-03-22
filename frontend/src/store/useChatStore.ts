import { chatService } from "@/services/chatServices";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

//Xây dựng logic chat 
export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            convoLoading: false, // convo loading
            messageLoading: false, //riêng cho message
            loading: false,

            setActiveConversation: (id) => set({ activeConversationId: id }),
            reset: () => {
                set({
                    conversations: [],
                    messages: {},
                    activeConversationId: null,
                    convoLoading: false,
                    messageLoading: false,
                });
            },
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
            fetchMessages: async (conversationId) => {
                const { activeConversationId, messages } = get();
                const { user } = useAuthStore.getState();

                //Lấy convo id
                const convoId = conversationId ?? activeConversationId;

                //Không có thì ko trả về
                if (!convoId) return;

                //Lấy dữ liệu tin nhắn 
                const current = messages?.[convoId];
                const nextCursor =
                    current?.nextCursor === undefined ? "" : current?.nextCursor;

                //Nếu đã hết thì ko fetch tin nhắn nữa
                if (nextCursor === null) return;

                set({ messageLoading: true });

                //Gọi api lấy tin nhắn mới 
                try {
                    const { messages: fetched, cursor } = await chatService.fetchMessages(
                        convoId,
                        nextCursor
                    );

                    //Đánh dấu tin nhắn thuộc về người dùng 
                    const processed = fetched.map((m) => ({
                        ...m,
                        isOwn: m.senderId === user?._id,
                    }));

                    //Cập nhật lại state 
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
            sendDirectMessage: async (recipientId, content, imgUrl) => {
                try {
                    const { activeConversationId } = get();
                    await chatService.sendDirectMessage(
                        recipientId,
                        content,
                        imgUrl,
                        activeConversationId || undefined
                    );
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c._id === activeConversationId ? { ...c, seenBy: [] } : c
                        ),
                    }));
                } catch (error) {
                    console.error("Error when send direct message", error);
                }
            },
            sendGroupMessage: async (conversationId, content, imgUrl) => {
                try {
                    await chatService.sendGroupMessage(conversationId, content, imgUrl);
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
                        ),
                    }));
                } catch (error) {
                    console.error("Error when send group message", error);
                }
            },
            addMessage: async (message) => {  //Thêm tin nhắn mới vào room 
                try {
                    const { user } = useAuthStore.getState();
                    const { fetchMessages } = get();

                    message.isOwn = message.senderId === user?._id;

                    const convoId = message.conversationId;

                    let prevItems = get().messages[convoId]?.items ?? []; //Lấy tin nhắn cũ trong hội thoại 

                    //Gắn tin nhắn cuối vào danh sách tin nhắn cũ có sẵn 
                    if (prevItems.length === 0) {
                        await fetchMessages(message.conversationId);
                        prevItems = get().messages[convoId]?.items ?? [];
                    }

                    set((state) => {
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
            updateConversation: (conversation) => {
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c._id === conversation._id ? { ...c, ...conversation } : c
                    ),
                }));
            },
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

                    if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
                        return;
                    }

                    await chatService.markAsSeen(activeConversationId);

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
                    console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
                }
            },
            addConvo: (convo) => {
                set((state) => {
                    const exists = state.conversations.some(
                        (c) => c._id.toString() === convo._id.toString()
                    );

                    return {
                        conversations: exists
                            ? state.conversations
                            : [convo, ...state.conversations],
                        activeConversationId: convo._id,
                    };
                });
            },
            createConversation: async (type, name, memberIds) => {
                try {
                    set({ loading: true });
                    const conversation = await chatService.createConversation(
                        type,
                        name,
                        memberIds
                    );

                    get().addConvo(conversation);

                    useSocketStore
                        .getState()
                        .socket?.emit("join-conversation", conversation._id);
                } catch (error) {
                    console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: "chat-storage",
            partialize: (state) => ({ conversations: state.conversations }),
        }
    )
);