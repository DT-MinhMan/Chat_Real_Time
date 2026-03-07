import jwt from "jsonwebtoken";
import User from "../models/User.js";


//Xây dựng middleware đảm bảo đúng người dùng đang gửi request đến server
export const protectedRoute = (req, res, next) => {//next là hàm callback dùng trong middlleware của express
    try {
        //Lấy access token từ header
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; //Lấy bearer token nếu có

        if (!token) {
            return res.status(401).json({ message: "Can not found access token" });
        }

        //Xác minh token hợp lệ
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                console.error(err);
                return res.status(403).json({ message: "Access token expired or wrong" });
            }

            //Lấy user tương ứng
            const user = await User.findById(decodedUser.userId).select("-hashedPassword");// Lấy thông tin user trừ mật khẩu
            if (!user) {
                return res.status(404).json({ message: "User not exists." });
            }

            //Trả về user trong res
            req.user = user;
            next();
        });
    } catch (error) {
        console.error("Error when try to authorize JWT in authMiddleware", error);
        return res.status(500).json({ message: "System error" });
    }
};