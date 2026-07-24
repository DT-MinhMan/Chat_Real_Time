import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

//Quản lý state liên quan đến thông tin người dùng
export const useUserStore = create<UserState>(() => ({
  updateProfile: async (payload) => {
    try {
      const updatedUser = await userService.updateProfile(payload);

      useAuthStore.getState().setUser(updatedUser);
      useChatStore.getState().fetchConversations();
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Error when updateProfile", error);
      toast.error("Update profile fail!");
    }
  },

  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Error when updateAvatarUrl", error);
      toast.error("Upload avatar fail!");
    }
  },
}));
