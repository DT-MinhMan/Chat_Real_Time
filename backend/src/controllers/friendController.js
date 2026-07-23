import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import UserBlock from "../models/UserBlock.js";
import mongoose from "mongoose";
import { io } from "../socket/index.js";

const getBlockStatusForViewer = async (viewerId, otherUserId) => {
  const [blockedByMe, blockedMe] = await Promise.all([
    UserBlock.exists({ blocker: viewerId, blocked: otherUserId }),
    UserBlock.exists({ blocker: otherUserId, blocked: viewerId }),
  ]);

  if (blockedByMe) return "blocked_by_me";
  if (blockedMe) return "blocked_me";
  return "none";
};

const emitBlockStatusUpdate = async (userA, userB) => {
  const userAId = userA.toString();
  const userBId = userB.toString();
  const [userAStatus, userBStatus] = await Promise.all([
    getBlockStatusForViewer(userAId, userBId),
    getBlockStatusForViewer(userBId, userAId),
  ]);

  io.to(userAId).emit("user-block:updated", {
    userId: userBId,
    blockStatus: userAStatus,
  });
  io.to(userBId).emit("user-block:updated", {
    userId: userAId,
    blockStatus: userBStatus,
  });
};

//Api gửi lời mời kết bạn 
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    const from = req.user._id;

    //Gửi lời mời cho chính mình
    if (from.toString() === to.toString()) {
      return res.status(400).json({ message: "You can not send friend request to yourself" });
    }

    //Kiểm tra người nhận lời mời
    const userExists = await User.exists({ _id: to });

    if (!userExists) {
      return res.status(404).json({ message: "User not exists" });
    }

    //Kiểm tra đã có kết bạn hay chưa
    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "The two of them were already friends." });
    }

    if (existingRequest) {
      return res.status(400).json({ message: "A friend request is pending." });
    }

    //Tạo mới lời mời kết bạn 
    const request = await FriendRequest.create({
      from,
      to,
      message,
    });

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate("from", "_id username displayName avatarUrl")
      .populate("to", "_id username displayName avatarUrl")
      .lean();

    io.to(to.toString()).emit("friend-request:received", populatedRequest);
    io.to(from.toString()).emit("friend-request:sent", populatedRequest);

    return res.status(201).json({
      message: "Friend request successfully sent.",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Error sending friend request", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Chấp nhận lời mời kết bạn 
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    //Kiểm tra lời mời có tồn tại không
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "No friend requests found." });
    }

    //Đảm bảo chỉ người dùng mời được chấp nhận 
    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not entitled to accept this invitation." });
    }

    //Tạo quan hệ bạn bè mới
    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    //Xóa yêu cầu kết bạn vừa được chấp nhận 
    await FriendRequest.findByIdAndDelete(requestId);

    //Hiển thị hình ảnh người kết bạn 
    const [from, to] = await Promise.all([
      User.findById(request.from).select("_id username displayName avatarUrl").lean(),
      User.findById(request.to).select("_id username displayName avatarUrl").lean(),
    ]);

    io.to(request.from.toString()).emit("friend-request:accepted", {
      requestId,
      friend: to,
      acceptedBy: userId,
    });
    io.to(request.to.toString()).emit("friend-request:accepted", {
      requestId,
      friend: from,
      acceptedBy: userId,
    });

    return res.status(200).json({
      message: "Accepted the friend request successfully.",
      //Trả về người dùng hiển thị lên frontend
      newFriend: {
        _id: from?._id,
        username: from?.username,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error when accepting friend requests", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Xóa lời mời kết bạn 
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    //Kiểm tra lời mời có tồn tại không
    if (!request) {
      return res.status(404).json({ message: "No friend requests found." });
    }

    //Đảm bảo chỉ người dùng mới được xóa 
    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You have no right to refuse this invitation." });
    }

    //Xóa lời mời kết bạn
    await FriendRequest.findByIdAndDelete(requestId);

    io.to(request.from.toString()).emit("friend-request:declined", { requestId });
    io.to(request.to.toString()).emit("friend-request:declined", { requestId });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Error when rejecting friend request", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Lấy danh sách bạn bè
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    //Truy vấn đến mongoDB
    const friendships = await Friend.find({
      $or: [
        {
          userA: userId,
        },
        {
          userB: userId,
        },
      ],
    })
      .populate("userA", "_id displayName avatarUrl username")
      .populate("userB", "_id displayName avatarUrl username")
      .lean();

    //Nếu không có bạn bè
    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    //Nếu có thì lấy ra danh sách bạn bè 
    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Error retrieving friend list", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Xóa bạn bè
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { friendId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid friend id." });
    }

    let userA = userId;
    let userB = friendId;

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const deletedFriendship = await Friend.findOneAndDelete({ userA, userB });

    if (!deletedFriendship) {
      return res.status(404).json({ message: "Friendship not found." });
    }

    io.to(userId).emit("friendship:removed", { friendId, removedBy: userId });
    io.to(friendId).emit("friendship:removed", { friendId: userId, removedBy: userId });

    return res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    console.error("Error removing friend", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Chặn người dùng
export const blockUser = async (req, res) => {
  try {
    const blocker = req.user._id;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    if (blocker.toString() === userId.toString()) {
      return res.status(400).json({ message: "You can not block yourself." });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(404).json({ message: "User not exists" });
    }

    await UserBlock.findOneAndUpdate(
      { blocker, blocked: userId },
      { $setOnInsert: { blocker, blocked: userId } },
      { upsert: true, new: true }
    );

    await emitBlockStatusUpdate(blocker, userId);

    return res.status(200).json({
      message: "User blocked successfully.",
      blockedUserId: userId,
    });
  } catch (error) {
    console.error("Error blocking user", error);
    return res.status(500).json({ message: "System error" });
  }
};

//Mở chặn người dùng
export const unblockUser = async (req, res) => {
  try {
    const blocker = req.user._id;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    if (blocker.toString() === userId.toString()) {
      return res.status(400).json({ message: "You can not unblock yourself." });
    }

    await UserBlock.findOneAndDelete({ blocker, blocked: userId });

    await emitBlockStatusUpdate(blocker, userId);

    return res.status(200).json({
      message: "User unblocked successfully.",
      unblockedUserId: userId,
    });
  } catch (error) {
    console.error("Error unblocking user", error);
    return res.status(500).json({ message: "System error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id username displayName avatarUrl";

    //Tìm và lấy thông tin từ db
    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Error retrieving friend request list", error);
    return res.status(500).json({ message: "System error" });
  }
};
