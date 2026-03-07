import bcrypt from 'bcrypt';
import User from '../models//User.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Session from '../models/Session.js';

//thời gian refresh token, 30m phù hợp cho việc test api, thông thường là dưới 15m
const ACCESS_TOKEN_TTL = '30m'; 
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày

//Xây dựng api đăng ký
export const signUp = async (req,res) => {
    try {
        const {username, password, email, firstName, lastName} = req.body;

        //Kiểm tra thông tin có đầy đủ không
        if(!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({message: "Can not miss username, password, email, firstName, lastName "});
        }

        //Kiểm tra username có tồn tại không
        const duplicate = await User.findOne({username});
        if (duplicate){
            return res.status(400).json({message: "username is exists"});
        }

        //Mã hóa password
        const hashedPassword = await bcrypt.hash(password,10);

        //Tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`
        });

        return res.sendStatus(204);

    } catch (error) {
        console.error("Error when try sign up", error);
        return res.status(500).json({message:"Error when try sign up"});
    }
}

//Xây dựng api đăng nhập
export const signIn = async (req,res)=> {
    try {
        //Lấy input người dùng nhập
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({message: "You must fill your username or password"});
        }

        //Lấy hashedPassword trong database để so sánh với password người dùng nhập
        const user = await User.findOne({username});
        if(!user){
            return res.status(400).json({message: "User or password not exists"});
        }
        //Kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect){
            return res.status(400).json({message: "User or password not exists"});
        } 
        //Nếu khớp thì tạo access token với JWT
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        
        //Tạo refresh token 
        const refreshToken = crypto.randomBytes(64).toString('hex');
        
        //Tạo session mới trong db để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiredAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });
        //Trả refresh token về cookie
         res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none", //backend, frontend deploy riêng
            maxAge: REFRESH_TOKEN_TTL,
        }); 
        //Trả access token về cho người dùng
        return res.status(200).json({ message: `User ${user.displayName} đã logged in!`, accessToken });

    } catch (error) {
        console.error("Error when try sign in", error);
        return res.status(500).json({message:"Error when try sign in"});
    }
}

//Xây dựng api đăng xuất
export const signOut = async (req, res) => {
    try {
        //Lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;
        if (token) {
            //Xoá refresh token trong Session
            await Session.deleteOne({ refreshToken: token });

            //Xoá cookie
            res.clearCookie("refreshToken");
        }
    return res.sendStatus(204);

    } catch (error) {
        console.error("Error when signOut", error);
        return res.status(500).json({ message: "System error" });
    }
}

// Tạo access token mới từ refresh token 
export const refreshToken = async (req, res) => {
  try {
    // Lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token doesn't exists." });
    }

    // So với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token invalid or expired" });
    }

    // Kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token expired." });
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Trả về access token mới
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error when call refreshToken", error);
    return res.status(500).json({ message: "System error" });
  }
};