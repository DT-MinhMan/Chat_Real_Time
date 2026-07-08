import { Phone, PhoneMissed, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

const formatDuration = (seconds = 0) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const CallMessageItem = ({ message }: { message: Message }) => {
  const meta = message.callMeta;
  const isMissed = meta?.status === "missed";
  const Icon = isMissed ? PhoneMissed : meta?.callType === "video" ? Video : Phone;

  const label =
    meta?.status === "completed"
      ? `${meta.callType === "video" ? "Video call" : "Voice call"} - ${formatDuration(
          meta.duration
        )}`
      : message.content || "Call ended";

  return (
    <div className="my-2 flex justify-center">
      <div
        className={cn(
          "inline-flex max-w-[80%] items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm",
          isMissed && "text-destructive"
        )}
      >
        <Icon className="size-4" />
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
};

export default CallMessageItem;
