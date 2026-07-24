import express from "express";
import {
  authMe,
  changePassword,
  searchUserByDisplayName,
  updateProfile,
  uploadAvatar,
} from "../controllers/userControllers.js";
import { upload } from "../middlewares/uploadMiddleware.js";

//Định nghĩa api endpoint xác thực người dùng  
const router = express.Router();
//Xác thực người dùng
router.get("/me", authMe);
router.patch("/me", updateProfile);
router.patch("/me/password", changePassword);
//Tìm kiếm người dùng
router.get("/search", searchUserByDisplayName);
//upload avatar
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

export default router;
