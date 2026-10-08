import "server-only";
import {
  buildSchema,
  execute,
  GraphQLError,
  NoSchemaIntrospectionCustomRule,
  parse,
  specifiedRules,
  validate,
  type ExecutionResult,
} from "graphql";
import { getCreditBands, getLoan } from "./db";

export const schema = buildSchema(/* GraphQL */ `
  type CreditBand {
    band: String!
    min: Int!
    max: Int!
    count: Int!
    defaultRate: Float!
  }

  type Loan {
    id: ID!
    reference: String!
    applicantName: String!
    product: String!
    amount: Float!
    status: String!
    creditScore: Int!
  }

  type Query {
    creditBands: [CreditBand!]!
    loan(id: ID!): Loan
  }
`);

const rootValue = {
  creditBands: () => getCreditBands(),
  loan: ({ id }: { id: string }) => getLoan(id) ?? null,
};

const MAX_QUERY_LENGTH = 2_000;
const MAX_DEPTH = 5;

function depthOf(query: string): number {
  let depth = 0;
  let max = 0;
  for (const ch of query) {
    if (ch === "{") max = Math.max(max, ++depth);
    else if (ch === "}") depth--;
  }
  return max;
}

/**
 * Executes a query with abuse protections appropriate for a banking API:
 * size + depth limits, and no schema introspection in production.
 */
export async function executeGraphQL(
  query: string,
  variables: Record<string, unknown> | undefined,
  { production }: { production: boolean },
): Promise<ExecutionResult> {
  if (query.length > MAX_QUERY_LENGTH) return { errors: [new GraphQLError("Query too large")] };
  if (depthOf(query) > MAX_DEPTH) return { errors: [new GraphQLError("Query too deep")] };

  let document;
  try {
    document = parse(query);
  } catch (err) {
    return { errors: [err instanceof GraphQLError ? err : new GraphQLError("Invalid query")] };
  }

  const rules = production ? [...specifiedRules, NoSchemaIntrospectionCustomRule] : specifiedRules;
  const validationErrors = validate(schema, document, rules);
  if (validationErrors.length) return { errors: validationErrors };

  return execute({ schema, document, rootValue, variableValues: variables });
}
