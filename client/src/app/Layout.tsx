import { Calculator, LogOut } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/features/auth/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
  return cn(
    "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
        <Link to="/documents" aria-label="home" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calculator className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="hidden font-bold whitespace-nowrap lg:inline">PriceCalc</span>
        </Link>
        {user ? (
          <>
            <NavLink to="/documents" className={navLinkClass}>
              Documents
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              Report
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About Me
            </NavLink>
            <span className="flex-1" />
            <span className="hidden truncate text-xs text-muted-foreground md:inline" title={user.email}>
              {user.email}
            </span>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" aria-label="log out" className="shrink-0">
                  <LogOut className="h-4 w-4 sm:hidden" aria-hidden />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              }
              title="Log out?"
              description="You'll need to sign in again to access your documents."
              actionLabel="Log out"
              busyLabel="Logging out…"
              actionVariant="default"
              onConfirm={onLogout}
            />
          </>
        ) : (
          <>
            <NavLink to="/about" className={navLinkClass}>
              About Me
            </NavLink>
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
