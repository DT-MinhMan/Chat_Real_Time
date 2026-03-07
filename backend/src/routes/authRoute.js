import express from 'express';
import {signUp, signIn, signOut, refreshToken} from '../controllers/authControllers.js';

//Định nghĩa api endpoint
const authRouter = express.Router();

//Đăng ký
authRouter.post("/signup", signUp);
//Đăng nhập
authRouter.post("/signin", signIn);
//Đăng xuất
authRouter.post("/signout", signOut);
//Refresh lại trang
authRouter.post("/refresh", refreshToken);


export default authRouter;


