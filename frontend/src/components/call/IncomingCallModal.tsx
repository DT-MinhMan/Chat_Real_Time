import { Phone, PhoneOff, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { useCallStore } from "@/store/useCallStore";

const IncomingCallModal = () => {
  const { status, peer, callType, acceptCall, rejectCall } = useCallStore();
  const isOpen = status === "ringing";

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <UserAvatar
            type="profile"
            name={peer?.displayName || "User"}
            avatarUrl={peer?.avatarUrl || undefined}
          />
          <DialogTitle>{peer?.displayName || "Incoming call"}</DialogTitle>
          <DialogDescription className="flex items-center justify-center gap-2">
            {callType === "video" ? (
              <Video className="size-4" />
            ) : (
              <Phone className="size-4" />
            )}
            Incoming {callType} call
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="destructive"
            className="h-11"
            onClick={rejectCall}
          >
            <PhoneOff className="size-4" />
            Reject
          </Button>
          <Button type="button" className="h-11" onClick={acceptCall}>
            <Phone className="size-4" />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallModal;
