import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@agent-platform/ui/components/button";
import { Textarea } from "@agent-platform/ui/components/textarea";
import type { CaseDocument, MockCase } from "../../../data/mock-cases";
import { getMockCase } from "../../../data/mock-cases";
import { StatusBadge } from "../../../components/status-badge";

type DetailTab = "Overview" | "Documents" | "Intelligence";

const detailTabs: DetailTab[] = ["Overview", "Documents", "Intelligence"];

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const caseItem = getMockCase(caseId);
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");

  if (!caseItem) {
    return (
      <section className="border border-border bg-background p-6">
        <h1 className="text-xl font-semibold">Case not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested case is not available in the current review workspace.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block text-sm font-medium hover:underline"
        >
          Return to cases
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="border-b border-border pb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          Cases
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {caseItem.name}
              </h1>
              <StatusBadge tone="success">{caseItem.status}</StatusBadge>
            </div>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {caseItem.id}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Last activity {caseItem.lastActivity}
          </p>
        </div>
      </header>

      <div className="flex overflow-x-auto border-b border-border" role="tablist">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={[
              "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && <OverviewTab caseItem={caseItem} />}
      {activeTab === "Documents" && <DocumentsTab caseItem={caseItem} />}
      {activeTab === "Intelligence" && <IntelligenceTab caseItem={caseItem} />}
    </section>
  );
}

function OverviewTab({ caseItem }: { caseItem: MockCase }) {
  const metrics = [
    { label: "Status", value: caseItem.status },
    { label: "Documents", value: `${caseItem.documents.length} files` },
    { label: "Latest meeting", value: caseItem.latestMeeting },
    { label: "Last analysed", value: caseItem.lastAnalysed },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-6">
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-background p-5">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-2 text-base font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>

        <section className="border border-border bg-background">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Case summary</h2>
          </div>
          <div className="space-y-4 p-5 text-sm leading-6 text-muted-foreground">
            <p>
              This active case is ready for evidence review against governing
              check-in policy requirements.
            </p>
            <p>
              Documents and analysis shown here are frontend mock data for the
              initial Case Intelligence workspace.
            </p>
          </div>
        </section>
      </section>

      <section className="border border-border bg-background">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Recent activity</h2>
        </div>
        <ol className="divide-y divide-border">
          {caseItem.activity.map((activity) => (
            <li key={activity.id} className="px-5 py-4">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {activity.detail}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {activity.timestamp}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function DocumentsTab({ caseItem }: { caseItem: MockCase }) {
  const evidenceDocuments = caseItem.documents.filter(
    (document) => document.category === "Case evidence",
  );
  const policyDocuments = caseItem.documents.filter(
    (document) => document.category === "Governing policy",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Case documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence and governing materials available for this case.
          </p>
        </div>
        <Button variant="outline" disabled>
          Upload Document
        </Button>
      </div>

      <DocumentSection
        title="Case evidence"
        description="Meeting records, notes, and assessments specific to this case."
        documents={evidenceDocuments}
      />
      <DocumentSection
        title="Governing policy"
        description="Policy documents used to assess procedural requirements."
        documents={policyDocuments}
      />
    </div>
  );
}

function DocumentSection({
  title,
  description,
  documents,
}: {
  title: string;
  description: string;
  documents: CaseDocument[];
}) {
  return (
    <section className="overflow-hidden border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Document</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Pages</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-5 py-4 font-medium">{document.name}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {document.type}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {document.pages}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    tone={document.status === "Ready" ? "success" : "warning"}
                  >
                    {document.status}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function IntelligenceTab({ caseItem }: { caseItem: MockCase }) {
  const [question, setQuestion] = useState(caseItem.analysis.question);
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="space-y-6">
      <section className="border border-border bg-background p-5">
        <label
          htmlFor="analysis-question"
          className="text-sm font-semibold"
        >
          Ask a question about this case
        </label>
        <Textarea
          id="analysis-question"
          className="mt-3 min-h-28 resize-y"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Results are generated from frontend mock data in this phase.
          </p>
          <Button onClick={() => setShowResult(true)}>Analyse</Button>
        </div>
      </section>

      {!showResult && (
        <section className="border border-dashed border-border bg-background px-5 py-10 text-center">
          <h2 className="font-semibold">Analysis ready to run</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run the mock analysis to review conclusion, requirement checks, and
            cited evidence.
          </p>
        </section>
      )}

      {showResult && (
        <section className="space-y-6">
          <div className="border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/50 p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-amber-900">
              OVERALL CONCLUSION
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {caseItem.analysis.conclusion}
              </h2>
              <StatusBadge tone="warning">
                {caseItem.analysis.conclusion}
              </StatusBadge>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-amber-950/80">
              {caseItem.analysis.summary}
            </p>
          </div>

          <section className="overflow-hidden border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">Requirement checks</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Evidence-backed assessment of each check-in requirement.
              </p>
            </div>
            <div className="divide-y divide-border">
              {caseItem.analysis.checks.map((check, index) => (
                <article
                  key={check.id}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[36px_minmax(0,1fr)_260px]"
                >
                  <p className="text-sm font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">{check.requirement}</h3>
                      <StatusBadge
                        tone={check.status === "MET" ? "success" : "danger"}
                      >
                        {check.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {check.evidence}
                    </p>
                  </div>
                  <div className="border-l border-border pl-4 text-sm">
                    <p className="font-medium text-muted-foreground">
                      {check.citation.label}
                    </p>
                    <p className="mt-2 font-medium">{check.citation.document}</p>
                    <p className="mt-1 text-muted-foreground">
                      Page {check.citation.page}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
