import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ChatAppPage from "./pages/ChatAppPage";
import {Toaster} from "sonner";
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useSocketStore } from "./store/useSocketStore";


function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }

    return () => disconnectSocket();
  }, [accessToken]);
  return <>
    <Toaster richColors/>
    <BrowserRouter>
      <Routes>
        {/* Public Route: đường dẫn không cần xác minh danh tính */}
        <Route
            path="/signin"
            element={<SignInPage />}
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />
        {/* Protected Route: đường dẫn cần đăng nhập mới vào được*/}
           <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={<ChatAppPage />}
            />
          </Route>
        </Routes>
    </BrowserRouter>
  </>;
}

export default App
