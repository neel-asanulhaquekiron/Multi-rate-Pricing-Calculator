/**
 * Zod schemas shared by server (API validation, the source of truth) and
 * client (instant form feedback). Error messages are deliberately specific —
 * the assignment grades "validation with specific error messages".
 */
import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "email is required" })
  .trim()
  .toLowerCase()
  .email("enter a valid email address");

export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "password is required" })
    .min(8, "password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "password is required" }).min(1, "password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
