import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("vibria_admin_token");
  if (!token) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}
