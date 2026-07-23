import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import CallMessageItem from "./CallMessageItem";
import { Button } from "../ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useChatStore } from "@/store/useChatStore";
import { toast } from "sonner";

interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
    message,
    index,
    messages,
    selectedConvo,
    lastMessageStatus,
}: MessageItemProps) => {
    const { deleteMessageForMe } = useChatStore();
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const handleDeleteForMe = async () => {
        try {
            await deleteMessageForMe(selectedConvo._id, message._id);
            toast.success("Message deleted for you.");
        } catch {
            toast.error("Could not delete this message. Please try again.");
        }
    };

    const messageOptions = (align: "start" | "end" = "end") => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Message options"
                    className="opacity-0 transition-smooth group-hover/message:opacity-100 data-[state=open]:opacity-100"
                >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Message options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align}>
                <DropdownMenuItem
                    variant="destructive"
                    onClick={handleDeleteForMe}
                >
                    <Trash2 className="size-4" />
                    Delete for me
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const isShowTime =
        index === 0 ||
        new Date(message.createdAt).getTime() -
        new Date(prev?.createdAt || 0).getTime() >
        300000; // nếu 2 tin nhắn cách nhau hơn 5 phút thì hiển thị lại avatar và thời gian


    //Kiểm tra điều kiện có tách nhóm hay không 
    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants.find(
        (p: Participant) => p._id.toString() === message.senderId.toString()
    );

    if (message.type === "call") {
        return (
            <>
                {isShowTime && (
                    <span className="flex justify-center text-xs text-muted-foreground px-1">
                        {formatMessageTime(new Date(message.createdAt))}
                    </span>
                )}
                <div className="group/message flex items-center justify-center gap-1">
                    <CallMessageItem message={message} />
                    {messageOptions("end")}
                </div>
            </>
        );
    }

    return (
        <>
            {/* Thời gian */}
            {isShowTime && (
                <span className="flex justify-center text-xs text-muted-foreground px-1">
                    {formatMessageTime(new Date(message.createdAt))}
                </span>
            )}

            <div
                className={cn(
                    "group/message flex gap-2 message-bounce mt-1",
                    message.isOwn ? "justify-end" : "justify-start"
                )}
            >
                {/* avatar */}
                {!message.isOwn && (
                    <div className="w-8">
                        {isGroupBreak && (
                            <UserAvatar
                                type="chat"
                                name={participant?.displayName ?? "NameUser"}
                                avatarUrl={participant?.avatarUrl ?? undefined}
                            />
                        )}
                    </div>
                )}

                {/* Tin nhắn */}
                <div
                    className={cn(
                        "max-w-xs lg:max-w-md space-y-1 flex flex-col",
                        message.isOwn ? "items-end" : "items-start"
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center gap-1",
                            message.isOwn ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <Card
                            className={cn(
                                "p-3",
                                message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
                            )}
                        >
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        </Card>

                        {messageOptions(message.isOwn ? "end" : "start")}
                    </div>

                    {/* seen/ delivered */}
                    {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs px-1.5 py-0.5 h-4 border-0",
                                lastMessageStatus === "seen"
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {lastMessageStatus}
                        </Badge>
                    )}
                </div>
            </div>
        </>
    );
};

export default MessageItem;
