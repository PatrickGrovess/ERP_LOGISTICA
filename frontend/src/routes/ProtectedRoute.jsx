import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../context/AuthContext";

const ProtectedRoute = ({allowedRoles}) => {

    const {user, token, loading} = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;

}

export default ProtectedRoute;