import { trpc } from "#lib/trpc";
import type { PublicUser } from "@agent-platform/contracts/user";
import { Button } from "@agent-platform/ui/components/button";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

type AuthenticatedShellProps = {
  user: PublicUser;
};

export function AuthenticatedShell({ user }: AuthenticatedShellProps) {
  const navigate = useNavigate();

  const logout = trpc.authRouter.logout.useMutation({
    onSuccess() {
      navigate("/login", {
        replace: true,
      });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-sidebar lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-border px-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                CI
              </span>
              <span className="text-sm font-semibold tracking-[-0.01em]">
                Case Intelligence
              </span>
            </Link>
          </div>

          <nav className="grid gap-1 p-2" aria-label="Primary navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-surface-selected text-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                ].join(" ")
              }
            >
              Cases
            </NavLink>
          </nav>

          <div className="mt-auto border-t border-border p-3">
            <p className="truncate text-sm font-medium leading-5">{user.name}</p>
            <p className="mt-0.5 truncate text-xs leading-4 text-muted-foreground">
              {user.email}
            </p>

            <Button
              className="mt-3 w-full justify-start"
              variant="ghost"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </aside>

        <main className="min-w-0 bg-background">
          <div className="w-full px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="mb-5 flex h-9 items-center justify-between lg:hidden">
              <Link to="/" className="text-sm font-semibold leading-5">
                Case Intelligence
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                Sign out
              </Button>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
