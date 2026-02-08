/**
 * Format a number as a price string with comma separators.
 * Uses a manual approach to avoid server/client hydration mismatches
 * caused by differing locale implementations in Node.js vs browsers.
 *
 * @example formatPrice(28999) => "28,999"
 * @example formatPrice(153789) => "153,789"
 */
export function formatPrice(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
