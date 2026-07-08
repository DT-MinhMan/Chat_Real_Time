import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/store/useCallStore";
import type { Conversation, Participant } from "@/types/chat";

interface CallButtonProps {
  conversation: Conversation;
  receiver: Participant;
  disabled?: boolean;
}

const CallButton = ({ conversation, receiver, disabled }: CallButtonProps) => {
  const { startCall, status } = useCallStore();
  const isDisabled = disabled || status !== "idle";

  return (
    <div className="ml-auto flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isDisabled}
        title="Voice call"
        onClick={() =>
          startCall({
            conversationId: conversation._id,
            receiver,
            callType: "audio",
          })
        }
      >
        <Phone className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isDisabled}
        title="Video call"
        onClick={() =>
          startCall({
            conversationId: conversation._id,
            receiver,
            callType: "video",
          })
        }
      >
        <Video className="size-4" />
      </Button>
    </div>
  );
};

export default CallButton;
