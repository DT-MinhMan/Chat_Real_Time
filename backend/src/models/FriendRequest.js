import mongoose from "mongoose";

//Tạo schema lời mời kết bạn 
const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

//Không cho phép gửi trùng lời mời, cặp from và to là duy nhất
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

//Giúp truy vấn nhanh lời mời đã gửi
friendRequestSchema.index({ from: 1 });

//Giúp truy vấn nhanh lời mời đã nhận
friendRequestSchema.index({ to: 1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;