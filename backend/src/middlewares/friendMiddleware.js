import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

//Middleware kiểm tra có kết bạn hay không
const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const recipientId = req.body?.recipientId ?? null;
    const memberIds = req.body?.memberIds ?? [];

    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({ message: "Recipient ID or member ID must be provided." });
    }

    if (recipientId) {
      const [userA, userB] = pair(me, recipientId);

      const isFriend = await Friend.findOne({ userA, userB });

      if (!isFriend) {
        return res.status(403).json({ message: "You haven't befriended this person yet." });
      }

      return next();
    }

    //Kiểm tra quan hệ bạn bè với người trong nhóm
    const friendChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : memberId;
    });

    const results = await Promise.all(friendChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res.status(403).json({ message: "You can only add friends to the group.", notFriends });
    }

    next();
  } catch (error) {
    console.error("An error occurred while checkFriendship", error);
    return res.status(500).json({ message: "System error." });
  }
};

//Kiểm tra một người có phải là thành viên của nhóm chat không 
export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    //Kiểm tra người gửi có phải thành viên nhóm không 
    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not in this group." });
    }

    req.conversation = conversation;

    next();
  } catch (error) {
    console.error("Error checkGroupMembership:", error);
    return res.status(500).json({ message: "System error" });
  }
};