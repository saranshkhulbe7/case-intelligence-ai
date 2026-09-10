export type MockDocument = {
  id: string;
  name: string;
  type: "Meeting Transcript" | "Case Note" | "Assessment" | "Policy";
  status: "Ready" | "Processing";
  pages: number;
  category: "Case evidence" | "Governing policy";
};

export type MockComplianceCheck = {
  id: string;
  requirement: string;
  status: "MET" | "NOT MET";
  evidence: string;
  citation: {
    label: "Citation" | "Policy citation";
    document: string;
    page: number;
  };
};

export const mockCaseContent = {
  documents: [
    {
      id: "doc-1",
      name: "Meeting Transcript - Sep 2.pdf",
      type: "Meeting Transcript",
      status: "Ready",
      pages: 14,
      category: "Case evidence",
    },
    {
      id: "doc-2",
      name: "Risk Assessment.pdf",
      type: "Assessment",
      status: "Ready",
      pages: 8,
      category: "Case evidence",
    },
    {
      id: "doc-3",
      name: "Case Notes - Sep 4.pdf",
      type: "Case Note",
      status: "Ready",
      pages: 3,
      category: "Case evidence",
    },
    {
      id: "doc-4",
      name: "Meeting Transcript - Aug 20.pdf",
      type: "Meeting Transcript",
      status: "Processing",
      pages: 11,
      category: "Case evidence",
    },
    {
      id: "doc-5",
      name: "Check-in Guidelines.pdf",
      type: "Policy",
      status: "Ready",
      pages: 22,
      category: "Governing policy",
    },
  ] satisfies MockDocument[],
  analysis: {
    question:
      "Did the case manager follow all check-in guidelines in the latest meeting?",
    conclusion: "PARTIALLY COMPLIANT",
    summary:
      "The case manager satisfied four of the five required check-in procedures. Employment status was not reviewed during the latest meeting.",
    checks: [
      {
        id: "check-1",
        requirement: "Verify current address",
        status: "MET",
        evidence: "Address was confirmed during the meeting.",
        citation: {
          label: "Citation",
          document: "Meeting Transcript - Sep 2.pdf",
          page: 2,
        },
      },
      {
        id: "check-2",
        requirement: "Review employment status",
        status: "NOT MET",
        evidence:
          "No employment-status discussion was found in the meeting transcript.",
        citation: {
          label: "Policy citation",
          document: "Check-in Guidelines.pdf",
          page: 7,
        },
      },
      {
        id: "check-3",
        requirement: "Review risk factors",
        status: "MET",
        evidence: "Current risk factors were reviewed with the participant.",
        citation: {
          label: "Citation",
          document: "Meeting Transcript - Sep 2.pdf",
          page: 5,
        },
      },
      {
        id: "check-4",
        requirement: "Discuss treatment progress",
        status: "MET",
        evidence: "Treatment progress and current supports were discussed.",
        citation: {
          label: "Citation",
          document: "Meeting Transcript - Sep 2.pdf",
          page: 8,
        },
      },
      {
        id: "check-5",
        requirement: "Schedule next check-in",
        status: "MET",
        evidence: "The next check-in was scheduled before the meeting ended.",
        citation: {
          label: "Citation",
          document: "Meeting Transcript - Sep 2.pdf",
          page: 13,
        },
      },
    ] satisfies MockComplianceCheck[],
  },
};
