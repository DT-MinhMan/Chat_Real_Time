import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/store/useCallStore";

const CallControls = () => {
  const {
    callType,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    endCall,
  } = useCallStore();

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant={isMuted ? "secondary" : "outline"}
        size="icon"
        title={isMuted ? "Unmute" : "Mute"}
        onClick={toggleMute}
      >
        {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </Button>

      {callType === "video" && (
        <Button
          type="button"
          variant={isCameraOff ? "secondary" : "outline"}
          size="icon"
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
          onClick={toggleCamera}
        >
          {isCameraOff ? (
            <VideoOff className="size-4" />
          ) : (
            <Video className="size-4" />
          )}
        </Button>
      )}

      <Button
        type="button"
        variant="destructive"
        size="icon"
        title="End call"
        onClick={() => endCall()}
      >
        <PhoneOff className="size-4" />
      </Button>
    </div>
  );
};

export default CallControls;
