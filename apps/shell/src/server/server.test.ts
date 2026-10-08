// @vitest-environment node
import { __resetDb, getLoan, listLoans } from "./db";
import { executeGraphQL } from "./graphql";

describe("loan repository", () => {
  beforeEach(() => __resetDb());

  it("paginates and filters", () => {
    const page = listLoans({ page: 1, pageSize: 5, status: "APPROVED" });
    expect(page.items).toHaveLength(Math.min(5, page.total));
    expect(page.items.every((l) => l.status === "APPROVED")).toBe(true);
  });

  it("never exposes the raw national ID", () => {
    const loan = listLoans({ page: 1, pageSize: 1 }).items[0]!;
    expect(loan).not.toHaveProperty("nationalId");
    expect(getLoan(loan.id)?.nationalIdMasked).toMatch(/^•+\d{4}$/);
  });
});

describe("GraphQL executor", () => {
  it("resolves credit bands", async () => {
    const result = await executeGraphQL("{ creditBands { band count } }", undefined, {
      production: true,
    });
    expect(result.errors).toBeUndefined();
    expect((result.data as { creditBands: unknown[] }).creditBands).toHaveLength(4);
  });

  it("blocks introspection in production", async () => {
    const result = await executeGraphQL("{ __schema { types { name } } }", undefined, {
      production: true,
    });
    expect(result.errors?.[0]?.message).toMatch(/introspection/i);
  });

  it("rejects overly deep queries", async () => {
    const deep = "{ a { b { c { d { e { f } } } } } }";
    const result = await executeGraphQL(deep, undefined, { production: false });
    expect(result.errors?.[0]?.message).toBe("Query too deep");
  });
});
