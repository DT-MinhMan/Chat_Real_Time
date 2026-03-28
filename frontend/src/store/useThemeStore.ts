import type { ThemeState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Store quản lý logic và state liên quan đến giao diện sáng/tối.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // isDark = true: dark mode, false: light mode.
      isDark: false,

      // Đảo trạng thái theme hiện tại.
      toggleTheme: () => {
        const newValue = !get().isDark;
        set({ isDark: newValue });

        // Đồng bộ class `dark` vào thẻ html để CSS áp dụng đúng theme.
        if (newValue) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      // Đặt theme theo giá trị truyền vào.
      setTheme: (dark: boolean) => {
        set({ isDark: dark });

        // Đồng bộ class `dark` vào thẻ html.
        if (dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    {
      // Key dùng để persist lựa chọn theme trong localStorage.
      name: "theme-storage",
    }
  )
);
