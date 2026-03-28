import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authServices";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";


// Store quản lý trạng thái xác thực (authentication) cho toàn bộ ứng dụng bằng Zustand.
// `persist` giúp giữ lại một phần state sau khi reload trang.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // accessToken dùng để gọi các API cần đăng nhập.
      accessToken: null,

      // user là thông tin người dùng hiện tại.
      user: null,

      // loading giúp UI biết lúc nào đang gọi API để hiển thị trạng thái chờ.
      loading: false,

      // Cập nhật accessToken vào state.
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      // Cập nhật thông tin hiện tại của User vào auth state 
      setUser: (user) => {
        set({ user });
      },

      // Xóa toàn bộ state auth và dữ liệu liên quan trong trình duyệt.
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });

        // Reset store chat để tránh giữ dữ liệu phiên cũ.
        useChatStore.getState().reset();

        // Dọn dữ liệu lưu tạm trên browser.
        localStorage.clear();
        sessionStorage.clear();
      },

      // Đăng ký tài khoản mới.
      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true });

          // Gọi API đăng ký.
          await authService.signUp(username, password, email, firstName, lastName);

          toast.success("Sign up successfully! You will redirected to Log in");
        } catch (error) {
          console.error(error);
          toast.error("Sign up failed");
        } finally {
          set({ loading: false });
        }
      },

      // Đăng nhập:
      // 1) Xóa state cũ
      // 2) Lấy accessToken
      // 3) Lấy thông tin user hiện tại bằng fetchMe
      signIn: async (username, password) => {
        try {
          get().clearState();
          set({ loading: true });

          const { accessToken } = await authService.signIn(username, password);
          get().setAccessToken(accessToken);

          await get().fetchMe();
          useChatStore.getState();

          toast.success("Welcome back!!");
        } catch (error) {
          console.error(error);
          toast.error("Log in failed!!");
        } finally {
          // Dù thành công hay lỗi thì đều tắt loading.
          set({ loading: false });
        }
      },

      // Đăng xuất: xóa state local trước, rồi gọi API logout ở server.
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Logout successfully!");
        } catch (error) {
          console.error(error);
          toast.error("Error when logout. Try again!");
        }
      },

      // Lấy thông tin user hiện tại từ backend (thường là endpoint /me).
      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();

          set({ user });
        } catch (error) {
          console.error(error);

          // Nếu fetchMe lỗi, xem như phiên không hợp lệ.
          set({ user: null, accessToken: null });
          toast.error("Error when get user information. Try again!");
        } finally {
          set({ loading: false });
        }
      },

      // Refresh phiên đăng nhập:
      // - Gọi API refresh để lấy token mới.
      // - Nếu chưa có user trong state thì gọi fetchMe để đồng bộ profile.
      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);

          if (!user) {
            await fetchMe();
          }
        } catch (error) {
          console.error(error);
          toast.error("Login session is expired!. Please login again!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      // Tên key lưu trong localStorage.
      name: "auth-storage",

      // Chỉ lưu `user` xuống storage.
      // accessToken không persist để giảm rủi ro bảo mật khi reload trình duyệt.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
