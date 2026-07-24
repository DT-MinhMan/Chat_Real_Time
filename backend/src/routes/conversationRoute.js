import express from "express";
import {
  createConversation,
  addGroupMembers,
  clearConversationMessagesForMe,
  getConversations,
  getMessages,
  leaveGroupConversation,
  markAsSeen,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

//Định nghĩa api trò chuyện nhóm
const router = express.Router();

//Kiểm tra friendship
router.post("/", checkFriendship, createConversation);
//Lấy cuộc hội thoại
router.get("/", getConversations);
//Lấy tin nhắn
router.get("/:conversationId/messages", getMessages);
router.delete("/:conversationId/messages", clearConversationMessagesForMe);
router.patch("/:conversationId/members", checkFriendship, addGroupMembers);
router.patch("/:conversationId/leave", leaveGroupConversation);
//Đánh dấu đã đọc tin nhắn 
router.patch("/:conversationId/seen", markAsSeen);

export default router;
