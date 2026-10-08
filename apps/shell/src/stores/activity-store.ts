import type { LoanEvent } from "@nexbank/api";
import { create } from "zustand";

const MAX_EVENTS = 25;

export type ConnectionState = "connecting" | "open" | "error";

interface ActivityState {
  events: LoanEvent[];
  unread: number;
  paused: boolean;
  connection: ConnectionState;
  push: (event: LoanEvent) => void;
  markAllRead: () => void;
  togglePaused: () => void;
  setConnection: (state: ConnectionState) => void;
}

/**
 * Client-only UI state for the live activity feed. Server data (loans, analytics) lives in
 * TanStack Query; Zustand holds the ephemeral, client-owned bits.
 */
export const useActivityStore = create<ActivityState>()((set) => ({
  events: [],
  unread: 0,
  paused: false,
  connection: "connecting",
  push: (event) =>
    set((s) =>
      s.paused || s.events.some((e) => e.id === event.id)
        ? s
        : { events: [event, ...s.events].slice(0, MAX_EVENTS), unread: s.unread + 1 },
    ),
  markAllRead: () => set({ unread: 0 }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setConnection: (connection) => set({ connection }),
}));
