import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, UserMinus, Users } from "lucide-react";
import type { Friend } from "@/types/user";
import { useChatStore } from "@/store/useChatStore";
import { useFriendStore } from "@/store/useFriendStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserAvatar from "@/components/chat/UserAvatar";

const FriendListDialog = () => {
  const [open, setOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const { friends, getFriends, loading, removeFriend } = useFriendStore();
  const { createConversation } = useChatStore();

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      setFriendToRemove(null);
      await getFriends();
    }
  };

  const handleStartChat = async (friendId: string) => {
    await createConversation("direct", "", [friendId]);
    setOpen(false);
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;

    try {
      await removeFriend(friendToRemove._id);
      toast.success("Friend removed successfully.");
      setFriendToRemove(null);
    } catch {
      toast.error("Could not remove this friend. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Friend list"
          className="cursor-pointer"
        >
          <Users className="size-4" />
          <span className="sr-only">Friend list</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="glass max-w-md">
        {!friendToRemove ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl capitalize">
                <Users className="size-5" />
                Friend list
              </DialogTitle>
              <DialogDescription>
                All your friends are listed here. You can start a conversation or remove them from your friend list.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {friends.map((friend) => (
                <Card
                  key={friend._id}
                  className="p-3 glass transition-smooth hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      type="sidebar"
                      name={friend.displayName}
                      avatarUrl={friend.avatarUrl}
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold">
                        {friend.displayName}
                      </h2>
                      <span className="block truncate text-sm text-muted-foreground">
                        @{friend.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Send message"
                        onClick={() => handleStartChat(friend._id)}
                      >
                        <MessageCircle className="size-4" />
                        <span className="sr-only">Send message</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Remove friend"
                        onClick={() => setFriendToRemove(friend)}
                      >
                        <UserMinus className="size-4 text-destructive" />
                        <span className="sr-only">Remove friend</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {!loading && friends.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">You don't have any friends yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Remove friend?</DialogTitle>
              <DialogDescription>
                {friendToRemove.displayName} will be removed from your friend
                list. Your old conversation will stay available.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={handleRemoveFriend}
              >
                Remove
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setFriendToRemove(null)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FriendListDialog;
