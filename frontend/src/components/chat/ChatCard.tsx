import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { Ban, LogOut, MoreHorizontal, Trash2, Undo2, UserPlus, Users } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
//thẻ chat gồm avatar, tin chưa đọc, thời gian tin gần nhất
interface ChatCardProps {
    convoId: string;
    name: string;
    timestamp?: Date;
    isActive: boolean;
    onSelect: (id: string) => void;
    unreadCount?: number;
    leftSection: React.ReactNode;
    subtitle: React.ReactNode;
    onClearMessages?: (id: string) => void;
    onLeaveGroup?: (id: string) => void;
    onViewMembers?: () => void;
    onAddMembers?: () => void;
    blockStatus?: "none" | "blocked_by_me" | "blocked_me";
    onToggleBlock?: () => void;
}

const ChatCard = ({
    convoId,
    name,
    timestamp,
    isActive,
    onSelect,
    unreadCount,
    leftSection,
    subtitle,
    onClearMessages,
    onLeaveGroup,
    onViewMembers,
    onAddMembers,
    blockStatus,
    onToggleBlock,
}: ChatCardProps) => {
    const canToggleBlock = Boolean(onToggleBlock) && blockStatus !== "blocked_me";
    const isBlockedByMe = blockStatus === "blocked_by_me";

    return (
        <Card
            key={convoId}
            className={cn(
                "group border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
                isActive &&
                "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
            )}
            onClick={() => onSelect(convoId)}
        >
            <div className="flex items-center gap-3">
                <div className="relative">{leftSection}</div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3
                            className={cn(
                                "font-semibold text-sm truncate",
                                unreadCount && unreadCount > 0 && "text-foreground"
                            )}
                        >
                            {name}
                        </h3>

                        <span className="text-xs text-muted-foreground">
                            {timestamp ? formatOnlineTime(timestamp) : ""}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-1 min-w-0">{subtitle}</div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    title="Conversation options"
                                    className="opacity-0 transition-smooth group-hover:opacity-100 data-[state=open]:opacity-100"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Conversation options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                onClick={(event) => event.stopPropagation()}
                            >
                                {canToggleBlock && (
                                    <DropdownMenuItem onClick={onToggleBlock}>
                                        {isBlockedByMe ? (
                                            <Undo2 className="size-4" />
                                        ) : (
                                            <Ban className="size-4" />
                                        )}
                                        {isBlockedByMe ? "Unblock user" : "Block user"}
                                    </DropdownMenuItem>
                                )}
                                {onViewMembers && (
                                    <DropdownMenuItem onClick={onViewMembers}>
                                        <Users className="size-4" />
                                        Group members
                                    </DropdownMenuItem>
                                )}
                                {onAddMembers && (
                                    <DropdownMenuItem onClick={onAddMembers}>
                                        <UserPlus className="size-4" />
                                        Add members
                                    </DropdownMenuItem>
                                )}
                                {onLeaveGroup && (
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => onLeaveGroup(convoId)}
                                    >
                                        <LogOut className="size-4" />
                                        Leave group
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => onClearMessages?.(convoId)}
                                >
                                    <Trash2 className="size-4" />
                                    Delete chat
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ChatCard;
