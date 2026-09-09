export type CaseDocument = {
  id: string;
  name: string;
  type: "Meeting Transcript" | "Case Note" | "Assessment" | "Policy";
  status: "Ready" | "Processing";
  pages: number;
  category: "Case evidence" | "Governing policy";
};

export type ComplianceCheck = {
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

export type MockCase = {
  id: string;
  name: string;
  status: "Active";
  lastActivity: string;
  latestMeeting: string;
  lastAnalysed: string;
  documents: CaseDocument[];
  activity: Array<{
    id: string;
    title: string;
    detail: string;
    timestamp: string;
  }>;
  analysis: {
    question: string;
    conclusion: "PARTIALLY COMPLIANT";
    summary: string;
    checks: ComplianceCheck[];
  };
};

export const mockCases: MockCase[] = [
  {
    id: "CS-1042",
    name: "Robert Thompson",
    status: "Active",
    lastActivity: "Sep 9, 2026",
    latestMeeting: "Sep 2, 2026",
    lastAnalysed: "Sep 9, 2026 · 10:42 AM",
    documents: [
      {
        id: "doc-1042-1",
        name: "Meeting Transcript - Sep 2.pdf",
        type: "Meeting Transcript",
        status: "Ready",
        pages: 14,
        category: "Case evidence",
      },
      {
        id: "doc-1042-2",
        name: "Risk Assessment.pdf",
        type: "Assessment",
        status: "Ready",
        pages: 8,
        category: "Case evidence",
      },
      {
        id: "doc-1042-3",
        name: "Case Notes - Sep 4.pdf",
        type: "Case Note",
        status: "Ready",
        pages: 3,
        category: "Case evidence",
      },
      {
        id: "doc-1042-4",
        name: "Meeting Transcript - Aug 20.pdf",
        type: "Meeting Transcript",
        status: "Processing",
        pages: 11,
        category: "Case evidence",
      },
      {
        id: "doc-1042-5",
        name: "Check-in Guidelines.pdf",
        type: "Policy",
        status: "Ready",
        pages: 22,
        category: "Governing policy",
      },
    ],
    activity: [
      {
        id: "activity-1042-1",
        title: "Analysis completed",
        detail: "Check-in guideline review is ready for supervisor review.",
        timestamp: "Sep 9, 2026 · 10:42 AM",
      },
      {
        id: "activity-1042-2",
        title: "Case notes added",
        detail: "Case Notes - Sep 4.pdf was added to the evidence set.",
        timestamp: "Sep 4, 2026 · 2:15 PM",
      },
      {
        id: "activity-1042-3",
        title: "Meeting transcript received",
        detail: "Meeting Transcript - Sep 2.pdf is ready for review.",
        timestamp: "Sep 2, 2026 · 4:30 PM",
      },
    ],
    analysis: {
      question:
        "Did the case manager follow all check-in guidelines in the latest meeting?",
      conclusion: "PARTIALLY COMPLIANT",
      summary:
        "The case manager satisfied four of the five required check-in procedures. Employment status was not reviewed during the latest meeting.",
      checks: [
        {
          id: "check-1042-1",
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
          id: "check-1042-2",
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
          id: "check-1042-3",
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
          id: "check-1042-4",
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
          id: "check-1042-5",
          requirement: "Schedule next check-in",
          status: "MET",
          evidence: "The next check-in was scheduled before the meeting ended.",
          citation: {
            label: "Citation",
            document: "Meeting Transcript - Sep 2.pdf",
            page: 13,
          },
        },
      ],
    },
  },
  {
    id: "CS-1043",
    name: "Nathan Brooks",
    status: "Active",
    lastActivity: "Sep 8, 2026",
    latestMeeting: "Sep 1, 2026",
    lastAnalysed: "Sep 8, 2026 · 3:20 PM",
    documents: [
      {
        id: "doc-1043-1",
        name: "Meeting Transcript - Sep 1.pdf",
        type: "Meeting Transcript",
        status: "Ready",
        pages: 12,
        category: "Case evidence",
      },
      {
        id: "doc-1043-2",
        name: "Risk Assessment.pdf",
        type: "Assessment",
        status: "Ready",
        pages: 7,
        category: "Case evidence",
      },
      {
        id: "doc-1043-3",
        name: "Check-in Guidelines.pdf",
        type: "Policy",
        status: "Ready",
        pages: 22,
        category: "Governing policy",
      },
    ],
    activity: [
      {
        id: "activity-1043-1",
        title: "Analysis completed",
        detail: "Check-in guideline review is ready for supervisor review.",
        timestamp: "Sep 8, 2026 · 3:20 PM",
      },
      {
        id: "activity-1043-2",
        title: "Risk assessment received",
        detail: "Risk Assessment.pdf is ready for review.",
        timestamp: "Sep 5, 2026 · 11:10 AM",
      },
      {
        id: "activity-1043-3",
        title: "Meeting transcript received",
        detail: "Meeting Transcript - Sep 1.pdf is ready for review.",
        timestamp: "Sep 1, 2026 · 3:45 PM",
      },
    ],
    analysis: {
      question:
        "Did the case manager follow all check-in guidelines in the latest meeting?",
      conclusion: "PARTIALLY COMPLIANT",
      summary:
        "The case manager satisfied four of the five required check-in procedures. Employment status was not reviewed during the latest meeting.",
      checks: [
        {
          id: "check-1043-1",
          requirement: "Verify current address",
          status: "MET",
          evidence: "Address was confirmed during the meeting.",
          citation: {
            label: "Citation",
            document: "Meeting Transcript - Sep 1.pdf",
            page: 2,
          },
        },
        {
          id: "check-1043-2",
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
          id: "check-1043-3",
          requirement: "Review risk factors",
          status: "MET",
          evidence: "Current risk factors were reviewed with the participant.",
          citation: {
            label: "Citation",
            document: "Meeting Transcript - Sep 1.pdf",
            page: 5,
          },
        },
        {
          id: "check-1043-4",
          requirement: "Discuss treatment progress",
          status: "MET",
          evidence: "Treatment progress and current supports were discussed.",
          citation: {
            label: "Citation",
            document: "Meeting Transcript - Sep 1.pdf",
            page: 8,
          },
        },
        {
          id: "check-1043-5",
          requirement: "Schedule next check-in",
          status: "MET",
          evidence: "The next check-in was scheduled before the meeting ended.",
          citation: {
            label: "Citation",
            document: "Meeting Transcript - Sep 1.pdf",
            page: 11,
          },
        },
      ],
    },
  },
];

export function getMockCase(caseId: string | undefined) {
  return mockCases.find((caseItem) => caseItem.id === caseId);
}
