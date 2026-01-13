/**
 * Format a price in USD with $ symbol
 * @param amount - The amount in dollars
 * @returns Formatted price string (e.g., "$1.99")
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format earnings with artist share applied (85%)
 * @param totalAmount - The total amount before split
 * @param applyArtistShare - Whether to apply the 85% artist share (default: true)
 * @returns Formatted earnings string
 */
export function formatEarnings(totalAmount: number, applyArtistShare: boolean = true): string {
  const amount = applyArtistShare ? totalAmount * 0.85 : totalAmount;
  return formatPrice(amount);
}

/**
 * Format editions display (e.g., "50/100")
 * @param sold - Number of editions sold
 * @param total - Total number of editions
 * @returns Formatted editions string
 */
export function formatEditions(sold: number, total: number): string {
  return `${sold}/${total}`;
}

/**
 * Format a number with K/M suffix for large numbers
 * @param num - The number to format
 * @returns Formatted string (e.g., "12.5K", "1.2M")
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}
