import { formatMoney, formatPercent, type Discount } from "shared";

/** "10%", "$20.00", or "—" — one rendering of a discount everywhere. */
export const discountLabel = (discount: Discount): string => {
  if (!discount) {
    return "—";
  }
  if (discount.type === "percent") {
    return `${formatPercent(discount.bp)}%`;
  }
  return `$${formatMoney(discount.cents)}`;
};
