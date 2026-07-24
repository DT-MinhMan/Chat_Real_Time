import api from "@/lib/axios";
import type { ChangePasswordPayload, UpdateProfilePayload } from "@/types/user";

//Gọi api liên quan đến usercontroller
export const userService = {
  updateProfile: async (payload: UpdateProfilePayload) => {
    const res = await api.patch("/users/me", payload);

    return res.data.user;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const res = await api.patch("/users/me/password", payload);

    return res.data;
  },

  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
};
