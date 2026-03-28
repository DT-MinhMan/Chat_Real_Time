import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";

// Store quản lý trạng thái bạn bè và lời mời kết bạn.
export const useFriendStore = create<FriendState>((set, get) => ({
  // Danh sách bạn bè hiện tại.
  friends: [],

  // Cờ loading chung cho các thao tác trong store.
  loading: false,

  // Danh sách lời mời đã nhận.
  receivedList: [],

  // Danh sách lời mời đã gửi.
  sentList: [],

  // Tìm người dùng theo username.
  searchByUsername: async (username) => {
    try {
      set({ loading: true });

      const user = await friendService.searchByUsername(username);

      return user;
    } catch (error) {
      console.error("Error when find user by username", error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // Gửi lời mời kết bạn đến người dùng khác.
  addFriend: async (to, message) => {
    try {
      set({ loading: true });
      const resultMessage = await friendService.sendFriendRequest(to, message);
      return resultMessage;
    } catch (error) {
      console.error("Error when call addFriend", error);
      return "Error when send request add friend. Please try again";
    } finally {
      set({ loading: false });
    }
  },

  // Lấy toàn bộ lời mời kết bạn (đã nhận + đã gửi).
  getAllFriendRequests: async () => {
    try {
      set({ loading: true });

      const result = await friendService.getAllFriendRequest();

      if (!result) return;

      const { received, sent } = result;

      set({ receivedList: received, sentList: sent });
    } catch (error) {
      console.error("Error when call getAllFriendRequests", error);
    } finally {
      set({ loading: false });
    }
  },

  // Chấp nhận lời mời kết bạn và xóa request đó khỏi danh sách đã nhận.
  acceptRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.error("Error when call acceptRequest", error);
    } finally {
      set({ loading: false });
    }
  },

  // Từ chối lời mời kết bạn và xóa request đó khỏi danh sách đã nhận.
  declineRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.declineRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.error("Error when call declineRequest", error);
    } finally {
      set({ loading: false });
    }
  },

  // Lấy danh sách bạn bè hiện tại.
  getFriends: async () => {
    try {
      set({ loading: true });
      const friends = await friendService.getFriendList();
      set({ friends: friends });
    } catch (error) {
      console.error("Error when call load friends", error);

      // Nếu lỗi thì đưa về mảng rỗng để tránh hiển thị dữ liệu cũ.
      set({ friends: [] });
    } finally {
      set({ loading: false });
    }
  },
}));
