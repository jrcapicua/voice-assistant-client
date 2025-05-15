/**
 * Utility to concatenate classes conditionally (shadcn/ui).
 */

type ClassValue = string | number | boolean | null | undefined | (string | number | boolean | null | undefined)[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(" ");
}
