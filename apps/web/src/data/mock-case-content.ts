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
