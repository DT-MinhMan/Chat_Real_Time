import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";


//Định nghĩa api message
const router = express.Router();
//Message trực tiếp
router.post("/direct", checkFriendship, sendDirectMessage);

//Message group
router.post("/group", checkGroupMembership, sendGroupMessage);

export default router;