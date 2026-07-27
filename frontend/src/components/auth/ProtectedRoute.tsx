// Kiểm tra người dùng có quyền truy cập vào route hay không 
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  //Component vừa được render lần đầu
  const init = async () => {
    // Nếu người dùng vừa reload trang
    if (!accessToken) {
      await refresh();
    }

    // Có token mà chưa có thông tin người dùng
    if (accessToken && !user) {
      await fetchMe();
    }

    setStarting(false);
    };

    useEffect(() => {
        init();
    }, []);

    // Tránh trường hợp người dùng vừa đăng nhập đã reload trang
    if (starting || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
            The first time you access it, it might take about 20-30 seconds. Please hang on for a moment!
        </div>
        );
    }

    if (!accessToken) {
        return (
            <Navigate 
                to="/signin"
                replace
            />
        );
    }
  // Dùng Outlet để hiển thị route con trong route cha
  // Protected route sẽ là route cha bọc tất cả các route cần được bảo vệ còn lại
    return <Outlet></Outlet>;
};

export default ProtectedRoute;