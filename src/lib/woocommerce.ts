import type {
  WCProduct,
  WCProductVariation,
  WCCategory,
  WCOrder,
  WCCustomer,
  CreateOrderData,
  CreateCustomerData,
  ProductsQueryParams,
} from '@/types/woocommerce';

const WC_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

interface WooCommerceRequestOptions extends Omit<RequestInit, 'next'> {
  params?: Record<string, string | number | boolean | undefined>;
  next?: NextFetchRequestConfig;
}

class WooCommerceError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'WooCommerceError';
    this.status = status;
    this.code = code;
  }
}

async function wooCommerceAPI<T>(
  endpoint: string,
  options: WooCommerceRequestOptions = {}
): Promise<T> {
  const { params, next, ...fetchOptions } = options;

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    throw new WooCommerceError(
      'WooCommerce configuration is missing. Check your environment variables.',
      500
    );
  }

  // Build URL with query params
  const url = new URL(`${WC_URL}/wp-json/wc/v3${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Create Basic Auth header
  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      ...fetchOptions.headers,
    },
    next,
  });

  // Handle empty responses (like DELETE)
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new WooCommerceError(
      data?.message || `WooCommerce API Error: ${response.status}`,
      response.status,
      data?.code
    );
  }

  return data as T;
}

// Products API
export const products = {
  /**
   * Get all products with optional filters
   */
  list: (params?: ProductsQueryParams) =>
    wooCommerceAPI<WCProduct[]>('/products', {
      params: params as Record<string, string | number | boolean | undefined>,
      next: { revalidate: 60 },
    }),

  /**
   * Get a single product by ID
   */
  get: (id: number) =>
    wooCommerceAPI<WCProduct>(`/products/${id}`, {
      next: { revalidate: 60 },
    }),

  /**
   * Get a product by slug
   */
  getBySlug: async (slug: string): Promise<WCProduct | null> => {
    const results = await wooCommerceAPI<WCProduct[]>('/products', {
      params: { slug },
      next: { revalidate: 60 },
    });
    return results[0] || null;
  },

  /**
   * Get product variations
   */
  getVariations: (productId: number, params?: { per_page?: number }) =>
    wooCommerceAPI<WCProductVariation[]>(`/products/${productId}/variations`, {
      params: { per_page: 100, ...params },
      next: { revalidate: 60 },
    }),

  /**
   * Get related products
   */
  getRelated: async (product: WCProduct, limit: number = 4): Promise<WCProduct[]> => {
    if (!product.related_ids?.length) return [];

    const ids = product.related_ids.slice(0, limit);
    return wooCommerceAPI<WCProduct[]>('/products', {
      params: { include: ids.join(','), per_page: limit },
      next: { revalidate: 60 },
    });
  },
};

// Categories API
export const categories = {
  /**
   * Get all categories
   */
  list: (params?: { per_page?: number; parent?: number; hide_empty?: boolean }) =>
    wooCommerceAPI<WCCategory[]>('/products/categories', {
      params: { hide_empty: true, per_page: 100, ...params },
      next: { revalidate: 300 },
    }),

  /**
   * Get a single category by ID
   */
  get: (id: number) =>
    wooCommerceAPI<WCCategory>(`/products/categories/${id}`, {
      next: { revalidate: 300 },
    }),

  /**
   * Get a category by slug
   */
  getBySlug: async (slug: string): Promise<WCCategory | null> => {
    const results = await wooCommerceAPI<WCCategory[]>('/products/categories', {
      params: { slug },
      next: { revalidate: 300 },
    });
    return results[0] || null;
  },
};

// Orders API
export const orders = {
  /**
   * Create a new order
   */
  create: (data: CreateOrderData) =>
    wooCommerceAPI<WCOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get an order by ID
   */
  get: (id: number) =>
    wooCommerceAPI<WCOrder>(`/orders/${id}`),

  /**
   * Get orders for a customer
   */
  listByCustomer: (customerId: number, params?: { per_page?: number; page?: number }) =>
    wooCommerceAPI<WCOrder[]>('/orders', {
      params: { customer: customerId, ...params },
    }),

  /**
   * Update an order
   */
  update: (id: number, data: Partial<CreateOrderData>) =>
    wooCommerceAPI<WCOrder>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Customers API
export const customers = {
  /**
   * Create a new customer
   */
  create: (data: CreateCustomerData) =>
    wooCommerceAPI<WCCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get a customer by ID
   */
  get: (id: number) =>
    wooCommerceAPI<WCCustomer>(`/customers/${id}`),

  /**
   * Get a customer by email
   */
  getByEmail: async (email: string): Promise<WCCustomer | null> => {
    const results = await wooCommerceAPI<WCCustomer[]>('/customers', {
      params: { email },
    });
    return results[0] || null;
  },

  /**
   * Update a customer
   */
  update: (id: number, data: Partial<WCCustomer>) =>
    wooCommerceAPI<WCCustomer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Export as a single object for convenience
export const wooCommerce = {
  products,
  categories,
  orders,
  customers,
};

export { WooCommerceError };
