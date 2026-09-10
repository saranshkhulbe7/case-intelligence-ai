import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@case-intelligence/ui/components/button";
import { Check, FileText, X } from "@case-intelligence/ui/components/icons";
import { Textarea } from "@case-intelligence/ui/components/textarea";
import { StatusBadge } from "../../../components/status-badge";
import { UploadDocumentDialog } from "../../../components/upload-document-dialog";
import { mockCaseContent } from "../../../data/mock-case-content";
import {
  formatCaseDate,
  formatCaseDateTime,
  formatCaseStatus,
  formatCaseShortDate,
  formatDocumentStatus,
  formatFileSize,
} from "../../../lib/case-presentation";
import { trpc } from "../../../lib/trpc";
import type { RouterOutputs } from "../../../lib/trpc-types";

type DetailTab = "Overview" | "Documents" | "Intelligence";
type CaseItem = RouterOutputs["caseRouter"]["get"];
type DocumentItem = RouterOutputs["documentRouter"]["list"][number];

const detailTabs: DetailTab[] = ["Overview", "Documents", "Intelligence"];

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const caseQuery = trpc.caseRouter.get.useQuery(
    { caseId: caseId ?? "" },
    { enabled: Boolean(caseId) },
  );

  if (caseQuery.isLoading) {
    return <p role="status" className="ui-empty-state">Loading case...</p>;
  }

  if (!caseQuery.data) {
    return (
      <section className="border-y border-border py-4">
        <h1 className="ui-section-title">Case not found</h1>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          The requested case is not available in the current review workspace.
        </p>
        <Link
          to="/"
          className="mt-3 inline-block text-[13px] font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Return to cases
        </Link>
      </section>
    );
  }

  const caseItem = caseQuery.data;
  const statusTone = caseItem.status === "ACTIVE" ? "success" : "neutral";

  return (
    <section className="space-y-5">
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

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="ui-page-title">{caseItem.name}</h1>
          <span className="ui-meta font-mono text-foreground">
            {caseItem.caseNumber}
          </span>
          <StatusBadge tone={statusTone}>
            {formatCaseStatus(caseItem.status)}
          </StatusBadge>
        </div>
        <p className="ui-meta mt-1.5">
          Last activity {formatCaseDate(caseItem.updatedAt)}
        </p>

        <div
          className="mt-3 flex overflow-x-auto"
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
      {activeTab === "Documents" && <DocumentsTab caseId={caseItem.id} />}
      {activeTab === "Intelligence" && <IntelligenceTab />}
    </section>
  );
}

