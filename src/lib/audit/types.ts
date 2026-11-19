export const auditBusinessTypes = [
  "HVAC",
  "Roofing",
  "Plumbing",
  "Electrical",
  "Auto Repair",
  "Cleaning Services",
  "Landscaping",
  "Pest Control",
  "Garage Door Services",
  "Other Service Business",
] as const;

export const monthlyCallRanges = [
  "Under 50",
  "50–100",
  "100–250",
  "250–500",
  "500+",
] as const;

export const missedCallRanges = [
  "Under 5%",
  "5–10%",
  "10–25%",
  "25–40%",
  "Over 40%",
  "I don't know",
] as const;

export const jobValueRanges = [
  "Under $500",
  "$500–$1,500",
  "$1,500–$5,000",
  "$5,000–$10,000",
  "$10,000+",
] as const;

export type AuditFormData = {
  businessName: string;
  websiteUrl: string;
  googleBusinessProfileUrl: string;
  businessType: (typeof auditBusinessTypes)[number] | "";
  monthlyCallsRange: (typeof monthlyCallRanges)[number] | "";
  missedCallsRange: (typeof missedCallRanges)[number] | "";
  averageJobValueRange: (typeof jobValueRanges)[number] | "";
  businessEmail: string;
};

export type AuditField = keyof AuditFormData;

export type AuditStatus = "Good" | "Needs improvement" | "Critical" | "Unable to verify";

export type AuditFinding = {
  label: string;
  status: AuditStatus;
  detail: string;
};

export type AuditSection = {
  id: "google-business-profile" | "website" | "missed-call-revenue" | "lead-recovery";
  title: string;
  status: AuditStatus;
  summary: string;
  findings: AuditFinding[];
};

export type AuditReport = {
  businessName: string;
  auditDate: string;
  overallScore: number | null;
  scoreExplanation: string;
  revenue: {
    representativeMonthlyCalls: number;
    representativeMissRate: number | null;
    estimatedMonthlyMissedCalls: number | null;
    representativeJobValue: number;
    assumedConversionRate: number;
    estimatedMonthlyOpportunity: number | null;
    assumptions: string[];
  };
  sections: AuditSection[];
  recommendations: Array<{ priority: "High" | "Medium"; title: string; detail: string }>;
  disclaimer: string;
};
