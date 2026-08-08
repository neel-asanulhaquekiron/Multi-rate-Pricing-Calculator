import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

/** App chrome: top nav (hidden on the print view via CSS) + routed content. */
export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <nav className="nav no-print">
        <Link to="/documents" className="nav-brand">
          Pricing Calculator
        </Link>
        {user ? (
          <>
            <NavLink to="/documents">Documents</NavLink>
            <NavLink to="/reports">Report</NavLink>
            <span className="nav-spacer" />
            <span className="nav-user">{user.email}</span>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <span className="nav-spacer" />
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/signup">Sign up</NavLink>
          </>
        )}
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};
