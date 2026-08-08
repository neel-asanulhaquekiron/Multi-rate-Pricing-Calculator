import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth";

const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
  return cn(
    "text-sm font-medium transition-colors hover:text-foreground",
    isActive ? "text-foreground" : "text-muted-foreground",
  );
};

/** App chrome: top nav (hidden on the print view) + routed content. */
export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="flex h-14 items-center gap-6 border-b bg-card px-6 print:hidden">
        <Link to="/documents" className="font-bold">
          Pricing Calculator
        </Link>
        {user ? (
          <>
            <NavLink to="/documents" className={navLinkClass}>
              Documents
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              Report
            </NavLink>
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <span className="flex-1" />
            <NavLink to="/login" className={navLinkClass}>
              Log in
            </NavLink>
            <NavLink to="/signup" className={navLinkClass}>
              Sign up
            </NavLink>
          </>
        )}
      </nav>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  );
};
