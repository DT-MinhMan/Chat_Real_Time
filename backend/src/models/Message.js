import mongoose from "mongoose";

//Khởi tạoo schema message cho database
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//compound index: đặt index cho nhiều trường hỗ trợ tra cứu nhanh
//Tạo ra một bảng tra cứu theo conversationId, các tin nhắn có cùng id xếp cùng nhau và có thứ tự giảm dần
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;