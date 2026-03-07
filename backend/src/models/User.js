import mongoose from 'mongoose';

//Khởi tạo schema user cho database
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    avatarUrl: {
        type: String //Lưu link CDN để hiển thị hình 
    },
    avaterId: {
         type: String //Lưu cloudinary public_id để xóa hình
    },
    bio: {
        type: String,
        maxlength:500 
    },
    phone: {
        type: String,
        sparse: true //Cho phép null nhưng không được phép trùng
    }
},
    {
        timeStamp: true
    }
);

const User = mongoose.model("User", userSchema);
export default User;





