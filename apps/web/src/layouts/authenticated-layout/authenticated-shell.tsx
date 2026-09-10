import { createContext, useContext, useState } from "react";
import { trpc } from "#lib/trpc";
import type { PublicUser } from "@agent-platform/contracts/user";
import { Button } from "@agent-platform/ui/components/button";
import {
  Briefcase,
  LayoutList,
  LogOut,
  Plus,
  UserRound,
} from "@agent-platform/ui/components/icons";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NewCaseDialog } from "../../components/new-case-dialog";

type AuthenticatedShellProps = {
  user: PublicUser;
};

type CaseWorkspaceContextValue = {
  requestNewCase: () => void;
};

const CaseWorkspaceContext = createContext<CaseWorkspaceContextValue | null>(
  null,
);

export function useCaseWorkspace() {
  const context = useContext(CaseWorkspaceContext);

  if (!context) {
    throw new Error("useCaseWorkspace must be used within AuthenticatedShell");
  }

  return context;
}

export function AuthenticatedShell({ user }: AuthenticatedShellProps) {
  const navigate = useNavigate();
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);

  const logout = trpc.authRouter.logout.useMutation({
    onSuccess() {
      navigate("/login", {
        replace: true,
      });
    },
  });

  const requestNewCase = () => {
    setIsNewCaseDialogOpen(true);
  };

  return (
    <CaseWorkspaceContext.Provider
      value={{ requestNewCase }}
    >
      <div className="min-h-screen bg-background text-foreground">
        <header className="h-11 border-b border-border bg-surface">
          <div className="h-full lg:grid lg:grid-cols-[52px_220px_minmax(0,1fr)]">
            <div className="hidden items-center justify-center border-r border-border bg-rail lg:flex">
              <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-[10px] font-semibold text-primary-foreground">
                CI
              </span>
            </div>
            <Link
              to="/"
              className="hidden items-center border-r border-border px-3 text-[13px] font-semibold tracking-[-0.01em] lg:flex"
            >
              Case Intelligence
            </Link>
            <div className="flex h-full items-center justify-between px-3 lg:px-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-[13px] font-semibold lg:hidden"
              >
                <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-[10px] font-semibold text-primary-foreground">
                  CI
                </span>
                Case Intelligence
              </Link>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden text-[12px] text-muted-foreground sm:inline">
                  {user.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  <LogOut aria-hidden="true" size={14} strokeWidth={1.8} />
                  {logout.isPending ? "Signing out..." : "Sign out"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-44px)] lg:grid-cols-[52px_220px_minmax(0,1fr)]">
          <GlobalRail user={user} logout={logout} />
          <ContextSidebar requestNewCase={requestNewCase} />

          <main className="min-w-0 bg-surface">
            <div className="min-h-[calc(100vh-44px)] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5">
              <Outlet />
            </div>
          </main>
        </div>
        <NewCaseDialog
          open={isNewCaseDialogOpen}
          onOpenChange={setIsNewCaseDialogOpen}
        />
      </div>
    </CaseWorkspaceContext.Provider>
  );
}

function GlobalRail({
  user,
  logout,
}: {
  user: PublicUser;
  logout: ReturnType<typeof trpc.authRouter.logout.useMutation>;
}) {
  const location = useLocation();
  const isCasesRoute =
    location.pathname === "/" || location.pathname.startsWith("/cases/");

  return (
    <aside className="hidden flex-col border-r border-border bg-rail lg:flex">
      <nav className="flex flex-col items-center gap-1 px-2 py-2" aria-label="Global navigation">
        <NavLink
          to="/"
          aria-label="Cases"
          title="Cases"
          className={() =>
            [
              "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCasesRoute
                ? "bg-surface-selected text-primary"
                : "hover:bg-surface-hover hover:text-foreground",
            ].join(" ")
          }
        >
          <Briefcase aria-hidden="true" size={17} strokeWidth={1.8} />
        </NavLink>
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1 border-t border-border px-2 py-2">
        <span
          aria-label={`${user.name} account`}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground"
          title={user.email}
        >
          <UserRound aria-hidden="true" size={16} strokeWidth={1.8} />
        </span>
        <Button
          aria-label="Sign out"
          title="Sign out"
          size="icon"
          variant="ghost"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
        </Button>
      </div>
    </aside>
  );
}

function ContextSidebar({ requestNewCase }: { requestNewCase: () => void }) {
  const cases = trpc.caseRouter.list.useQuery();

  return (
    <aside className="hidden min-w-0 flex-col border-r border-border bg-context lg:flex">
      <div className="flex h-11 items-center border-b border-border px-3">
        <h2 className="text-[13px] font-semibold">Cases</h2>
      </div>

      <div className="px-2 py-2">
        <Button className="w-full justify-start" size="sm" onClick={requestNewCase}>
          <Plus aria-hidden="true" size={14} strokeWidth={2} />
          New case
        </Button>
      </div>

      <nav className="px-2 py-1" aria-label="Cases context">
        <p className="ui-label px-2 py-1.5">Cases</p>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [
              "flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-surface-selected text-foreground"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            ].join(" ")
          }
        >
          <LayoutList aria-hidden="true" size={15} strokeWidth={1.8} />
          All cases
        </NavLink>
        <span className="flex h-8 items-center gap-2 px-2 text-[13px] text-muted-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
          Active
        </span>
        <span className="flex h-8 items-center gap-2 px-2 text-[13px] text-muted-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground" />
          Closed
        </span>
      </nav>

      <nav className="mt-3 px-2 py-1" aria-label="Recent cases">
        <p className="ui-label px-2 py-1.5">Recent</p>
        {cases.data?.map((caseItem) => (
          <NavLink
            key={caseItem.id}
            to={`/cases/${caseItem.id}`}
            className={({ isActive }) =>
              [
                "block truncate rounded-md px-2 py-1.5 text-[13px] leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-surface-selected font-medium text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              ].join(" ")
            }
          >
            {caseItem.name}
          </NavLink>
        ))}
        {!cases.isLoading && cases.data?.length === 0 && (
          <p className="ui-meta px-2 py-1.5">No recent cases</p>
        )}
      </nav>
    </aside>
  );
}
