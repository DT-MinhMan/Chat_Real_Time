import { Phone, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import UserAvatar from "./UserAvatar";

interface UserProfileHoverCardProps {
  user: {
    _id: string;
    username?: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string;
    phone?: string;
  };
  isOnline: boolean;
}

const UserProfileHoverCard = ({ user, isOnline }: UserProfileHoverCardProps) => {
  const bio = user.bio?.trim() || "Nothing has been recorded here yet.";

  return (
    <Card
      className="w-72 overflow-hidden border-border/70 bg-popover p-0 text-popover-foreground shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between gap-3">
          <UserAvatar
            type="chat"
            name={user.displayName}
            avatarUrl={user.avatarUrl ?? undefined}
            className="size-16 border-4 border-popover text-xl shadow-md"
          />

          <Badge
            className={cn(
              "mb-1 flex items-center gap-1 capitalize",
              isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-slate-500"
              )}
            />
            {isOnline ? "online" : "offline"}
          </Badge>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <h4 className="truncate text-base font-semibold">{user.displayName}</h4>
            {user.username && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <UserRound className="size-3.5" />
                {user.username}
              </p>
            )}
          </div>

          <p className="line-clamp-3 text-sm text-muted-foreground">{bio}</p>

          {user.phone && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" />
              {user.phone}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserProfileHoverCard;
