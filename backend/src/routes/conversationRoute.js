import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
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
//Đánh dấu đã đọc tin nhắn 
router.patch("/:conversationId/seen", markAsSeen);

export default router;