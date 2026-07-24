import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Search, UserPlus, Users } from "lucide-react";
import type { Participant } from "@/types/chat";
import { useChatStore } from "@/store/useChatStore";
import { useFriendStore } from "@/store/useFriendStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import UserAvatar from "./UserAvatar";

interface AddGroupMembersDialogProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Participant[];
}

const AddGroupMembersDialog = ({
  conversationId,
  open,
  onOpenChange,
  members,
}: AddGroupMembersDialogProps) => {
  const [search, setSearch] = useState("");
  const { friends, getFriends } = useFriendStore();
  const { loading, addGroupMembers } = useChatStore();

  const memberIds = useMemo(
    () => new Set(members.map((member) => member._id)),
    [members]
  );
  const filteredFriends = useMemo(
    () =>
      friends.filter((friend) =>
        friend.displayName.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [friends, search]
  );

  const handleOpenChange = async (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (nextOpen) {
      await getFriends();
      return;
    }

    setSearch("");
  };

  const handleAddMember = async (friendId: string) => {
    try {
      await addGroupMembers(conversationId, [friendId]);
      toast.success("Member added to group.");
    } catch {
      toast.error("Could not add this member. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl capitalize">
            <UserPlus className="size-5" />
            Add members
          </DialogTitle>
          <DialogDescription>
            Choose friends to add to this group chat.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search friends..."
            className="pl-9"
          />
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredFriends.map((friend) => {
            const isInGroup = memberIds.has(friend._id);

            return (
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

                  {isInGroup ? (
                    <Badge variant="secondary">
                      <Check className="size-3" />
                      In group
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Add to group"
                      disabled={loading}
                      onClick={() => handleAddMember(friend._id)}
                    >
                      <UserPlus className="size-4" />
                      <span className="sr-only">Add to group</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredFriends.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="size-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No friends found.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupMembersDialog;
