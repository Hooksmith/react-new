import { NextResponse } from "next/server";
import { z } from "zod";
import { isProd } from "@/env";
import { executeGraphQL } from "@/server/graphql";
import { parseBody, withSession } from "@/server/http";

const GraphQLRequest = z.object({
  query: z.string().min(1),
  variables: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withSession(async (req) => {
  const { data, error } = await parseBody(req, GraphQLRequest);
  if (error) return error;
  const result = await executeGraphQL(data.query, data.variables, { production: isProd });
  return NextResponse.json(result, { status: result.errors && !result.data ? 400 : 200 });
});
