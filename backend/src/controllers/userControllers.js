import bcrypt from "bcrypt";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
//Cap nhat thong tin profile cua nguoi dung hien tai
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { displayName: rawDisplayName, bio: rawBio, phone: rawPhone } = req.body;

        if (
            typeof rawDisplayName !== "string" ||
            (rawBio !== undefined && typeof rawBio !== "string") ||
            (rawPhone !== undefined && typeof rawPhone !== "string")
        ) {
            return res.status(400).json({ message: "Profile information is invalid." });
        }

        const displayName = rawDisplayName.trim();
        const bio = rawBio?.trim() ?? "";
        const phone = rawPhone?.trim() ?? "";

        if (!displayName || displayName.length < 2 || displayName.length > 50) {
            return res.status(400).json({ message: "Display name must be from 2 to 50 characters." });
        }

        if (bio.length > 500) {
            return res.status(400).json({ message: "Introduce must be 500 characters or less." });
        }

        if (phone && !/^(0\d{9,10}|\+84\d{9,10})$/.test(phone)) {
            return res.status(400).json({ message: "Phone number is invalid." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { displayName, bio, phone },
            { returnDocument: "after", runValidators: true }
        ).select("-hashedPassword");

        return res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.error("Error when update profile", error);
        return res.status(500).json({ message: "Update profile failed" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            typeof confirmPassword !== "string"
        ) {
            return res.status(400).json({ message: "Password information is invalid." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must have at least 6 characters." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Confirm password does not match." });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different from current password." });
        }

        const user = await User.findById(userId).select("hashedPassword");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const passwordCorrect = await bcrypt.compare(currentPassword, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        console.error("Error when change password", error);
        return res.status(500).json({ message: "Change password failed" });
    }
};

export const searchUserByDisplayName = async (req, res) => {
    try {
        const { displayName } = req.query;

        if (typeof displayName !== "string" || displayName.trim() === "") {
            return res.status(400).json({ message: "Need displayName in query." });
        }

        const user = await User.findOne({
            displayName: { $regex: escapeRegex(displayName.trim()), $options: "i" },
        }).select(
            "_id displayName username avatarUrl"
        );

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error when searchUserByDisplayName", error);
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
                returnDocument: 'after',
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

