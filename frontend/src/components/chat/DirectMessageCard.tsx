import { useState } from "react";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/store/useSocketStore";
import { useFriendStore } from "@/store/useFriendStore";
import { toast } from "sonner";
import UserProfileHoverCard from "./UserProfileHoverCard";
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover";

//Phần tin nhắn trực tiếp 
const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user } = useAuthStore();
    const {
        activeConversationId,
        clearConversationMessagesForMe,
        setActiveConversation,
        messages,
        fetchMessages,
        updateConversation,
    } = useChatStore();
    const { blockUser, unblockUser } = useFriendStore();
    const { onlineUsers } = useSocketStore();

    if (!user) return null;

    //Tìm kiếm người đang trò chuyện trực tiếp
    const otherUser = convo.participants.find((p) => p._id !== user._id);
    if (!otherUser) return null;

    //Số lượng tin chưa đọc
    const unreadCount = convo.unreadCounts[user._id];
    //Nội dung tin chưa đọc
    const lastMessage = convo.lastMessage?.content ?? "";

    //Khi người dùng click vào hội thoại  
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

    const handleToggleBlock = async () => {
        try {
            if (convo.blockStatus === "blocked_by_me") {
                await unblockUser(otherUser._id);
                updateConversation({ _id: convo._id, blockStatus: "none" });
                toast.success("User unblocked.");
                return;
            }

            await blockUser(otherUser._id);
            updateConversation({ _id: convo._id, blockStatus: "blocked_by_me" });
            toast.success("User blocked.");
        } catch {
            toast.error("Could not update block status. Please try again.");
        }
    };

    return (
        <ChatCard
            convoId={convo._id}
            name={otherUser.displayName ?? ""}
            timestamp={
                convo.lastMessage?.createdAt
                    ? new Date(convo.lastMessage.createdAt)
                    : undefined
            }
            isActive={activeConversationId === convo._id}
            onSelect={handleSelectConversation}
            onClearMessages={handleClearMessages}
            blockStatus={convo.blockStatus ?? "none"}
            onToggleBlock={handleToggleBlock}
            unreadCount={unreadCount}
            leftSection={
                <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    <PopoverAnchor asChild>
                        <div
                            className="relative"
                            onMouseEnter={() => setIsProfileOpen(true)}
                            onMouseLeave={() => setIsProfileOpen(false)}
                        >
                            <UserAvatar
                                type="sidebar"
                                name={otherUser.displayName ?? ""}
                                avatarUrl={otherUser.avatarUrl ?? undefined}
                            />
                            <StatusBadge
                                status={
                                    onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
                                }
                            />
                            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
                        </div>
                    </PopoverAnchor>
                    <PopoverContent
                        side="right"
                        align="start"
                        sideOffset={12}
                        className="w-auto border-0 bg-transparent p-0 shadow-none"
                        onMouseEnter={() => setIsProfileOpen(true)}
                        onMouseLeave={() => setIsProfileOpen(false)}
                    >
                        <UserProfileHoverCard
                            user={otherUser}
                            isOnline={onlineUsers.includes(otherUser?._id ?? "")}
                        />
                    </PopoverContent>
                </Popover>
            }
            subtitle={
                <p
                    className={cn(
                        "text-sm truncate",
                        unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                >
                    {lastMessage}
                </p>
            }
        />
    );
};

export default DirectMessageCard;
