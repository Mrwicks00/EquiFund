import { formatUnits, type Address } from "viem";

export const USDC_DECIMALS = 6;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatUSDC(amount: bigint | number | string) {
  if (typeof amount === "number") {
    return currencyFormatter.format(amount);
  }

  if (typeof amount === "string") {
    const parsed = Number(amount);
    if (Number.isFinite(parsed)) {
      return currencyFormatter.format(parsed);
    }
  }

  if (typeof amount === "bigint") {
    const value = Number(formatUnits(amount, USDC_DECIMALS));
    return currencyFormatter.format(value);
  }

  return currencyFormatter.format(0);
}

export function formatNumber(value: bigint | number) {
  if (typeof value === "bigint") {
    return numberFormatter.format(Number(value));
  }
  return numberFormatter.format(value);
}

export function truncateAddress(address: Address, length = 4) {
  return `${address.slice(0, 2 + length)}…${address.slice(-length)}`;
}
