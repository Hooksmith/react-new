import { canTransition, UpdateLoanStatusSchema } from "@nexbank/api";
import { NextResponse } from "next/server";
import { getLoan, setLoanStatus } from "@/server/db";
import { publishStatusChange } from "@/server/events";
import { jsonError, parseBody, withSession } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withSession<Ctx>(async (_req, { params }) => {
  const loan = getLoan((await params).id);
  return loan ? NextResponse.json(loan) : jsonError(404, "not_found", "Loan not found");
});

export const PATCH = withSession<Ctx>(async (req, { params, session }) => {
  const { id } = await params;
  const loan = getLoan(id);
  if (!loan) return jsonError(404, "not_found", "Loan not found");

  const { data, error } = await parseBody(req, UpdateLoanStatusSchema);
  if (error) return error;

  if (!canTransition(session.role, loan.status, data.status)) {
    return jsonError(
      403,
      "forbidden_transition",
      `Your role cannot move a loan from ${loan.status} to ${data.status}`,
    );
  }

  const updated = setLoanStatus(id, data.status)!;
  publishStatusChange(updated, loan.status);
  return NextResponse.json(updated);
});
