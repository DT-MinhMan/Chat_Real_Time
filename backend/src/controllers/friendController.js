import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

//Api gửi lời mời kết bạn 
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    const from = req.user._id;

    //Gửi lời mời cho chính mình
    if (from === to) {
      return res.status(400).json({ message: "You can not send friend request to yourself" });
    }

    //Kiểm tra người nhận lời mời
    const userExists = await User.exists({ _id: to });

    if (!userExists) {
      return res.status(404).json({ message: "User not exists" });
    }

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    //Kiểm tra đã có kết bạn hay chưa
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

    return res.status(201).json({ message: "Friend request successfully sent.", request });
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
    const from = await User.findById(request.from).select("_id displayName avatarUrl").lean();

    return res.status(200).json({
      message: "Accepted the friend request successfully.",
      //Trả về người dùng hiển thị lên frontend
      newFriend: {
        _id: from?._id,
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

//Lấy danh sách lời mời kết bạn 
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