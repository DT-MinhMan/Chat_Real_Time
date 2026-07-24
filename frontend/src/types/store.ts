import type { Socket } from "socket.io-client";
import type { Conversation, Message } from './chat';
import type { Friend, FriendRequest, UpdateProfilePayload, User } from "./user";

//Định nghĩa cấu trúc dữ liệu cho store Auth
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

//Định nghĩa cấu trúc dữ liệu cho store Theme
export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

//Định nghĩa cấu trúc dữ liệu cho store Chat
export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  
  reset: () => void;

  setActiveConversation: (id: string | null) => void;

  fetchConversations: () => Promise<void>;

  fetchMessages: (conversationId?: string) => Promise<void>;

  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string
  ) => Promise<void>;

  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string
  ) => Promise<void>;

  // Thêm tin nhắn real time
  addMessage: (message: Message) => Promise<void>;

  // Cập nhật convo real time
  // updateConversation: (conversation: unknown) => void;
  updateConversation: (conversation: Partial<Conversation> & { _id: string }) => void;
  updateDirectBlockStatus: (
    userId: string,
    blockStatus: "none" | "blocked_by_me" | "blocked_me"
  ) => void;
 
  markAsSeen: () => Promise<void>;

  deleteMessageForMe: (
    conversationId: string,
    messageId: string
  ) => Promise<void>;

  clearConversationMessagesForMe: (conversationId: string) => Promise<void>;

  leaveGroupConversation: (conversationId: string) => Promise<void>;

  addGroupMembers: (
    conversationId: string,
    memberIds: string[]
  ) => Promise<void>;

  removeConversation: (conversationId: string) => void;

  addConvo: (convo: Conversation) => void;

  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByDisplayName: (displayName: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  addReceivedRequest: (request: FriendRequest) => void;
  addSentRequest: (request: FriendRequest) => void;
  removeRequestFromState: (requestId: string) => void;
  addFriendToState: (friend: Friend) => void;
  removeFriendFromState: (friendId: string) => void;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}

export interface UserState {
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updateAvatarUrl: (formData: FormData) => Promise<void>;
}
