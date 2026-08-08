import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";

/**
 * Route guard: while /me is in flight show nothing (no flash of login page);
 * anonymous users get sent to /login remembering where they were headed.
 */
export const RequireAuth = () => {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
};
