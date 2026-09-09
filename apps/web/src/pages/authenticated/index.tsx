import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@agent-platform/ui/components/button";
import { Input } from "@agent-platform/ui/components/input";
import { mockCases } from "../../data/mock-cases";
import { StatusBadge } from "../../components/status-badge";

export default function DashboardPage() {
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
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
            SUPERVISOR REVIEW
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Case Intelligence
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review cases, documents, and evidence-backed AI analysis.
          </p>
        </div>
        <Button onClick={() => setShowNewCaseNotice(true)}>New Case</Button>
      </header>

      {showNewCaseNotice && (
        <div className="border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          New case creation will be available when case persistence is added.
        </div>
      )}

      <div className="grid gap-3 border border-border bg-background p-4 md:grid-cols-[1fr_180px]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by case name or ID"
          aria-label="Search cases"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter cases by status"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option>All statuses</option>
          <option>Active</option>
        </select>
      </div>

      <div className="overflow-hidden border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Case</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Documents</th>
                <th className="px-5 py-3">Last activity</th>
                <th className="px-5 py-3" aria-label="Open case" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCases.map((caseItem) => (
                <tr key={caseItem.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <Link
                      to={`/cases/${caseItem.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {caseItem.name}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {caseItem.id}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="success">{caseItem.status}</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {caseItem.documents.length}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {caseItem.lastActivity}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/cases/${caseItem.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      Open case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases.length === 0 && (
          <div className="border-t border-border px-5 py-10 text-center text-sm text-muted-foreground">
            No cases match the current filters.
          </div>
        )}
      </div>
    </section>
  );
}
