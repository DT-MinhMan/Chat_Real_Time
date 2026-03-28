import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

//Định nghĩa api endpoint xác thực người dùng  
const router = express.Router();
//Xác thực người dùng
router.get("/me", authMe);
//Tìm kiếm người dùng
router.get("/search", searchUserByUsername);
//upload avatar
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

export default router;