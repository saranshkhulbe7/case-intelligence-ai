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
    <div className="min-h-screen bg-muted/20 text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-border bg-background lg:flex lg:flex-col">
          <div className="border-b border-border px-5 py-5">
            <Link to="/" className="block">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
                CASE INTELLIGENCE
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight">
                Review workspace
              </p>
            </Link>
          </div>

          <nav className="grid gap-1 p-3">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                ].join(" ")
              }
            >
              Cases
            </NavLink>
          </nav>

          <div className="mt-auto border-t border-border p-4">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {user.email}
            </p>

            <Button
              className="mt-4 w-full"
              variant="outline"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link to="/" className="text-sm font-semibold tracking-tight">
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
