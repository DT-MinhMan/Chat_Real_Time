import { friendService } from "@/services/friendService";
import axios from "axios";
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

  // Tìm người dùng theo display name.
  searchByDisplayName: async (displayName) => {
    try {
      set({ loading: true });

      const user = await friendService.searchByDisplayName(displayName);

      return user;
    } catch (error) {
      console.error("Error when find user by display name", error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // Gửi lời mời kết bạn đến người dùng khác.
  addFriend: async (to, message) => {
    try {
      set({ loading: true });
      const result = await friendService.sendFriendRequest(to, message);

      if (result.request) {
        get().addSentRequest(result.request);
      }

      return result.message;
    } catch (error) {
      console.error("Error when call addFriend", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      throw new Error(message ?? "Error when send request add friend. Please try again");
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
      const newFriend = await friendService.acceptRequest(requestId);

      get().removeRequestFromState(requestId);

      if (newFriend) {
        get().addFriendToState(newFriend);
      }
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

      get().removeRequestFromState(requestId);
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

  // Xóa bạn bè và cập nhật lại danh sách trong store.
  removeFriend: async (friendId) => {
    try {
      set({ loading: true });
      await friendService.removeFriend(friendId);

      get().removeFriendFromState(friendId);
    } catch (error) {
      console.error("Error when call removeFriend", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  blockUser: async (userId) => {
    try {
      set({ loading: true });
      await friendService.blockUser(userId);
    } catch (error) {
      console.error("Error when call blockUser", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  unblockUser: async (userId) => {
    try {
      set({ loading: true });
      await friendService.unblockUser(userId);
    } catch (error) {
      console.error("Error when call unblockUser", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addReceivedRequest: (request) => {
    set((state) => {
      if (state.receivedList.some((item) => item._id === request._id)) {
        return state;
      }

      return { receivedList: [request, ...state.receivedList] };
    });
  },

  addSentRequest: (request) => {
    set((state) => {
      if (state.sentList.some((item) => item._id === request._id)) {
        return state;
      }

      return { sentList: [request, ...state.sentList] };
    });
  },

  removeRequestFromState: (requestId) => {
    set((state) => ({
      receivedList: state.receivedList.filter((request) => request._id !== requestId),
      sentList: state.sentList.filter((request) => request._id !== requestId),
    }));
  },

  addFriendToState: (friend) => {
    set((state) => {
      if (state.friends.some((item) => item._id === friend._id)) {
        return state;
      }

      return { friends: [friend, ...state.friends] };
    });
  },

  removeFriendFromState: (friendId) => {
    set((state) => ({
      friends: state.friends.filter((friend) => friend._id !== friendId),
    }));
  },
}));
