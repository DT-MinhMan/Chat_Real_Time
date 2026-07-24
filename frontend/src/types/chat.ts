//Định nghĩa cấu trúc dữ liệu cho Chat
export interface Participant {
  _id: string;
  username?: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  phone?: string;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  type?: "text" | "call" | "system";
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  blockStatus?: "none" | "blocked_by_me" | "blocked_me";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type?: "text" | "call" | "system";
  systemType?: "member_left" | "member_joined";
  imgUrl?: string | null;
  callMeta?: {
    callId: string;
    callType: "audio" | "video";
    status: "missed" | "rejected" | "completed" | "cancelled";
    duration?: number;
    startedAt?: string;
    endedAt?: string;
  };
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
}
