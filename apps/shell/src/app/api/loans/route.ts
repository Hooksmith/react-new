import { LoanApplicationSchema, LoanListQuerySchema } from "@nexbank/api";
import { NextResponse } from "next/server";
import { createLoan, listLoans } from "@/server/db";
import { jsonError, parseBody, withSession } from "@/server/http";

export const GET = withSession(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = LoanListQuerySchema.safeParse(params);
  if (!query.success) return jsonError(400, "bad_query", "Invalid query parameters");
  return NextResponse.json(listLoans(query.data), {
    headers: { "Cache-Control": "private, no-store" },
  });
});

export const POST = withSession(async (req) => {
  // Same Zod schema the form uses — business rules can't be bypassed by calling the API directly.
  const { data, error } = await parseBody(req, LoanApplicationSchema);
  if (error) return error;
  return NextResponse.json(createLoan(data), { status: 201 });
});