function OverviewTab({
  caseItem,
}: {
  caseItem: CaseItem;
}) {
  const details = [
    { label: "Status", value: formatCaseStatus(caseItem.status) },
    { label: "Created", value: formatCaseDate(caseItem.createdAt) },
    { label: "Last updated", value: formatCaseDateTime(caseItem.updatedAt) },
  ];

  const activity = [
    {
      id: "created",
      title: "Case created",
      detail: "Case added to the review workspace.",
      timestamp: formatCaseDateTime(caseItem.createdAt),
    },
    {
      id: "updated",
      title: "Case updated",
      detail: "Case details were last updated.",
      timestamp: formatCaseDateTime(caseItem.updatedAt),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-0">
      <section>
        <h2 className="ui-section-title">Overview</h2>

        <div className="mt-3 border-y border-border">
          <dl className="grid sm:grid-cols-2">
            {details.map((detail, index) => (
              <div
                key={detail.label}
                className={`grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3 px-3 py-2.5 ${
                  index === 0 ? "sm:border-r sm:border-border" : ""
                } ${index === 0 ? "border-b border-border" : ""}`}
              >
                <dt className="ui-label">{detail.label}</dt>
                <dd className="truncate text-[13px] font-medium leading-5 text-foreground">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-border px-3 py-3.5">
            <h2 className="ui-subsection-title">Case summary</h2>
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              {caseItem.description || "No description has been added to this case."}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border pt-5 xl:ml-6 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
        <h2 className="ui-section-title">Recent activity</h2>
        <ol className="mt-3 divide-y divide-border border-y border-border">
          {activity.map((activityItem) => (
            <li key={activityItem.id} className="flex gap-2.5 px-1 py-3">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-info"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-5">
                  {activityItem.title}
                </p>
                <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
                  {activityItem.detail}
                </p>
                <p className="ui-meta mt-1.5">{activityItem.timestamp}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function DocumentsTab({ caseId }: { caseId: string }) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const documentsQuery = trpc.documentRouter.list.useQuery({ caseId });
  const evidenceDocuments = (documentsQuery.data ?? []).filter(
    (document) => document.category === "CASE_EVIDENCE",
  );
  const policyDocuments = (documentsQuery.data ?? []).filter(
    (document) => document.category === "GOVERNING_POLICY",
  );

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="ui-section-title">Documents</h2>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            Files uploaded to this case are stored in private case storage.
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
          Upload document
        </Button>
      </header>

      {documentsQuery.isLoading && (
        <p role="status" className="ui-empty-state">
          Loading documents...
        </p>
      )}

      {documentsQuery.isError && (
        <p role="alert" className="ui-empty-state text-danger">
          Unable to load documents. Please try again.
        </p>
      )}

      {!documentsQuery.isLoading && !documentsQuery.isError && (
        <>
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
        </>
      )}

      <UploadDocumentDialog
        caseId={caseId}
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
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
  documents: DocumentItem[];
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="ui-subsection-title">{title}</h2>
          <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="ui-meta shrink-0">{documents.length} files</span>
      </div>

      <div role="list" className="mt-3 border-y border-border">
        {documents.length === 0 && (
          <p className="ui-empty-state px-2">No documents in this category.</p>
        )}
        {documents.map((document) => {
          const statusTone =
            document.status === "UPLOADED" || document.status === "READY"
              ? "success"
              : document.status === "FAILED"
                ? "danger"
                : document.status === "PROCESSING"
                  ? "info"
                  : "warning";

          return (
            <article
              key={document.id}
              role="listitem"
              className="ui-list-row grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-2 py-2 sm:grid-cols-[minmax(240px,1fr)_100px_100px] sm:gap-x-5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                  size={16}
                  strokeWidth={1.7}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium leading-5 text-foreground">
                    {document.originalName}
                  </p>
                  <p className="ui-meta truncate">
                    PDF · {formatFileSize(document.sizeBytes)}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <StatusBadge tone={statusTone}>
                  {formatDocumentStatus(document.status)}
                </StatusBadge>
              </div>
              <p className="hidden text-right text-[12px] text-muted-foreground sm:block">
                {formatCaseShortDate(document.uploadedAt ?? document.createdAt)}
              </p>
              <div className="sm:hidden">
                <StatusBadge tone={statusTone}>
                  {formatDocumentStatus(document.status)}
                </StatusBadge>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function IntelligenceTab() {
  const [question, setQuestion] = useState(mockCaseContent.analysis.question);
  const [showResult, setShowResult] = useState(false);
  const checksMet = mockCaseContent.analysis.checks.filter(
    (check) => check.status === "MET",
  ).length;

  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h2 className="ui-section-title">Intelligence</h2>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          Analysis content remains mocked until the Intelligence domain is implemented.
        </p>
      </header>

      <section className="border-y border-border py-3">
        <label htmlFor="analysis-question" className="ui-subsection-title">
          Ask about this case
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            id="analysis-question"
            className="min-h-16 flex-1 resize-y"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <Button className="shrink-0" onClick={() => setShowResult(true)}>
            Analyse
          </Button>
        </div>
        <p className="ui-meta mt-2">
          Results are generated from frontend mock data in this phase.
        </p>
      </section>

      {!showResult && (
        <p className="ui-meta border-b border-dashed border-border pb-3">
          Run the analysis to review the conclusion, requirement checks, and
          cited evidence.
        </p>
      )}

      {showResult && (
        <section className="border-y border-border">
          <div className="flex flex-wrap items-start justify-between gap-3 px-1 py-3">
            <div>
              <p className="ui-label">Latest analysis</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <StatusBadge tone="warning">
                  {mockCaseContent.analysis.conclusion}
                </StatusBadge>
                <p className="text-[13px] font-medium leading-5">
                  {checksMet} / {mockCaseContent.analysis.checks.length} met
                </p>
              </div>
            </div>
          </div>

          <p className="border-t border-border px-1 py-3 text-[13px] leading-5 text-muted-foreground">
            {mockCaseContent.analysis.summary}
          </p>

          <section className="border-t border-border">
            <div className="px-1 py-3">
              <h2 className="ui-subsection-title">Requirements</h2>
              <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">
                Evidence-backed assessment of each check-in requirement.
              </p>
            </div>
            <div className="divide-y divide-border border-t border-border">
              {mockCaseContent.analysis.checks.map((check) => {
                const isMet = check.status === "MET";

                return (
                  <article
                    key={check.id}
                    className="grid gap-x-3 gap-y-1 px-1 py-3 sm:grid-cols-[18px_minmax(0,1fr)_minmax(210px,260px)]"
                  >
                    {isMet ? (
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 text-success"
                        size={16}
                        strokeWidth={2}
                      />
                    ) : (
                      <X
                        aria-hidden="true"
                        className="mt-0.5 text-danger"
                        size={16}
                        strokeWidth={2}
                      />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="text-[13px] font-medium leading-5">
                          {check.requirement}
                        </h3>
                        <StatusBadge tone={isMet ? "success" : "danger"}>
                          {check.status}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                        {check.evidence}
                      </p>
                    </div>
                    <p className="ui-meta flex items-start gap-1.5 sm:pt-0.5">
                      <FileText
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        size={13}
                        strokeWidth={1.8}
                      />
                      <span>
                        {check.citation.label === "Policy citation"
                          ? `Required by ${check.citation.document}`
                          : check.citation.document}
                        <span className="mx-1">·</span>
                        p.{check.citation.page}
                      </span>
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
