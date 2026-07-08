import { Phone, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/chat/UserAvatar";
import { useCallStore } from "@/store/useCallStore";
import CallControls from "./CallControls";
import MediaVideo from "./MediaVideo";

const CallWindow = () => {
  const {
    status,
    peer,
    callType,
    localStream,
    remoteStream,
    needsMediaUnlock,
    setNeedsMediaUnlock,
  } = useCallStore();

  if (status === "idle" || status === "ringing") {
    return null;
  }

  const isVideoCall = callType === "video";
  const statusText =
    status === "calling"
      ? "Calling..."
      : status === "connecting"
      ? "Connecting..."
      : "In call";

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[min(360px,calc(100vw-2rem))]">
      <Card className="overflow-hidden border bg-background shadow-lg">
        <div className="bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              type="chat"
              name={peer?.displayName || "User"}
              avatarUrl={peer?.avatarUrl || undefined}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {peer?.displayName || "Call"}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="size-3" />
                {statusText}
              </p>
            </div>
          </div>
        </div>

        {isVideoCall ? (
          <div className="relative aspect-video bg-black">
            {remoteStream ? (
              <MediaVideo
                stream={remoteStream}
                className="h-full w-full object-cover"
                onBlocked={() => setNeedsMediaUnlock(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/70">
                Waiting for video
              </div>
            )}

            {localStream && (
              <div className="absolute right-3 bottom-3 h-24 w-32 overflow-hidden rounded-md border border-white/30 bg-black">
                <MediaVideo
                  stream={localStream}
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <UserAvatar
              type="profile"
              name={peer?.displayName || "User"}
              avatarUrl={peer?.avatarUrl || undefined}
            />
            <p className="mt-3 text-sm text-muted-foreground">{statusText}</p>
            {remoteStream && (
              <MediaVideo
                stream={remoteStream}
                className="pointer-events-none absolute size-0 opacity-0"
                onBlocked={() => setNeedsMediaUnlock(true)}
              />
            )}
          </div>
        )}

        {needsMediaUnlock && (
          <div className="px-4 pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                window.dispatchEvent(new Event("call:unlock-media"));
                setNeedsMediaUnlock(false);
              }}
            >
              <Volume2 className="size-4" />
              Enable audio
            </Button>
          </div>
        )}

        <div className="px-4 py-4">
          <CallControls />
        </div>
      </Card>
    </div>
  );
};

export default CallWindow;
