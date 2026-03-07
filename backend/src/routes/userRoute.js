import express from 'express';
import {authMe} from '../controllers/userControllers.js';

//Định nghĩa api endpoint xác thực người dùng  
const router = express.Router();

router.get("/me", authMe);

export default router;