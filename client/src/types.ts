/** API response shapes (mirrors the server's documentService DTOs). */
import type { Discount } from "shared";

export type DocumentStatus = "draft" | "finalized";

export interface LineDto {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount: Discount;
  taxBp: number | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}

export interface DocumentDto {
  id: string;
  title: string;
  customer: string;
  issueDate: string; // YYYY-MM-DD
  status: DocumentStatus;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
  lines?: LineDto[];
}
