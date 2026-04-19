import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtPct(v: number, decimals = 2): string {
  return (v * 100).toFixed(decimals) + "%";
}

export function fmtNum(v: number, decimals = 2): string {
  return v.toFixed(decimals);
}
