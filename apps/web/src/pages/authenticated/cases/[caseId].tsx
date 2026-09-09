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
      <section className="ui-panel p-5">
        <h1 className="ui-section-title">Case not found</h1>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          The requested case is not available in the current review workspace.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Return to cases
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="border-b border-border">
        <p className="ui-meta flex items-center gap-1.5">
          <Link
            to="/"
            className="font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cases
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-foreground">{caseItem.name}</span>
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="ui-page-title">{caseItem.name}</h1>
              <StatusBadge tone="success">{caseItem.status}</StatusBadge>
            </div>
            <p className="ui-meta mt-1 font-mono">{caseItem.id}</p>
          </div>
          <p className="ui-meta">Last activity {caseItem.lastActivity}</p>
        </div>

        <div
          className="mt-5 flex overflow-x-auto"
          role="tablist"
          aria-label="Case details"
        >
          {detailTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`ui-tab ${activeTab === tab ? "ui-tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "Overview" && <OverviewTab caseItem={caseItem} />}
      {activeTab === "Documents" && <DocumentsTab caseItem={caseItem} />}
      {activeTab === "Intelligence" && <IntelligenceTab caseItem={caseItem} />}
    </section>
  );
}

function OverviewTab({ caseItem }: { caseItem: MockCase }) {
  const details = [
    { label: "Status", value: caseItem.status },
    { label: "Documents", value: `${caseItem.documents.length} files` },
    { label: "Latest meeting", value: caseItem.latestMeeting },
    { label: "Last analysed", value: caseItem.lastAnalysed },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="ui-panel">
        <div className="border-b border-border px-4 py-3">
          <h2 className="ui-subsection-title">Case overview</h2>
        </div>

        <dl className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {details.map((detail) => (
            <div key={detail.label} className="px-4 py-3.5">
              <dt className="ui-label">{detail.label}</dt>
              <dd className="mt-1 text-sm font-medium leading-5 text-foreground">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-border px-4 py-4">
          <h2 className="ui-subsection-title">Case summary</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              This active case is ready for evidence review against governing
              check-in policy requirements.
            </p>
            <p>
              Documents and analysis shown here are frontend mock data for the
              initial Case Intelligence workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="ui-panel">
        <div className="border-b border-border px-4 py-3">
          <h2 className="ui-subsection-title">Recent activity</h2>
        </div>
        <ol className="divide-y divide-border">
          {caseItem.activity.map((activity) => (
            <li key={activity.id} className="px-4 py-3.5">
              <p className="text-sm font-medium leading-5">{activity.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {activity.detail}
              </p>
              <p className="ui-meta mt-2">{activity.timestamp}</p>
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="ui-section-title">Documents</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Evidence and governing materials available for this case.
          </p>
        </div>
        <Button variant="outline" disabled>
          Upload document
        </Button>
      </header>

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
    <section className="ui-panel overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="ui-subsection-title">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="ui-table-header border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Filename</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Pages</th>
              <th className="px-4 py-3 font-medium">Processing</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="ui-table-row">
                <td className="px-4 py-3.5 font-medium leading-5">
                  {document.name}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  {document.type}
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">
                  {document.pages}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge
                    tone={document.status === "Ready" ? "success" : "warning"}
                  >
                    {document.status}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">—</td>
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
  const checksMet = caseItem.analysis.checks.filter(
    (check) => check.status === "MET",
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="ui-section-title">Intelligence</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Review case evidence against the applicable requirements.
        </p>
      </header>

      <section className="ui-panel p-4">
        <label htmlFor="analysis-question" className="ui-subsection-title">
          Ask a question about this case
        </label>
        <Textarea
          id="analysis-question"
          className="mt-3 min-h-24 resize-y"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-5 text-muted-foreground">
            Results are generated from frontend mock data in this phase.
          </p>
          <Button onClick={() => setShowResult(true)}>Analyse</Button>
        </div>
      </section>

      {!showResult && (
        <section className="ui-empty-state">
          <h2 className="font-medium text-foreground">Analysis ready to run</h2>
          <p className="mx-auto mt-1 max-w-xl leading-5">
            Run the mock analysis to review conclusion, requirement checks, and
            cited evidence.
          </p>
        </section>
      )}

      {showResult && (
        <section className="ui-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="ui-label">Latest analysis</p>
              <h2 className="mt-1 ui-section-title">
                {caseItem.analysis.conclusion}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge tone="warning">
                {caseItem.analysis.conclusion}
              </StatusBadge>
              <p className="text-sm font-medium leading-5 text-foreground">
                {checksMet} / {caseItem.analysis.checks.length} met
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {caseItem.analysis.summary}
            </p>
          </div>

          <section className="border-t border-border">
            <div className="px-4 py-3">
              <h2 className="ui-subsection-title">Requirements</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Evidence-backed assessment of each check-in requirement.
              </p>
            </div>
            <div className="divide-y divide-border">
              {caseItem.analysis.checks.map((check) => {
                const tone =
                  check.status === "MET"
                    ? "success"
                    : check.status === "NOT MET"
                      ? "danger"
                      : "warning";

                return (
                  <article
                    key={check.id}
                    className="grid gap-3 px-4 py-4 sm:grid-cols-[20px_minmax(0,1fr)_minmax(190px,260px)]"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 text-sm font-semibold leading-5 ${
                        check.status === "MET" ? "text-success" : "text-danger"
                      }`}
                    >
                      {check.status === "MET" ? "✓" : "×"}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="text-sm font-medium leading-5">
                          {check.requirement}
                        </h3>
                        <StatusBadge tone={tone}>{check.status}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-muted-foreground">
                        {check.evidence}
                      </p>
                    </div>
                    <p className="ui-meta self-start border-l border-border pl-3 sm:mt-0">
                      <span className="font-medium text-secondary-foreground">
                        {check.citation.label}
                      </span>
                      <span className="mx-1">·</span>
                      {check.citation.document}
                      <span className="mx-1">·</span>
                      p.{check.citation.page}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
