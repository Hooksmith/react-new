import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(64),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CurrentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["loan_officer", "credit_analyst", "admin"]),
});
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
