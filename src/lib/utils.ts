import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price with currency symbol
 */
export function formatPrice(
  price: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to a specified length
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

/**
 * Generate product URL
 */
export function getProductUrl(slug: string): string {
  return `/product/${slug}`;
}

/**
 * Generate category URL
 */
export function getCategoryUrl(slug: string): string {
  return `/shop/${slug}`;
}

/**
 * Parse price range from WooCommerce variable product
 * Returns formatted string like "$10.00 - $20.00"
 */
export function formatPriceRange(price: string, currency: string = 'USD'): string {
  if (!price) return '';

  // WooCommerce returns price range as "10.00 - 20.00" for variable products
  if (price.includes('-')) {
    const [min, max] = price.split('-').map((p) => p.trim());
    return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
  }

  return formatPrice(price, currency);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(regularPrice: string, salePrice: string): number {
  const regular = parseFloat(regularPrice);
  const sale = parseFloat(salePrice);

  if (isNaN(regular) || isNaN(sale) || regular <= 0) {
    return 0;
  }

  return Math.round(((regular - sale) / regular) * 100);
}

/**
 * Check if product is on sale
 */
export function isOnSale(regularPrice: string, salePrice: string): boolean {
  if (!salePrice) return false;
  const regular = parseFloat(regularPrice);
  const sale = parseFloat(salePrice);
  return !isNaN(regular) && !isNaN(sale) && sale < regular;
}

/**
 * Format date string
 */
export function formatDate(dateString: string, locale: string = 'en-US'): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    instock: 'In Stock',
    outofstock: 'Out of Stock',
    onbackorder: 'On Backorder',
  };
  return labels[status] || status;
}

/**
 * Get stock status color class
 */
export function getStockStatusColor(status: string): string {
  const colors: Record<string, string> = {
    instock: 'text-green-600',
    outofstock: 'text-red-600',
    onbackorder: 'text-yellow-600',
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse query string to object
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
