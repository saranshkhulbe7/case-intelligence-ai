import { Navigate, useNavigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { AuthenticatedShell } from "./authenticated-shell";

export function AuthenticatedLayout() {
  const me = trpc.authRouter.me.useQuery(undefined, { retry: false });
  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Checking session...
      </main>
    );
  }
  if (me.isError && !me.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Failed to check session.
      </main>
    );
  }
  if (!me.data?.user) {
    return <Navigate to="/login" replace />;
  }

  return <AuthenticatedShell user={me.data.user} />;
}
