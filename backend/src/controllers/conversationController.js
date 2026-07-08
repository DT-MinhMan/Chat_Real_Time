import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

//Tạo cuộc trò chuyện mới
export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    //Kiểm tra dữ liệu đầu vào
    if (!type || (type === "group" && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Group name and member list are required." });
    }

    let conversation;

    //Kiểm tra 2 người dùng chat trực tiếp đã có hội thoại chưa 
    if (type === "direct") {
        const participantId = memberIds[0];

        conversation = await Conversation.findOne({
            type: "direct",
            "participants.userId": { $all: [userId, participantId] },
        });

        //Nếu chưa có cuộc hội thoại thì tạo mới 
        if (!conversation) {
            conversation = new Conversation({
            type: "direct",
            participants: [{ userId }, { userId: participantId }],
            lastMessageAt: new Date(),
            });

            await conversation.save();
        }
    }

    //Tạo cuộc trò chuyện nếu là nhóm chat 
    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type invalid" });
    }

    //Nạp thêm thông tin người dùng cho các hàm liên quan
    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    // emit event đến phòng user id
    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Eror while create conversation", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Lấy danh sách cuộc trò chuyện 
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    //Duyệt qua cuộc trò chuyện và format lại cho frontend
    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Error when get conversations", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Lấy tin nhắn của người dùng
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const canAccess = await Conversation.exists({
      _id: conversationId,
      "participants.userId": req.user._id,
    });

    if (!canAccess) {
      return res.status(403).json({ message: "You are not in this conversation." });
    }

    const query = { conversationId };

    //Load tin nhắn cũ dựa trên cursor chỉ ngày 
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    //Truy vấn message dựa trên query
    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    ///Nếu còn nhiều tin nhắn hơn limit
    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    //Đảo thứ tự để tin mới nhất nằm ở cuối
    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//Lấy tin nhắn người dùng để socket.io gom nhóm 
export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Error when fetch conversations: ", error);
    return [];
  }
};

//Đánh dấu tin nhắn đã đọc
export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    //Kiểm tra hội thoại có tồn tại ko
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not exists" });
    }

    const isMember = (conversation.participants || []).some(
      (p) => p.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not in this conversation." });
    }

    const last = conversation.lastMessage;

    //Kiểm tra tin nhắn cuối cùng 
    if (!last) {
      return res.status(200).json({ message: "Not have message to mark as seen" });
    }

    //Kiểm tra người gửi tin cuối cùng có phải user tự gửi ko
    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender don't need mark as seen" });
    }

    //Thêm vào danh sách seenBy
    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      {
        returnDocument: 'after',
      },
    );

    //Emit với socket io để tất cả người trong hội thoại biết
    io.to(conversationId).emit("read-message", {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.seenBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Error when mark as seen", error);
    return res.status(500).json({ message: "System error" });
  }
};
