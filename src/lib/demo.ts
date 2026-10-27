export const businessTypes = [
  "Salon or barbershop",
  "Dental practice",
  "Medical clinic",
  "Auto repair shop",
  "Home services",
  "Spa or wellness",
  "Pet care",
  "Fitness studio",
  "Other local business",
] as const;

export type DemoIntent = {
  kind: "demo" | "trial";
  source: string;
  industry?: string;
  estimate?: number;
};

export type DemoSubmission = {
  name: string;
  email: string;
  businessName: string;
  businessType: string;
  phone: string;
  message: string;
  consent: boolean;
  website: string;
  kind: "demo" | "trial";
  source: string;
};

export type ValidationResult =
  | { valid: true; data: DemoSubmission }
  | { valid: false; error: string };

export function validateDemoSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "Please complete the inquiry form." };
  }

  const raw = input as Record<string, unknown>;
  const stringValue = (key: string) => typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
  const data: DemoSubmission = {
    name: stringValue("name"),
    email: stringValue("email").toLowerCase(),
    businessName: stringValue("businessName"),
    businessType: stringValue("businessType"),
    phone: stringValue("phone"),
    message: stringValue("message"),
    consent: raw.consent === true,
    website: stringValue("website"),
    kind: raw.kind === "trial" ? "trial" : "demo",
    source: stringValue("source").slice(0, 160) || "Website",
  };

  if (data.website) return { valid: false, error: "We couldn’t submit this request. Please try again." };
  if (data.name.length < 2 || data.name.length > 120) {
    return { valid: false, error: "Please enter your name (2–120 characters)." };
  }
  if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  if (data.businessName.length < 2 || data.businessName.length > 160) {
    return { valid: false, error: "Please enter your business name (2–160 characters)." };
  }
  if (!businessTypes.some((type) => type === data.businessType)) {
    return { valid: false, error: "Please select your business type." };
  }
  if (data.phone.length > 40 || (data.phone && !/^[+\d\s().-]{7,40}$/.test(data.phone))) {
    return { valid: false, error: "Please enter a valid phone number, or leave it blank." };
  }
  if (data.message.length > 2000) {
    return { valid: false, error: "Please keep your message under 2,000 characters." };
  }
  if (!data.consent) {
    return { valid: false, error: "Please agree to be contacted about your request." };
  }
  return { valid: true, data };
}
