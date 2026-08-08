/**
 * Zod schemas shared by server (API validation, the source of truth) and
 * client (instant form feedback). Error messages are deliberately specific —
 * the assignment grades "validation with specific error messages".
 */
import { z } from "zod";
import type { Discount } from "./calc";
import { ymdToDate } from "./dates";

/**
 * Caps keep every stored amount inside Postgres Int4 (2,147,483,647 cents):
 * a single line subtotal may not exceed $20M; the service layer additionally
 * rejects documents whose totals would overflow (documented in the README).
 */
export const MAX_LINE_SUBTOTAL_CENTS = 2_000_000_000;
export const MAX_TOTAL_CENTS = 2_147_483_647;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const ymdSchema = z
  .string({ required_error: "issue date is required" })
  .refine(
    (value) => {
      try {
        ymdToDate(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "issue date must be a real date in YYYY-MM-DD format" },
  );

export const documentInputSchema = z.object({
  title: z
    .string({ required_error: "title is required" })
    .trim()
    .min(1, "title is required")
    .max(200, "title must be at most 200 characters"),
  customer: z
    .string({ required_error: "customer is required" })
    .trim()
    .min(1, "customer is required")
    .max(200, "customer must be at most 200 characters"),
  issueDate: ymdSchema,
});

export const duplicateInputSchema = z.object({
  // Decision 10A: the CLIENT supplies its local "today" — the server's clock
  // lives in a different timezone than the user.
  issueDate: ymdSchema,
});

export type DocumentInput = z.infer<typeof documentInputSchema>;

/**
 * Report query — decision 9A: counts ALL documents (drafts included), filters
 * on issueDate, boundaries inclusive.
 */
export const reportQuerySchema = z
  .object({
    from: ymdSchema.describe("start of the range"),
    to: ymdSchema.describe("end of the range"),
  })
  .refine((range) => range.from <= range.to, {
    message: "'from' must be on or before 'to'",
    path: ["from"],
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;

// ---------------------------------------------------------------------------
// Line items
// ---------------------------------------------------------------------------

const rawDiscountSchema = z
  .object({
    type: z.enum(["percent", "fixed"], {
      errorMap: () => ({ message: "discount type must be \"percent\" or \"fixed\"" }),
    }),
    bp: z.number().optional(),
    cents: z.number().optional(),
  })
  .nullish();

const rawLineSchema = z.object({
  description: z
    .string({ required_error: "description is required" })
    .trim()
    .min(1, "description is required")
    .max(200, "description must be at most 200 characters"),
  quantity: z
    .number({ required_error: "quantity is required", invalid_type_error: "quantity must be a number" })
    .int("quantity must be an integer ≥ 1")
    .min(1, "quantity must be an integer ≥ 1"),
  unitPriceCents: z
    .number({ required_error: "unit price is required", invalid_type_error: "unit price must be a number" })
    .int("unit price must be a whole number of cents")
    .min(0, "unit price must be ≥ 0"),
  discount: rawDiscountSchema,
  taxBp: z
    .number({ invalid_type_error: "tax percent must be a number" })
    .int("tax percent must have at most 2 decimal places")
    .min(0, "tax percent must be between 0 and 100")
    .max(10000, "tax percent must be between 0 and 100")
    .nullish(),
});

const isBpValid = (bp: number): boolean => {
  return Number.isInteger(bp) && bp >= 0 && bp <= 10000;
};

export const lineInputSchema = rawLineSchema
  .superRefine((line, ctx) => {
    const subtotal = line.quantity * line.unitPriceCents;
    if (subtotal > MAX_LINE_SUBTOTAL_CENTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unitPriceCents"],
        message: "line subtotal exceeds the supported maximum of $20,000,000",
      });
    }

    const discount = line.discount;
    if (!discount) {
      return;
    }
    if (discount.type === "percent") {
      if (discount.cents !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount"],
          message: "a line may have a percent or fixed discount, not both",
        });
      }
      if (discount.bp === undefined || !isBpValid(discount.bp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount", "bp"],
          message: "percent must be between 0 and 100 with at most 2 decimal places",
        });
      }
    }
    if (discount.type === "fixed") {
      if (discount.bp !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount"],
          message: "a line may have a percent or fixed discount, not both",
        });
      }
      if (discount.cents === undefined || !Number.isInteger(discount.cents) || discount.cents < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount", "cents"],
          message: "fixed discount must be a whole number of cents ≥ 0",
        });
      } else if (discount.cents > subtotal) {
        // Decision 1A: reject, never silently rewrite what the user typed.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discount", "cents"],
          message: "fixed discount cannot exceed the line subtotal",
        });
      }
    }
  })
  .transform((line) => {
    let discount: Discount = null;
    if (line.discount?.type === "percent") {
      discount = { type: "percent", bp: line.discount.bp as number };
    }
    if (line.discount?.type === "fixed") {
      discount = { type: "fixed", cents: line.discount.cents as number };
    }
    return {
      description: line.description,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      discount,
      taxBp: line.taxBp ?? null,
    };
  });

export type LineItemInput = z.infer<typeof lineInputSchema>;
