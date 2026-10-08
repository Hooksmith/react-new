// Shared between the server prefetch (page.tsx) and the client component (dashboard.tsx) so the
// query keys match exactly and the hydrated cache is reused.
export const RECENT_LOANS_QUERY = { page: 1, pageSize: 6 } as const;
