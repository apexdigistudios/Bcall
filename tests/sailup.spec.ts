import { expect, test } from "@playwright/test";
import {
  createMissedCallMessage,
  getPrimarySailupSender,
  validateGhanaRecipient,
  validateSenderRegistration,
  type SailupSender,
} from "../src/lib/sailup";

test("validates Sender ID registration fields and limits", () => {
  const valid = validateSenderRegistration({
    name: "Yelllo Shop",
    use_case: "transactional",
    notes: "Missed-call follow-up",
    sample_message: "Yelllo Shop: We missed your call. Reply STOP to opt out.",
  });
  expect(valid.success).toBe(true);

  expect(validateSenderRegistration({
    name: "Sender Name 12",
    use_case: "transactional",
    sample_message: "Example",
  }).success).toBe(false);
  expect(validateSenderRegistration({
    name: "Yelllo!",
    use_case: "transactional",
    sample_message: "Example",
  }).success).toBe(false);
  expect(validateSenderRegistration({
    name: "Yelllo",
    use_case: "support",
    sample_message: "Example",
  }).success).toBe(false);
});

test("accepts only Ghanaian phone number formats for Sailup SMS", () => {
  expect(validateGhanaRecipient("+233 24 123 4567")).toBe("+233241234567");
  expect(validateGhanaRecipient("024-123-4567")).toBe("0241234567");
  expect(validateGhanaRecipient("+1 415 555 0100")).toBeNull();
  expect(validateGhanaRecipient("024-123")).toBeNull();
});

test("uses the business template and chooses an active default sender", () => {
  const message = createMissedCallMessage("Yelllo Shop", "Hi [Business Name], we missed your call at [Time].");
  expect(message).toMatch(/^Hi Yelllo Shop, we missed your call at /);

  const sender = (status: string, isDefault = false): SailupSender => ({
    id: status,
    name: "Yelllo Shop",
    use_case: "transactional",
    sample_message: "Example",
    notes: "",
    status,
    status_reason: "",
    is_default: isDefault,
    reviewed_at: null,
    created_at: "",
  });
  expect(getPrimarySailupSender([sender("pending"), sender("active")])?.status).toBe("active");
  expect(getPrimarySailupSender([sender("active"), sender("active", true)])?.is_default).toBe(true);
  expect(getPrimarySailupSender([sender("pending")])?.status).toBe("pending");
});
