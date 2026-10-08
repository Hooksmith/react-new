import {
  buildCsp,
  createSessionToken,
  publicOrigin,
  verifyCsrf,
  verifySessionToken,
} from "./index";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const user = { sub: "u_1", name: "Dara Sok", role: "loan_officer" as const };

describe("session tokens", () => {
  it("round-trips a valid session", async () => {
    const token = await createSessionToken(user, SECRET);
    await expect(verifySessionToken(token, SECRET)).resolves.toMatchObject(user);
  });

  it("rejects a tampered payload", async () => {
    const token = await createSessionToken(user, SECRET);
    const [, sig] = token.split(".");
    const forged = btoa(JSON.stringify({ ...user, role: "admin", exp: 9e9 })).replace(/=+$/, "");
    await expect(verifySessionToken(`${forged}.${sig}`, SECRET)).resolves.toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await createSessionToken(user, `${SECRET}-other`);
    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const issuedAt = Date.now() - 1000 * 60 * 60;
    const token = await createSessionToken(user, SECRET, issuedAt);
    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("refuses weak secrets", async () => {
    await expect(createSessionToken(user, "short")).rejects.toThrow(/32 characters/);
  });
});

describe("verifyCsrf", () => {
  const base = {
    cookieToken: "abc",
    headerToken: "abc",
    origin: null,
    allowedOrigins: ["https://bank.test"],
  };

  it("allows safe methods without a token", () => {
    expect(
      verifyCsrf({ ...base, method: "GET", cookieToken: undefined, headerToken: null }),
    ).toEqual({ ok: true });
  });

  it("accepts matching tokens on POST", () => {
    expect(verifyCsrf({ ...base, method: "POST" })).toEqual({ ok: true });
  });

  it("rejects mismatched tokens", () => {
    expect(verifyCsrf({ ...base, method: "POST", headerToken: "xyz" })).toEqual({
      ok: false,
      reason: "token_mismatch",
    });
  });

  it("rejects cross-origin requests", () => {
    expect(verifyCsrf({ ...base, method: "POST", origin: "https://evil.test" })).toEqual({
      ok: false,
      reason: "origin_mismatch",
    });
  });
});

describe("buildCsp", () => {
  it("embeds the nonce and forbids framing", () => {
    const csp = buildCsp("n0nce", { isDev: false });
    expect(csp).toContain("'nonce-n0nce'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });
});

describe("publicOrigin", () => {
  it("prefers forwarded headers from the ingress", () => {
    const headers = new Headers({
      "x-forwarded-proto": "https",
      "x-forwarded-host": "bank.example.com",
    });
    expect(publicOrigin(headers, "http://loans:3000/loans/apply")).toBe("https://bank.example.com");
  });

  it("falls back to the request URL", () => {
    expect(publicOrigin(new Headers(), "http://localhost:3001/loans")).toBe(
      "http://localhost:3001",
    );
  });
});
