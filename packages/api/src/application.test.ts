import { LoanApplicationSchema, monthlyInstallment, type LoanApplicationInput } from "./index";

const valid: LoanApplicationInput = {
  fullName: "Sokha Chan",
  nationalId: "012345678",
  email: "sokha@example.com",
  phone: "+85512345678",
  dateOfBirth: "1990-05-01",
  employmentType: "SALARIED",
  employerName: "ACME Co., Ltd.",
  monthlyIncome: 2500,
  product: "PERSONAL",
  currency: "USD",
  amount: 10_000,
  termMonths: 36,
  purpose: "Home renovation and furniture",
};

const issuesFor = (input: LoanApplicationInput) => {
  const result = LoanApplicationSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("LoanApplicationSchema", () => {
  it("accepts a valid application", () => {
    expect(issuesFor(valid)).toEqual([]);
  });

  it("coerces numeric strings from form inputs", () => {
    const parsed = LoanApplicationSchema.parse({
      ...valid,
      amount: "10000",
      termMonths: "36",
      monthlyIncome: "2500",
    });
    expect(parsed.amount).toBe(10_000);
  });

  it("rejects minors", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 17);
    expect(issuesFor({ ...valid, dateOfBirth: dob.toISOString().slice(0, 10) })).toContain(
      "dateOfBirth",
    );
  });

  it("requires an employer for salaried applicants", () => {
    expect(issuesFor({ ...valid, employerName: "" })).toContain("employerName");
    expect(issuesFor({ ...valid, employmentType: "SELF_EMPLOYED", employerName: "" })).toEqual([]);
  });

  it("enforces product amount limits (converting KHR to USD)", () => {
    expect(issuesFor({ ...valid, amount: 100 })).toContain("amount");
    expect(issuesFor({ ...valid, currency: "KHR", amount: 41_000_000 })).toEqual([]);
  });

  it("enforces the debt-service ratio", () => {
    expect(issuesFor({ ...valid, monthlyIncome: 300 })).toContain("amount");
  });

  it("rejects script injection in the name field", () => {
    expect(issuesFor({ ...valid, fullName: "<script>alert(1)</script>" })).toContain("fullName");
  });
});

describe("monthlyInstallment", () => {
  it("matches the standard amortisation formula", () => {
    expect(monthlyInstallment(10_000, 0.12, 12)).toBeCloseTo(888.49, 2);
  });

  it("handles zero interest", () => {
    expect(monthlyInstallment(1200, 0, 12)).toBe(100);
  });
});
