import express from 'express';
import dotenv from 'dotenv';
import {connectDB} from './libs/db.js';
import authRouter from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import friendRoute from './routes/friendRoute.js';
import messageRoute from './routes/messageRoute.js';
import conversationRoute from './routes/conversationRoute.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';
import swaggerUi from "swagger";
import fs from "fs";
import {app,server} from "./socket/index.js";
import { v2 as cloudinary } from 'cloudinary';

//Load các biến môi trường
dotenv.config();

//Khởi chạy app với express
const app = express();
const PORT = process.env.PORT || 5001;

//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));

 //Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Public routes
app.use('/api/auth', authRouter);

//Private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute);
app.use('/api/conversations', conversationRoute);

connectDB().then(() =>{
    server.listen(PORT, () => {
        console.log(`Server is start on port: ${PORT}`)
    })
})