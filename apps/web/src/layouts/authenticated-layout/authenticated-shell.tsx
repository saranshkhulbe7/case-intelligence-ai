import { useRealtime } from "#hooks/use-realtime";
import { trpc } from "#lib/trpc";
import type { PublicUser } from "@agent-platform/contracts/user";
import { Button } from "@agent-platform/ui/components/button";
import { Outlet, useNavigate } from "react-router";
import { Link } from "react-router-dom";

type AuthenticatedShellProps = {
  user: PublicUser;
};

export function AuthenticatedShell({ user }: AuthenticatedShellProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const chats = trpc.chatRouter.list.useQuery();

  const realtime = useRealtime({
    onEvent(event) {
      console.log("[Realtime] event", event);
    },
    onReconnect() {
      console.log("[Realtime] reconnected");
    },
    onRepeatedFailure() {
      utils.authRouter.me.invalidate();
    },
  });

  const logout = trpc.authRouter.logout.useMutation({
    onSuccess() {
      navigate("/login", {
        replace: true,
      });
    },
  });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-border p-4">
          <div className="mb-4">
            <strong>Agent Platform</strong>

            <p className="text-xs text-muted-foreground">{user.email}</p>

            <p className="text-xs text-muted-foreground">
              WS: {realtime.status}
            </p>
          </div>

          <Link
            to="/chats/new"
            className="flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            + New chat
          </Link>

          <nav className="mt-4 grid gap-1">
            {chats.data?.map((chat) => (
              <Link
                key={chat.id}
                className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                to={`/chats/${chat.id}`}
              >
                <span className="block truncate">
                  {chat.title ?? "Untitled chat"}
                </span>

                {chat.activeRun && (
                  <span className="text-xs text-muted-foreground">
                    {chat.activeRun.status}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <Button
            className="mt-6 w-full"
            variant="outline"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Logout
          </Button>
        </aside>

        <main className="min-w-0 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
