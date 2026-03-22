import express from "express";

//Định nghĩa api bạn bè
import {
  acceptFriendRequest,
  sendFriendRequest,
  declineFriendRequest,
  getAllFriends,
  getFriendRequests,
} from "../controllers//friendController.js";

const router = express.Router();
//Gửi lời mời
router.post("/requests", sendFriendRequest);
//Chấp nhận lời mời
router.post("/requests/:requestId/accept", acceptFriendRequest);
//Từ chối lời mời
router.post("/requests/:requestId/decline", declineFriendRequest);
//Lấy danh sách bạn bè
router.get("/", getAllFriends);
//Lấy danh sách yêu cầu
router.get("/requests", getFriendRequests);

export default router;