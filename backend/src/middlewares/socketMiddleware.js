import jwt from "jsonwebtoken";
import User from "../models/User.js";

//Middleware đảm bảo socket kết nối khi người dùng log lại khi còn access token
export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        //Nếu không có token
        if (!token) {
            return next(new Error("Unauthorized - Token not exists"));
        }

        //Verify token 
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            return next(new Error("Unauthorized - Token invalid or expired"));
        }

        const user = await User.findById(decoded.userId).select("-hashedPassword");

        //Nếu tìm không có user
        if (!user) {
            return next(new Error("User not exists"));
        }

        socket.user = user;

        next();
    } catch (error) {
        console.error("Error when verify JWT in socketMiddleware", error);
        next(new Error("Unauthorized"));
    }
};