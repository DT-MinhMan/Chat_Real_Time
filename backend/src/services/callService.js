import Conversation from "../models/Conversation.js";

export const validateDirectCall = async ({ conversationId, callerId, receiverId }) => {
  if (!conversationId || !receiverId) {
    return { ok: false, reason: "missing-payload" };
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return { ok: false, reason: "conversation-not-found" };
  }

  if (conversation.type !== "direct") {
    return { ok: false, reason: "only-direct-call-supported" };
  }

  const participantIds = (conversation.participants || []).map((p) =>
    p.userId.toString()
  );

  if (!participantIds.includes(callerId) || !participantIds.includes(receiverId)) {
    return { ok: false, reason: "not-conversation-member" };
  }

  if (callerId === receiverId) {
    return { ok: false, reason: "can-not-call-yourself" };
  }

  return { ok: true, conversation };
};
