import type { Order } from "@/types";

/**
 * Amount the customer has to pay after discount.
 */
export function getAmountToPayAfterDiscount(order: Order): number {
  const total = order.total_amount ?? 0;
  const pct = order.discount_percentage ?? 0;
  if (pct > 0) {
    return Math.round(total * (1 - pct / 100) * 100) / 100;
  }
  return total;
}

/**
 * Amount still due (after discount). Use backend amount_due when present (it considers discount).
 */
export function getAmountDueAfterDiscount(order: Order): number {
  if (order.amount_due != null && order.amount_due !== undefined) {
    return Math.max(0, order.amount_due);
  }
  const toPay = getAmountToPayAfterDiscount(order);
  const paid = order.paid_amount ?? 0;
  return Math.max(0, Math.round((toPay - paid) * 100) / 100);
}

/**
 * True when no amount is left to pay (considers discount).
 * Record Payment should be hidden when this is true.
 */
export function isOrderFullyPaid(order: Order): boolean {
  const amountDue = getAmountDueAfterDiscount(order);
  return amountDue <= 0;
}
