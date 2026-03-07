import express from 'express';
import dotenv from 'dotenv';
import {connectDB} from './libs/db.js';
import authRouter from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';

//Load các biến môi trường
dotenv.config();

//Khởi chạy app với express
const app = express();
const PORT = process.env.PORT || 5001;

//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));

//Public routes
app.use('/api/auth', authRouter);

//Private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);

connectDB().then(() =>{
    app.listen(PORT, () => {
        console.log(`Server is start on port: ${PORT}`)
    })
})