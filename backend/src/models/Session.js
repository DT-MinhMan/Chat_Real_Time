import mongoose from "mongoose";

//Khởi tạo schema session cho database
const sessionSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    refreshToken:{
        type: String,
        required: true,
        unique: true
    },
    expiredAt: {
        type: Date,
        required: true
    }
},
{
    timestamps: true
});

//Tự động xóa khi hết hạn 
sessionSchema.index({expiredAt: 1},{expireAfterSeconds: 0});

export default mongoose.model('Session',sessionSchema)