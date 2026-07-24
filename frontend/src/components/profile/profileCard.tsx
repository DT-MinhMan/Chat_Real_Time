import type { User } from "@/types/user";
import { Card, CardContent } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSocketStore } from "@/store/useSocketStore";
import AvatarUploader from "./avatarUploader";
import { Phone } from "lucide-react";

//Thông tin người dùng
interface ProfileCardProps {
  user: User | null;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  const { onlineUsers } = useSocketStore();
  if (!user) return null;

  const bio = user.bio || "Nothing has been recorded here yet.";
  const isOnline = onlineUsers.includes(user._id);

  return (
    <Card className="overflow-hidden p-0 min-h-52 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <CardContent className="mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="relative">
          <UserAvatar
            type="profile"
            name={user.displayName}
            avatarUrl={user.avatarUrl ?? undefined}
            className="ring-4 ring-white shadow-lg"
          />

          <AvatarUploader />
        </div>

        {/* user info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {user.displayName}
          </h1>

          <p className="text-white/70 text-sm mt-2 max-w-lg line-clamp-2">
            {bio}
          </p>

          {user.phone && (
            <p className="inline-flex items-center gap-2 text-white/80 text-sm mt-2">
              <Phone className="size-4" />
              {user.phone}
            </p>
          )}
        </div>

        {/* status */}
        <Badge
          className={cn(
            "flex items-center gap-1 capitalize",
            isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500"
            )}
          />

          {isOnline ? "online" : "offline"}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
