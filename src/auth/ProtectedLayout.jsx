import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedLayout() {
    const { isAuthenticated, ready } = useAuth();
    const location = useLocation();

    if (!ready) return null; // aquí puedes poner un loader

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
