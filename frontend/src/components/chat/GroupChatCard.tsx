import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import type { Conversation } from "@/types/chat";
import AddGroupMembersDialog from "./AddGroupMembersDialog";
import ChatCard from "./ChatCard";
import GroupChatAvatar from "./GroupChatAvatar";
import GroupMembersDialog from "./GroupMembersDialog";
import UnreadCountBadge from "./UnreadCountBadge";

const GroupChatCard = ({ convo }: { convo: Conversation }) => {
  const [membersOpen, setMembersOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const { user } = useAuthStore();
  const {
    activeConversationId,
    clearConversationMessagesForMe,
    leaveGroupConversation,
    setActiveConversation,
    messages,
    fetchMessages,
  } = useChatStore();

  if (!user) return null;

  const unreadCount = convo.unreadCounts[user._id];
  const name = convo.group?.name ?? "";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  const handleClearMessages = async (id: string) => {
    try {
      await clearConversationMessagesForMe(id);
      toast.success("Chat deleted for you.");
    } catch {
      toast.error("Could not delete this chat. Please try again.");
    }
  };

  const handleLeaveGroup = async (id: string) => {
    try {
      await leaveGroupConversation(id);
      toast.success("You left the group.");
    } catch {
      toast.error("Could not leave this group. Please try again.");
    }
  };

  return (
    <>
      <ChatCard
        convoId={convo._id}
        name={name}
        timestamp={
          convo.lastMessage?.createdAt
            ? new Date(convo.lastMessage.createdAt)
            : undefined
        }
        isActive={activeConversationId === convo._id}
        onSelect={handleSelectConversation}
        onClearMessages={handleClearMessages}
        onLeaveGroup={handleLeaveGroup}
        onViewMembers={() => setMembersOpen(true)}
        onAddMembers={() => setAddMembersOpen(true)}
        unreadCount={unreadCount}
        leftSection={
          <>
            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
            <GroupChatAvatar participants={convo.participants} type="chat" />
          </>
        }
        subtitle={
          <p className="text-sm truncate text-muted-foreground">
            {convo.participants.length} Member
          </p>
        }
      />

      <GroupMembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        members={convo.participants}
      />

      <AddGroupMembersDialog
        conversationId={convo._id}
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        members={convo.participants}
      />
    </>
  );
};

export default GroupChatCard;
