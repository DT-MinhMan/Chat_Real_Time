import { useFriendStore } from "@/store/useFriendStore";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Users } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import IniviteSuggestionList from "../newGroupChat/IniviteSuggestionList";
import SelectedUsersList from "../newGroupChat/SelectedUserList";
import { toast } from "sonner";
import { useChatStore } from "@/store/useChatStore";

//Tạo nhóm chat mới
const NewGroupChatModal = () => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const { friends, getFriends } = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const { loading, createConversation } = useChatStore();

  const handleGetFriends = async () => {
    await getFriends();
  };

  //Thêm người vừa được mời vào danh sách group chat
  const handleSelectFriend = (friend: Friend) => {
    setInvitedUsers([...invitedUsers, friend]);
    setSearch("");
  };

  //Xóa người dùng khỏi danh sách
  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers(invitedUsers.filter((u) => u._id !== friend._id));
  };

  //Submit 
  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (invitedUsers.length === 0) {
        toast.warning("You must invite at least one member to the group.");
        return;
      }

      await createConversation(
        "group",
        groupName,
        invitedUsers.map((u) => u._id)
      );

      setSearch("");
      setInvitedUsers([]);
    } catch (error) {
      console.error("Error when handlingSubmit in NewGroupChatModal.:", error);
    }
  };


//Hiển thị user gợi ý dựa trên tên nhập 
  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !invitedUsers.some((u) => u._id === friend._id)
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Create a group"
          onClick={handleGetFriends}
          className="cursor-pointer"
        >
          <Users className="size-4" />
          <span className="sr-only">Create a group</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle className="capitalize">create a new group chat</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          {/* tên nhóm */}
          <div className="space-y-2">
            <Label
              htmlFor="groupName"
              className="text-sm font-semibold"
            >
              Group name
            </Label>
            <Input
              id="groupName"
              placeholder="Type the group name here...."
              className="glass border-border/50 focus:border-primary/50 transition-smooth"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* mời thành viên */}
          <div className="space-y-2">
            <Label
              htmlFor="invite"
              className="text-sm font-semibold"
            >
              Invite members
            </Label>

            <Input
              id="invite"
              placeholder="Search by display name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />

            {/* danh sách gợi ý */}
            {search && filteredFriends.length > 0 && (
              <IniviteSuggestionList
                filteredFriends={filteredFriends}
                onSelect={handleSelectFriend}
              />
            )}

            {/* danh sách user đã chọn */}
            <SelectedUsersList
              invitedUsers={invitedUsers}
              onRemove={handleRemoveFriend}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <UserPlus className="size-4 mr-2" />
                  Create a group
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatModal;
