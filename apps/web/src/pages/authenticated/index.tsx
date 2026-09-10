import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@case-intelligence/ui/components/button";
import { Plus, Search } from "@case-intelligence/ui/components/icons";
import { Input } from "@case-intelligence/ui/components/input";
import { StatusBadge } from "../../components/status-badge";
import {
  formatCaseStatus,
  formatCaseShortDate,
} from "../../lib/case-presentation";
import { trpc } from "../../lib/trpc";
import { useCaseWorkspace } from "../../layouts/authenticated-layout/authenticated-shell";

type StatusFilter = "ALL" | "ACTIVE" | "CLOSED";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { requestNewCase } = useCaseWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const cases = trpc.caseRouter.list.useQuery();

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (cases.data ?? []).filter((caseItem) => {
      const matchesQuery =
        !normalizedQuery ||
        caseItem.name.toLowerCase().includes(normalizedQuery) ||
        caseItem.caseNumber.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "ALL" || caseItem.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [cases.data, query, status]);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="ui-page-title">Cases</h1>
        <Button onClick={requestNewCase}>
          <Plus aria-hidden="true" size={15} strokeWidth={2} />
          New case
        </Button>
      </header>

      <div className="flex flex-col gap-2 border-y border-border py-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            size={15}
            strokeWidth={1.8}
          />
          <Input
            className="pl-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cases..."
            aria-label="Search cases"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label="Filter cases by status"
          className="h-8 rounded-md border border-input bg-surface px-2.5 text-[13px] text-foreground transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:w-36"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div role="list" className="border-y border-border">
        {cases.isLoading && (
          <p role="status" className="ui-empty-state px-3">
            Loading cases...
          </p>
        )}

        {cases.isError && (
          <p role="alert" className="ui-empty-state px-3 text-danger">
            Unable to load cases. Please try again.
          </p>
        )}

        {!cases.isLoading && !cases.isError && filteredCases.length === 0 && (
          <div className="ui-empty-state px-3">
            {query || status !== "ALL"
              ? "No cases match the current filters."
              : "No cases yet. Create your first case to begin review."}
          </div>
        )}

        {filteredCases.map((caseItem) => (
          <article
            key={caseItem.id}
            role="link"
            tabIndex={0}
            aria-label={`Open case ${caseItem.name}`}
            className="ui-list-row grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-2 focus-visible:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:grid-cols-[minmax(220px,1fr)_minmax(100px,0.7fr)_100px] sm:gap-x-5"
            onClick={() => navigate(`/cases/${caseItem.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/cases/${caseItem.id}`);
              }
            }}
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-5 text-foreground">
                {caseItem.name}
                <span className="ui-meta ml-2 font-mono">
                  {caseItem.caseNumber}
                </span>
              </p>
            </div>
            <div className="hidden sm:block">
              <StatusBadge tone={caseItem.status === "ACTIVE" ? "success" : "neutral"}>
                {formatCaseStatus(caseItem.status)}
              </StatusBadge>
            </div>
            <p className="hidden text-right text-[12px] text-muted-foreground sm:block">
              {formatCaseShortDate(caseItem.updatedAt)}
            </p>
            <div className="sm:hidden">
              <StatusBadge tone={caseItem.status === "ACTIVE" ? "success" : "neutral"}>
                {formatCaseStatus(caseItem.status)}
              </StatusBadge>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
