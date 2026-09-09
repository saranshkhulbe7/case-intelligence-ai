import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@agent-platform/ui/components/button";
import { Input } from "@agent-platform/ui/components/input";
import { mockCases } from "../../data/mock-cases";
import { StatusBadge } from "../../components/status-badge";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [showNewCaseNotice, setShowNewCaseNotice] = useState(false);

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
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="ui-page-title">Cases</h1>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Review and analyse managed cases.
          </p>
        </div>
        <Button onClick={() => setShowNewCaseNotice(true)}>+ New Case</Button>
      </header>

      {showNewCaseNotice && (
        <div className="border border-info/30 bg-surface px-3 py-2 text-sm leading-5 text-muted-foreground">
          New case creation will be available when case persistence is added.
        </div>
      )}

      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row">
        <Input
          className="sm:max-w-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by case name or ID"
          aria-label="Search cases"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter cases by status"
          className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:w-40"
        >
          <option>All statuses</option>
          <option>Active</option>
        </select>
      </div>

      <div className="overflow-hidden border-y border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="ui-table-header border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Case</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Documents</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open case ${caseItem.name}`}
                  className="ui-table-row cursor-pointer focus-visible:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/cases/${caseItem.id}`);
                    }
                  }}
                >
                  <td className="px-4 py-3.5">
                    <p className="font-medium leading-5 text-foreground">
                      {caseItem.name}
                    </p>
                    <p className="ui-meta mt-0.5 font-mono">
                      {caseItem.id}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge tone="success">{caseItem.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">
                    {caseItem.documents.length}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">
                    {caseItem.lastActivity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases.length === 0 && (
          <div className="ui-empty-state border-x-0 border-b-0">
            No cases match the current filters.
          </div>
        )}
      </div>
    </section>
  );
}
