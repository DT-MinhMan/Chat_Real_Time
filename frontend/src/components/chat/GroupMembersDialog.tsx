import { useMemo } from "react";
import { toast } from "sonner";
import { Check, UserPlus, Users } from "lucide-react";
import type { Participant } from "@/types/chat";
import { useAuthStore } from "@/store/useAuthStore";
import { useFriendStore } from "@/store/useFriendStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserAvatar from "./UserAvatar";

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Participant[];
}

const GroupMembersDialog = ({
  open,
  onOpenChange,
  members,
}: GroupMembersDialogProps) => {
  const { user } = useAuthStore();
  const { friends, sentList, loading, getFriends, getAllFriendRequests, addFriend } =
    useFriendStore();

  const friendIds = useMemo(
    () => new Set(friends.map((friend) => friend._id)),
    [friends]
  );
  const sentRequestUserIds = useMemo(
    () => new Set(sentList.map((request) => request.to?._id).filter(Boolean)),
    [sentList]
  );

  const handleOpenChange = async (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (nextOpen) {
      await Promise.all([getFriends(), getAllFriendRequests()]);
    }
  };

  const handleAddFriend = async (member: Participant) => {
    try {
      const message = await addFriend(member._id);
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send friend request. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl capitalize">
            <Users className="size-5" />
            Group members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {members.map((member) => {
            const isMe = member._id === user?._id;
            const isFriend = friendIds.has(member._id);
            const isPending = sentRequestUserIds.has(member._id);

            return (
              <Card
                key={member._id}
                className="p-3 glass transition-smooth hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    type="sidebar"
                    name={member.displayName}
                    avatarUrl={member.avatarUrl ?? undefined}
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold">
                      {member.displayName}
                    </h2>
                    {member.username && (
                      <span className="block truncate text-sm text-muted-foreground">
                        @{member.username}
                      </span>
                    )}
                  </div>

                  {isMe && <Badge variant="secondary">You</Badge>}

                  {!isMe && isFriend && (
                    <Badge variant="secondary">
                      <Check className="size-3" />
                      Friends
                    </Badge>
                  )}

                  {!isMe && !isFriend && isPending && (
                    <Badge variant="outline">Pending</Badge>
                  )}

                  {!isMe && !isFriend && !isPending && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Add friend"
                      disabled={loading}
                      onClick={() => handleAddFriend(member)}
                    >
                      <UserPlus className="size-4" />
                      <span className="sr-only">Add friend</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersDialog;
