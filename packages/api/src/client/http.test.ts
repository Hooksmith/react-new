import { z } from "zod";
import { ApiError, apiFetch, CSRF_HEADER } from "./http";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("apiFetch", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "nb_csrf=tok123; path=/";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("attaches the CSRF header on mutations only", async () => {
    fetchMock.mockImplementation(async () => json({ ok: true }));
    await apiFetch("/api/x", { schema: z.object({ ok: z.boolean() }) });
    await apiFetch("/api/x", { method: "POST", body: {}, schema: z.object({ ok: z.boolean() }) });

    const [, getInit] = fetchMock.mock.calls[0]!;
    const [, postInit] = fetchMock.mock.calls[1]!;
    expect((getInit?.headers as Record<string, string>)[CSRF_HEADER]).toBeUndefined();
    expect((postInit?.headers as Record<string, string>)[CSRF_HEADER]).toBe("tok123");
  });

  it("surfaces server error messages", async () => {
    fetchMock.mockResolvedValue(json({ error: { message: "Invalid transition" } }, 409));
    await expect(apiFetch("/api/x", { schema: z.unknown() })).rejects.toMatchObject({
      status: 409,
      message: "Invalid transition",
    });
  });

  it("fails loudly when the response breaks the contract", async () => {
    fetchMock.mockResolvedValue(json({ amount: "not-a-number" }));
    await expect(
      apiFetch("/api/x", { schema: z.object({ amount: z.number() }) }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
