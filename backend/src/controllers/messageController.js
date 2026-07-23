import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

//Gửi tin nhắn trực tiếp
export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    let conversation;

    //Nếu tin nhắn trống
    if (!content) {
      return res.status(400).json({ message: "Missing content" });
    }

    //Nếu có id thì tìm trong db
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    //Nếu không tìm thấy thì khởi tạo hội thoại mới
    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    //Tạo một tin nhắn mới
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    //Cập nhật lại cuộc hội thoại
    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("An error occurred while sending a direct message.", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Nhắn tin nhóm 
export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json("Missing content");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("An error occurred while sending a group message.", error);
    return res.status(500).json({ message: "System error" });
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id." });
    }

    const message = await Message.findById(messageId).lean();

    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    const canAccess = await Conversation.exists({
      _id: message.conversationId,
      "participants.userId": userId,
    });

    if (!canAccess) {
      return res.status(403).json({ message: "You are not in this conversation." });
    }

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: userId },
    });

    return res.status(200).json({ message: "Message deleted for you." });
  } catch (error) {
    console.error("Error when deleting message for user", error);
    return res.status(500).json({ message: "System error" });
  }
};
