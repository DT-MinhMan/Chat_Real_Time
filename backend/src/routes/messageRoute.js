import express from "express";

import {
  deleteMessageForMe,
  sendDirectMessage,
  sendGroupMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";


//Định nghĩa api message
const router = express.Router();
router.delete("/:messageId", deleteMessageForMe);
//Message trực tiếp
router.post("/direct", checkFriendship, sendDirectMessage);

//Message group
router.post("/group", checkGroupMembership, sendGroupMessage);

export default router;
