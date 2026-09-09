import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@agent-platform/ui/components/button";
import { Plus, Search } from "@agent-platform/ui/components/icons";
import { Input } from "@agent-platform/ui/components/input";
import { StatusBadge } from "../../components/status-badge";
import { mockCases } from "../../data/mock-cases";
import { useCaseWorkspace } from "../../layouts/authenticated-layout/authenticated-shell";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { requestNewCase, showNewCaseNotice } = useCaseWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockCases.filter((caseItem) => {
      const matchesQuery =
        !normalizedQuery ||
        caseItem.name.toLowerCase().includes(normalizedQuery) ||
        caseItem.id.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        status === "All statuses" || caseItem.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="ui-page-title">Cases</h1>
        <Button onClick={requestNewCase}>
          <Plus aria-hidden="true" size={15} strokeWidth={2} />
          New case
        </Button>
      </header>

      {showNewCaseNotice && (
        <p
          role="status"
          className="border-y border-info/25 py-2 text-[13px] leading-5 text-muted-foreground"
        >
          New case creation will be available when case persistence is added.
        </p>
      )}

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
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter cases by status"
          className="h-8 rounded-md border border-input bg-surface px-2.5 text-[13px] text-foreground transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:w-36"
        >
          <option>All statuses</option>
          <option>Active</option>
        </select>
      </div>

      <div role="list" className="border-y border-border">
        {filteredCases.map((caseItem) => (
          <article
            key={caseItem.id}
            role="link"
            tabIndex={0}
            aria-label={`Open case ${caseItem.name}`}
            className="ui-list-row grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-2 focus-visible:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:grid-cols-[minmax(220px,1.6fr)_minmax(100px,0.7fr)_72px_100px] sm:gap-x-5"
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
                <span className="ui-meta ml-2 font-mono">{caseItem.id}</span>
              </p>
            </div>
            <div className="hidden sm:block">
              <StatusBadge tone="success">{caseItem.status}</StatusBadge>
            </div>
            <p className="hidden text-[13px] text-muted-foreground sm:block">
              {caseItem.documents.length} docs
            </p>
            <p className="hidden text-right text-[12px] text-muted-foreground sm:block">
              {caseItem.lastActivity.replace(", 2026", "")}
            </p>
            <div className="sm:hidden">
              <StatusBadge tone="success">{caseItem.status}</StatusBadge>
            </div>
          </article>
        ))}

        {filteredCases.length === 0 && (
          <div className="ui-empty-state px-3">No cases match the current filters.</div>
        )}
      </div>
    </section>
  );
}
