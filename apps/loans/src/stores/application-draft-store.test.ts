import { useApplicationDraft } from "./application-draft-store";

describe("application draft store", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useApplicationDraft.getState().clear();
  });

  it("never persists PII to browser storage", () => {
    useApplicationDraft.getState().saveDraft({
      fullName: "Sokha Chan",
      nationalId: "012345678",
      dateOfBirth: "1990-01-01",
      amount: 5000,
    });

    const state = useApplicationDraft.getState().values;
    expect(state).toMatchObject({ fullName: "Sokha Chan", amount: 5000 });
    expect(state).not.toHaveProperty("nationalId");
    expect(state).not.toHaveProperty("dateOfBirth");
    expect(sessionStorage.getItem("nb-application-draft")).not.toContain("012345678");
  });

  it("clears the draft and step", () => {
    useApplicationDraft.getState().setStep(2);
    useApplicationDraft.getState().clear();
    expect(useApplicationDraft.getState()).toMatchObject({ step: 0, values: {} });
  });
});
