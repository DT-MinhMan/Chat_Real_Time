import { create } from "zustand";
import { toast } from "sonner";
import { useSocketStore } from "./useSocketStore";
import type { CallState, CallType } from "@/types/call";

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turns:openrelay.metered.ca:443?transport=tcp",
    ],
    username: import.meta.env.VITE_TURN_USERNAME || "openrelay",
    credential: import.meta.env.VITE_TURN_PASSWORD || "openrelay",
  },
];

let iceCandidatesQueue: RTCIceCandidateInit[] = [];

const getMedia = (callType: CallType) =>
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === "video",
  });

const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

export const useCallStore = create<CallState>((set, get) => ({
  status: "idle",
  callId: null,
  conversationId: null,
  callType: "audio",
  peer: null,
  isMuted: false,
  isCameraOff: false,
  needsMediaUnlock: false,
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  startCall: async ({ conversationId, receiver, callType }) => {
    const socket = useSocketStore.getState().socket;

    if (!socket) {
      toast.error("Socket is not connected.");
      return;
    }

    if (get().status !== "idle") {
      toast.info("You are already in a call.");
      return;
    }

    try {
      const localStream = await getMedia(callType);

      set({
        status: "calling",
        conversationId,
        callType,
        peer: receiver,
        localStream,
        isMuted: false,
        isCameraOff: false,
      });

      socket.emit("call:invite", {
        conversationId,
        receiverId: receiver._id,
        callType,
      });
    } catch (error) {
      console.error("Error when start call", error);
      toast.error("Can not access microphone or camera.");
      get().cleanupCall();
    }
  },

  receiveIncomingCall: (payload) => {
    if (get().status !== "idle") {
      useSocketStore.getState().socket?.emit("call:reject", {
        callId: payload.callId,
        reason: "busy",
      });
      return;
    }

    set({
      status: "ringing",
      callId: payload.callId,
      conversationId: payload.conversationId,
      callType: payload.callType,
      peer: payload.caller,
    });
  },

  acceptCall: async () => {
    const { callId, callType } = get();
    const socket = useSocketStore.getState().socket;

    if (!socket || !callId) return;

    try {
      const localStream = await getMedia(callType);

      set({
        status: "connecting",
        localStream,
        isMuted: false,
        isCameraOff: false,
      });

      socket.emit("call:accept", { callId });
    } catch (error) {
      console.error("Error when accept call", error);
      toast.error("Can not access microphone or camera.");
      socket.emit("call:reject", { callId, reason: "permission-denied" });
      get().cleanupCall();
    }
  },

  rejectCall: () => {
    const { callId } = get();

    if (callId) {
      useSocketStore.getState().socket?.emit("call:reject", { callId });
    }

    get().cleanupCall();
  },

  endCall: (reason = "ended") => {
    const { callId } = get();

    if (callId) {
      useSocketStore.getState().socket?.emit("call:end", { callId, reason });
    }

    get().cleanupCall();
  },

  handleOutgoingCall: (payload) => {
    set({
      callId: payload.callId,
      conversationId: payload.conversationId,
      callType: payload.callType,
    });
  },

  handleCallAccepted: async ({ callId, receiverId }) => {
    try {
      const { localStream } = get();

      if (get().callId !== callId || !localStream) return;

      const peerConnection = createPeerConnection();
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      set({ peerConnection, status: "connecting" });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      useSocketStore.getState().socket?.emit("call:offer", {
        callId,
        to: receiverId,
        sdp: offer,
      });
    } catch (error) {
      console.error("Error when handle accepted call", error);
      toast.error("Can not start call connection.");
      get().endCall("connection-error");
    }
  },

  handleCallRejected: () => {
    toast.info("Call rejected.");
    get().cleanupCall();
  },

  handleRemoteEndCall: (payload) => {
    if (payload.callId !== get().callId) return;

    toast.info("Call ended.");
    get().cleanupCall();
  },

  handleOffer: async ({ callId, from, sdp }) => {
    try {
      const { localStream } = get();

      if (get().callId !== callId || !localStream) return;

      const peerConnection = createPeerConnection();
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      set({ peerConnection, status: "connecting" });

      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

      // Process any queued ICE candidates
      for (const candidate of iceCandidatesQueue) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ice candidate", e);
        }
      }
      iceCandidatesQueue = [];

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      useSocketStore.getState().socket?.emit("call:answer", {
        callId,
        to: from,
        sdp: answer,
      });
    } catch (error) {
      console.error("Error when handle call offer", error);
      toast.error("Can not answer call connection.");
      get().endCall("connection-error");
    }
  },

  handleAnswer: async ({ callId, sdp }) => {
    try {
      const { peerConnection } = get();

      if (get().callId !== callId || !peerConnection) return;

      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

      // Process any queued ICE candidates
      for (const candidate of iceCandidatesQueue) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ice candidate", e);
        }
      }
      iceCandidatesQueue = [];

      set({ status: "in-call" });
    } catch (error) {
      console.error("Error when handle call answer", error);
      toast.error("Can not complete call connection.");
      get().endCall("connection-error");
    }
  },

  handleIceCandidate: async ({ callId, candidate }) => {
    const { peerConnection } = get();

    if (get().callId !== callId || !candidate) return;

    if (peerConnection && peerConnection.remoteDescription) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error when handle ice candidate", error);
      }
    } else {
      iceCandidatesQueue.push(candidate);
    }
  },

  handleCallError: (payload) => {
    toast.error(payload?.reason || "Call error.");
    get().cleanupCall();
  },

  toggleMute: () => {
    const localStream = get().localStream;
    const nextMuted = !get().isMuted;

    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    set({ isMuted: nextMuted });
  },

  toggleCamera: () => {
    const localStream = get().localStream;
    const nextCameraOff = !get().isCameraOff;

    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });

    set({ isCameraOff: nextCameraOff });
  },

  setNeedsMediaUnlock: (value) => set({ needsMediaUnlock: value }),

  cleanupCall: () => {
    const { localStream, remoteStream, peerConnection } = get();

    stopStream(localStream);
    stopStream(remoteStream);
    peerConnection?.close();

    iceCandidatesQueue = [];

    set({
      status: "idle",
      callId: null,
      conversationId: null,
      callType: "audio",
      peer: null,
      isMuted: false,
      isCameraOff: false,
      needsMediaUnlock: false,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
    });
  },
}));

const createPeerConnection = () => {
  const peerConnection = new RTCPeerConnection({ iceServers });

  peerConnection.onicecandidate = (event) => {
    const { callId, peer } = useCallStore.getState();

    if (!event.candidate || !callId || !peer) return;

    useSocketStore.getState().socket?.emit("call:ice-candidate", {
      callId,
      to: peer._id,
      candidate: event.candidate.toJSON(),
    });
  };

  peerConnection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    useCallStore.setState({
      remoteStream,
      status: "in-call",
    });
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "failed") {
      useCallStore.getState().endCall("connection-lost");
    }
  };

  return peerConnection;
};
