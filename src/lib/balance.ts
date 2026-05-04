// Tenant balance = total rent due since first payment month - sum of payments.
// Simplified: positive = tenant has credit; negative = tenant owes.
import type { Payment } from "./types";

export function computeBalance(rent: number, payments: Payment[], leaseStart?: string): number {
  if (!payments.length && !leaseStart) return 0;
  const start = leaseStart ? new Date(leaseStart) : new Date(payments[payments.length - 1]?.date ?? Date.now());
  const now = new Date();
  const months = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1);
  const due = rent * months;
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  return paid - due;
}
