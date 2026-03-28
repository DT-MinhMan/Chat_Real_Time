import { useThemeStore } from "@/store/useThemeStore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Smile } from "lucide-react";
import Picker, { Theme } from "emoji-picker-react"; 

interface EmojiPickerProps {
    onChange: (value: string) => void;
}

const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
    const { isDark } = useThemeStore();

    return (
        <Popover>
            <PopoverTrigger className="cursor-pointer">
                <Smile className="size-4" />
            </PopoverTrigger>

            <PopoverContent
                side="right"
                sideOffset={40}
                className="bg-tranparent border-none shadow-none drop-shadow-none mb-12" 
            >
                <Picker
                    // Cấu hình theme sáng tối dựa trên store
                    theme={isDark ? Theme.DARK : Theme.LIGHT} 
                    onEmojiClick={(emojiObject) => onChange(emojiObject.emoji)} 
                />
            </PopoverContent>
        </Popover>
    );
};

export default EmojiPicker;