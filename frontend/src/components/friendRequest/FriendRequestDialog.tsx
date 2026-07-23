import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriendStore } from "@/store/useFriendStore";
import SentRequests from "./SendRequest";
import ReceivedRequests from "./ReceivedRequest";

//Hiển thị pop up hiển thị lời mời kết bạn 
interface FriendRequestDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const FriendRequestDialog = ({ open, setOpen }: FriendRequestDialogProps) => {
    const [tab, setTab] = useState("received");
    const { getAllFriendRequests } = useFriendStore();

    useEffect(() => {
        if (!open) return;

        const loadRequest = async () => {
            try {
                await getAllFriendRequests();
            } catch (error) {
                console.error("Error when load requests", error);
            }
        };

        loadRequest();
    }, [getAllFriendRequests, open]);

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Friend request</DialogTitle>
                </DialogHeader>
                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="received">Received</TabsTrigger>
                        <TabsTrigger value="sent">Sended</TabsTrigger>
                    </TabsList>

                    <TabsContent value="received">
                        <ReceivedRequests />
                    </TabsContent>

                    <TabsContent value="sent">
                        <SentRequests />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default FriendRequestDialog;
