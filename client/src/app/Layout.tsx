import { LogOut } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
  return cn(
    "shrink-0 text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground",
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
      <nav className="flex h-14 items-center gap-3 border-b bg-card px-4 sm:gap-6 sm:px-6 print:hidden">
        <Link to="/documents" className="shrink-0 font-bold whitespace-nowrap">
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
            <span className="hidden truncate text-xs text-muted-foreground md:inline" title={user.email}>
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} aria-label="log out" className="shrink-0">
              <LogOut className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  );
};
