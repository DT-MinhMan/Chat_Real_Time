import crypto from "crypto";
import Message from "../../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../../utils/messageHelper.js";
import { validateDirectCall } from "../../services/callService.js";

const activeCalls = new Map();
const userActiveCall = new Map();
const CALL_TIMEOUT_MS = 45000;

const getPeerId = (call, userId) =>
  call.callerId === userId ? call.receiverId : call.callerId;

const isUserOnline = (onlineUsers, userId) => {
  const sockets = onlineUsers.get(userId);
  return sockets instanceof Set ? sockets.size > 0 : Boolean(sockets);
};

const clearCallTimer = (call) => {
  if (call?.timeoutId) clearTimeout(call.timeoutId);
};

const cleanupCall = (call) => {
  if (!call) return;
  clearCallTimer(call);
  activeCalls.delete(call.callId);
  userActiveCall.delete(call.callerId);
  userActiveCall.delete(call.receiverId);
};

const getCallContent = ({ callType, status, duration }) => {
  const label = callType === "video" ? "Video call" : "Voice call";

  if (status === "completed") {
    const minutes = Math.floor((duration || 0) / 60).toString().padStart(2, "0");
    const seconds = ((duration || 0) % 60).toString().padStart(2, "0");
    return `${label} ended - ${minutes}:${seconds}`;
  }

  if (status === "missed") return `Missed ${label.toLowerCase()}`;
  if (status === "rejected") return `${label} rejected`;
  return `${label} cancelled`;
};

const createCallMessage = async (io, call, status) => {
  try {
    const endedAt = new Date();
    const startedAt = call.startedAt || call.createdAt;
    const duration =
      status === "completed" && startedAt
        ? Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000))
        : 0;

    const message = await Message.create({
      conversationId: call.conversationId,
      senderId: call.callerId,
      type: "call",
      content: getCallContent({ callType: call.callType, status, duration }),
      callMeta: {
        callId: call.callId,
        callType: call.callType,
        status,
        duration,
        startedAt,
        endedAt,
      },
    });

    updateConversationAfterCreateMessage(call.conversation, message, call.callerId);
    await call.conversation.save();
    emitNewMessage(io, call.conversation, message);
  } catch (error) {
    console.error("Error when create call message", error);
  }
};

const finishCall = async (io, call, status, reason, notifyPeerId) => {
  if (!call) return;

  cleanupCall(call);

  if (notifyPeerId) {
    io.to(notifyPeerId).emit("call:ended", {
      callId: call.callId,
      reason,
      status,
    });
  }

  await createCallMessage(io, call, status);
};

const forwardToPeer = (io, socket, payload, eventName) => {
  const userId = socket.user._id.toString();
  const call = activeCalls.get(payload?.callId);

  if (!call) {
    socket.emit("call:error", { reason: "call-not-found" });
    return;
  }

  if (call.callerId !== userId && call.receiverId !== userId) {
    socket.emit("call:error", { reason: "not-call-member" });
    return;
  }

  const peerId = payload.to || getPeerId(call, userId);
  io.to(peerId).emit(eventName, {
    ...payload,
    from: userId,
  });
};

export const registerCallHandlers = (io, socket, onlineUsers) => {
  const userId = socket.user._id.toString();

  socket.on("call:invite", async ({ conversationId, receiverId, callType = "audio" }) => {
    try {
      if (!["audio", "video"].includes(callType)) {
        socket.emit("call:error", { reason: "invalid-call-type" });
        return;
      }

      const validation = await validateDirectCall({
        conversationId,
        callerId: userId,
        receiverId,
      });

      if (!validation.ok) {
        socket.emit("call:error", { reason: validation.reason });
        return;
      }

      if (!isUserOnline(onlineUsers, receiverId)) {
        socket.emit("call:unavailable", { receiverId, reason: "receiver-offline" });
        return;
      }

      if (userActiveCall.has(userId) || userActiveCall.has(receiverId)) {
        socket.emit("call:busy", { receiverId });
        return;
      }

      const callId = crypto.randomUUID();
      const call = {
        callId,
        conversationId,
        callerId: userId,
        receiverId,
        callType,
        status: "ringing",
        conversation: validation.conversation,
        createdAt: new Date(),
      };

      call.timeoutId = setTimeout(async () => {
        const current = activeCalls.get(callId);
        if (!current || current.status !== "ringing") return;

        cleanupCall(current);
        io.to(current.callerId).emit("call:ended", {
          callId,
          reason: "no-answer",
          status: "missed",
        });
        io.to(current.receiverId).emit("call:ended", {
          callId,
          reason: "no-answer",
          status: "missed",
        });
        await createCallMessage(io, current, "missed");
      }, CALL_TIMEOUT_MS);

      activeCalls.set(callId, call);
      userActiveCall.set(userId, callId);
      userActiveCall.set(receiverId, callId);

      socket.emit("call:outgoing", {
        callId,
        conversationId,
        receiverId,
        callType,
      });

      io.to(receiverId).emit("call:incoming", {
        callId,
        conversationId,
        callerId: userId,
        caller: {
          _id: userId,
          displayName: socket.user.displayName,
          avatarUrl: socket.user.avatarUrl ?? null,
        },
        callType,
      });
    } catch (error) {
      console.error("Error when invite call", error);
      socket.emit("call:error", { reason: "system-error" });
    }
  });

  socket.on("call:accept", ({ callId }) => {
    const call = activeCalls.get(callId);

    if (!call || call.receiverId !== userId) {
      socket.emit("call:error", { reason: "call-not-found" });
      return;
    }

    clearCallTimer(call);
    call.status = "accepted";
    call.startedAt = new Date();

    io.to(call.callerId).emit("call:accepted", {
      callId,
      conversationId: call.conversationId,
      receiverId: userId,
      callType: call.callType,
    });
  });

  socket.on("call:reject", async ({ callId, reason = "rejected" }) => {
    const call = activeCalls.get(callId);

    if (!call || call.receiverId !== userId) {
      socket.emit("call:error", { reason: "call-not-found" });
      return;
    }

    cleanupCall(call);
    io.to(call.callerId).emit("call:rejected", { callId, reason });
    await createCallMessage(io, call, "rejected");
  });

  socket.on("call:end", async ({ callId, reason = "ended" }) => {
    const call = activeCalls.get(callId);

    if (!call || (call.callerId !== userId && call.receiverId !== userId)) {
      socket.emit("call:error", { reason: "call-not-found" });
      return;
    }

    const peerId = getPeerId(call, userId);
    const status = call.status === "accepted" ? "completed" : "cancelled";
    await finishCall(io, call, status, reason, peerId);
  });

  socket.on("call:offer", (payload) => forwardToPeer(io, socket, payload, "call:offer"));
  socket.on("call:answer", (payload) => forwardToPeer(io, socket, payload, "call:answer"));
  socket.on("call:ice-candidate", (payload) =>
    forwardToPeer(io, socket, payload, "call:ice-candidate")
  );

  socket.on("disconnect", async () => {
    const callId = userActiveCall.get(userId);
    if (!callId) return;

    const call = activeCalls.get(callId);
    if (!call) {
      userActiveCall.delete(userId);
      return;
    }

    const peerId = getPeerId(call, userId);
    const status = call.status === "accepted" ? "completed" : "cancelled";
    await finishCall(io, call, status, "peer-disconnected", peerId);
  });
};
