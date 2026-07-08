
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import CallWindow from "@/components/call/CallWindow";
import IncomingCallModal from "@/components/call/IncomingCallModal";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const ChatAppPage = () => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-screen w-full p-2">
        <ChatWindowLayout />
      </div>

      <IncomingCallModal />
      <CallWindow />
    </SidebarProvider>
  );
};

export default ChatAppPage;
