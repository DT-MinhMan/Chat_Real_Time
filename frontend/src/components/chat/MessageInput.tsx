import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useFriendStore } from "@/store/useFriendStore";
import type { Conversation } from "@/types/chat";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Send } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const { friends } = useFriendStore();
  const [value, setValue] = useState("");

  if (!user) return;

  const otherUser =
    selectedConvo.type === "direct"
      ? selectedConvo.participants.find((p) => p._id !== user._id)
      : null;
  const canSendMessage =
    selectedConvo.type === "group" ||
    Boolean(
      otherUser &&
        selectedConvo.blockStatus !== "blocked_by_me" &&
        selectedConvo.blockStatus !== "blocked_me" &&
        friends.some((friend) => friend._id === otherUser._id)
    );
  const disabledMessage =
    selectedConvo.type === "direct" && selectedConvo.blockStatus === "blocked_by_me"
      ? "You blocked this user."
      : selectedConvo.type === "direct" && selectedConvo.blockStatus === "blocked_me"
        ? "You can not message this user."
        : "You are no longer friends. Add friend again to continue chatting.";

  const sendMessage = async () => {
    if (!canSendMessage) {
      toast.error(disabledMessage);
      return;
    }

    if (!value.trim()) return;
    const currValue = value;
    setValue("");

    try {
      if (selectedConvo.type === "direct") {
        if (!otherUser) return;
        await sendDirectMessage(otherUser._id, currValue);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error when send message. Pls try again!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-2 p-3 min-h-[56px] bg-background">
      {!canSendMessage && (
        <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
          {disabledMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 transition-smooth"
          disabled={!canSendMessage}
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyPress={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              canSendMessage
                ? "Typing..."
                : disabledMessage
            }
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
            disabled={!canSendMessage}
          />
          {canSendMessage && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-primary/10 transition-smooth"
              >
                <div>
                  <EmojiPicker
                    onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                  />
                </div>
              </Button>
            </div>
          )}
        </div>

        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={!canSendMessage || !value.trim()}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
