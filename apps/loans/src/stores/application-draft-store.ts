import type { LoanApplicationInput } from "@nexbank/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Fields never written to browser storage (PII / regulated identifiers). */
export const SENSITIVE_FIELDS = ["nationalId", "dateOfBirth"] as const;

export type DraftValues = Partial<Omit<LoanApplicationInput, (typeof SENSITIVE_FIELDS)[number]>>;

interface DraftState {
  step: number;
  values: DraftValues;
  saveDraft: (values: Partial<LoanApplicationInput>) => void;
  setStep: (step: number) => void;
  clear: () => void;
}

const stripSensitive = (values: Partial<LoanApplicationInput>): DraftValues => {
  const copy: Partial<LoanApplicationInput> = { ...values };
  for (const key of SENSITIVE_FIELDS) delete copy[key];
  return copy;
};

/**
 * Multi-step form draft so an officer doesn't lose work on refresh.
 * sessionStorage (cleared when the tab closes) + PII stripped — a deliberate trade-off between
 * convenience and data-protection on shared branch workstations.
 */
export const useApplicationDraft = create<DraftState>()(
  persist(
    (set) => ({
      step: 0,
      values: {},
      saveDraft: (values) => set({ values: stripSensitive(values) }),
      setStep: (step) => set({ step }),
      clear: () => set({ step: 0, values: {} }),
    }),
    {
      name: "nb-application-draft",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);
