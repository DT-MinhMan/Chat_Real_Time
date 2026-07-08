import type { Participant } from "./chat";

export type CallType = "audio" | "video";

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "in-call"
  | "ended";

export interface CallPeer {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface IncomingCallPayload {
  callId: string;
  conversationId: string;
  callerId: string;
  caller: CallPeer;
  callType: CallType;
}

export interface CallState {
  status: CallStatus;
  callId: string | null;
  conversationId: string | null;
  callType: CallType;
  peer: CallPeer | null;
  isMuted: boolean;
  isCameraOff: boolean;
  needsMediaUnlock: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  startCall: (params: {
    conversationId: string;
    receiver: Participant;
    callType: CallType;
  }) => Promise<void>;
  receiveIncomingCall: (payload: IncomingCallPayload) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: (reason?: string) => void;
  handleOutgoingCall: (payload: {
    callId: string;
    conversationId: string;
    receiverId: string;
    callType: CallType;
  }) => void;
  handleCallAccepted: (payload: { callId: string; receiverId: string }) => Promise<void>;
  handleCallRejected: (payload: { callId: string; reason?: string }) => void;
  handleRemoteEndCall: (payload: { callId: string; reason?: string; status?: string }) => void;
  handleOffer: (payload: {
    callId: string;
    from: string;
    sdp: RTCSessionDescriptionInit;
  }) => Promise<void>;
  handleAnswer: (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => Promise<void>;
  handleIceCandidate: (payload: {
    callId: string;
    candidate: RTCIceCandidateInit;
  }) => Promise<void>;
  handleCallError: (payload?: { reason?: string }) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setNeedsMediaUnlock: (value: boolean) => void;
  cleanupCall: () => void;
}
