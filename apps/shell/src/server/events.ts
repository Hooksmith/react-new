import "server-only";
import { ALLOWED_TRANSITIONS, type Loan, type LoanEvent, type LoanStatus } from "@nexbank/api";
import { randomActiveLoan, setLoanStatus } from "./db";

type Listener = (event: LoanEvent) => void;

interface Bus {
  listeners: Set<Listener>;
  timer?: ReturnType<typeof setInterval>;
}

/**
 * In-process pub/sub feeding the SSE endpoint. In production this would be backed by
 * Kafka/Redis pub-sub so every replica receives every event.
 */
const g = globalThis as unknown as { __nexbankBus?: Bus };
const bus: Bus = (g.__nexbankBus ??= { listeners: new Set() });

export function publishStatusChange(loan: Loan, from: LoanStatus) {
  const event: LoanEvent = {
    id: crypto.randomUUID(),
    type: "loan.status_changed",
    loanId: loan.id,
    reference: loan.reference,
    applicantName: loan.applicantName,
    from,
    to: loan.status,
    at: loan.updatedAt,
  };
  for (const listener of bus.listeners) listener(event);
}

/** Simulates other staff working the queue so the dashboard has live activity to show. */
function simulateActivity() {
  const loan = randomActiveLoan();
  if (!loan) return;
  const options = ALLOWED_TRANSITIONS[loan.status];
  const next = options[Math.floor(Math.random() * options.length)];
  if (!next) return;
  const updated = setLoanStatus(loan.id, next);
  if (updated) publishStatusChange(updated, loan.status);
}

export function subscribe(listener: Listener): () => void {
  bus.listeners.add(listener);
  if (!bus.timer && process.env.DISABLE_SIMULATOR !== "true") {
    bus.timer = setInterval(simulateActivity, 7_000);
  }
  return () => {
    bus.listeners.delete(listener);
    if (bus.listeners.size === 0 && bus.timer) {
      clearInterval(bus.timer);
      bus.timer = undefined;
    }
  };
}
