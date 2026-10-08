import { z } from "zod";
import { ApiError, apiFetch } from "./http";

const GraphQLResponse = <T extends z.ZodType>(data: T) =>
  z.object({
    data: data.nullable().optional(),
    errors: z.array(z.object({ message: z.string() })).optional(),
  });

/** Minimal typed GraphQL client — POSTs to the BFF's /api/graphql endpoint. */
export async function gql<S extends z.ZodType>(
  query: string,
  variables: Record<string, unknown>,
  schema: S,
  signal?: AbortSignal,
): Promise<z.output<S>> {
  const res = await apiFetch("/api/graphql", {
    method: "POST",
    body: { query, variables },
    schema: GraphQLResponse(schema),
    signal,
  });
  if (res.errors?.length) throw new ApiError(400, res.errors.map((e) => e.message).join("; "));
  if (res.data == null) throw new ApiError(500, "GraphQL response contained no data");
  return res.data as z.output<S>;
}
