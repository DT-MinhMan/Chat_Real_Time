import { Bell, ChevronsUpDown, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { User } from "@/types/user";
import Logout from "../auth/Logout";
import { useState } from "react";
import FriendRequestDialog from "../friendRequest/FriendRequestDialog";
import ProfileDialog from "../profile/profileDialog";
import { useFriendStore } from "@/store/useFriendStore";
import { Badge } from "../ui/badge";

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar();
  const [friendRequestOpen, setfriendRequestOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const receivedRequestCount = useFriendStore(
    (state) => state.receivedList.length
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.displayName}</span>
                  <span className="truncate text-xs">{user.username}</span>
                </div>
                <div className="relative ml-auto flex items-center">
                  {receivedRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-destructive ring-2 ring-sidebar" />
                  )}
                  <ChevronsUpDown className="size-4" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.username}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.displayName}</span>
                    <span className="truncate text-xs">{user.username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <UserIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setfriendRequestOpen(true)}>
                  <div className="relative">
                    <Bell className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                    {receivedRequestCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <span className="flex-1">Notifications</span>
                  {receivedRequestCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto min-w-5 px-1.5"
                    >
                      {receivedRequestCount > 99 ? "99+" : receivedRequestCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                variant="destructive"
              >
                <Logout />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <FriendRequestDialog
        open={friendRequestOpen}
        setOpen={setfriendRequestOpen}
      />

      <ProfileDialog
        open={profileOpen}
        setOpen={setProfileOpen}
      />
    </>
  );
}
