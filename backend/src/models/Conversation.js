import mongoose from "mongoose";

//Tạo schema phụ mô tả thông tin người dùng trong cuộc trò chuyện
const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: { //thời điểm người dùng tham gia
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

//Tạo schem phụ hội thoại nhóm
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  }
);

//Tạo schema phụ lưu thời gian cuối của tin nhắn trong hội thoại 
const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: String },
    content: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["text", "call"],
      default: "text",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

//Tạo schema cuộc trò chuyện
const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"], //caht trực tiếp hoặc chat nhóm
      required: true,
    },
    participants: {
      type: [participantSchema],
      required: true,
    },
    group: {
      type: groupSchema,
    },
    lastMessageAt: {
      type: Date,
    },
    seenBy: [ //Người đã đọc tin
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    hiddenFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Compound index sắp xếp theo người tham gia
conversationSchema.index({
  "participants.userId": 1,
  lastMessageAt: -1,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
