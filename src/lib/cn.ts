import { twMerge } from "tailwind-merge";

/**
 * Joins class names, dropping falsy values. Conflicting Tailwind classes are
 * resolved so the later one wins (e.g. a component default `text-gray-900`
 * overridden by a caller's `text-blue-600`).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
