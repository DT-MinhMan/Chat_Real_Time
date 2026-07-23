import api from "@/lib/axios";

export const friendService = {
  async searchByUsername(username: string) {
    const res = await api.get(`/users/search?username=${username}`);
    return res.data.user;
  },

  async sendFriendRequest(to: string, message?: string) {
    const res = await api.post("/friends/requests", { to, message });
    return res.data;
  },

  async getAllFriendRequest() {
    try {
      const res = await api.get("/friends/requests");
      const { sent, received } = res.data;
      return { sent, received };
    } catch (error) {
      console.error("Error when calll getAllFriendRequest", error);
    }
  },

  async acceptRequest(requestId: string) {
    try {
      const res = await api.post(`/friends/requests/${requestId}/accept`);
      return res.data.newFriend;
    } catch (error) {
      console.error("Error when call acceptRequest", error);
    }
  },

  async declineRequest(requestId: string) {
    try {
      await api.post(`/friends/requests/${requestId}/decline`);
    } catch (error) {
      console.error("Error when call declineRequest", error);
    }
  },

  async getFriendList() {
    const res = await api.get("/friends");
    return res.data.friends;
  },

  async removeFriend(friendId: string) {
    await api.delete(`/friends/${friendId}`);
  },

  async blockUser(userId: string) {
    const res = await api.post(`/friends/blocks/${userId}`);
    return res.data;
  },

  async unblockUser(userId: string) {
    const res = await api.delete(`/friends/blocks/${userId}`);
    return res.data;
  },
};
