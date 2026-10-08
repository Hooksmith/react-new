import type { LoanEvent } from "@nexbank/api";
import { useActivityStore } from "./activity-store";

const event = (id: string): LoanEvent => ({
  id,
  type: "loan.status_changed",
  loanId: "ln_1",
  reference: "LN-2026-10001",
  applicantName: "Sokha Chan",
  from: "SUBMITTED",
  to: "UNDER_REVIEW",
  at: new Date().toISOString(),
});

describe("activity store", () => {
  beforeEach(() => useActivityStore.setState({ events: [], unread: 0, paused: false }));

  it("prepends events and counts unread", () => {
    useActivityStore.getState().push(event("a"));
    useActivityStore.getState().push(event("b"));
    expect(useActivityStore.getState().events.map((e) => e.id)).toEqual(["b", "a"]);
    expect(useActivityStore.getState().unread).toBe(2);
  });

  it("de-duplicates replayed events (EventSource reconnects)", () => {
    useActivityStore.getState().push(event("a"));
    useActivityStore.getState().push(event("a"));
    expect(useActivityStore.getState().events).toHaveLength(1);
  });

  it("ignores events while paused", () => {
    useActivityStore.getState().togglePaused();
    useActivityStore.getState().push(event("a"));
    expect(useActivityStore.getState().events).toHaveLength(0);
  });

  it("caps the feed length", () => {
    for (let i = 0; i < 40; i++) useActivityStore.getState().push(event(String(i)));
    expect(useActivityStore.getState().events).toHaveLength(25);
  });
});
