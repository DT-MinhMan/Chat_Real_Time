import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

//Kiểm tra đăng nhập 
export const authMe = async (req, res) => {
    try {
        const user = req.user; // lấy từ authMiddleware

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error("Error when call authMe", error);
        return res.status(500).json({ message: "System error" });
    }
};

//Tìm kiếm người dùng
export const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Need username in query." });
        }

        const user = await User.findOne({ username }).select(
            "_id displayName username avatarUrl"
        );

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error when searchUserByUsername", error);
        return res.status(500).json({ message: "System error" });
    }
};

//Upload ảnh avatar người dùng 
export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFromBuffer(file.buffer);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarUrl");

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({ message: "Avatar return null" });
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Error when upload avatar", error);
        return res.status(500).json({ message: "Upload failed" });
    }
};

