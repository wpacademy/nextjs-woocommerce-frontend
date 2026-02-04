# Headless WordPress + WooCommerce + Next.js Integration Plan

## Overview

Build a modern, Zara-inspired ecommerce storefront using:
- **Frontend**: Next.js 14+ (App Router) + Tailwind CSS
- **Backend/CMS**: WordPress + WooCommerce (Headless)
- **API**: WooCommerce REST API (products/orders) + WPGraphQL (content/menus)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Pages     │  │ Components  │  │    State Management     │ │
│  │  - Home     │  │  - Header   │  │  - Cart (Zustand)       │ │
│  │  - Shop     │  │  - Product  │  │  - Auth                 │ │
│  │  - Product  │  │  - Cart     │  │  - Wishlist             │ │
│  │  - Cart     │  │  - Footer   │  └─────────────────────────┘ │
│  │  - Checkout │  └─────────────┘                               │
│  └─────────────┘                                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐     ┌───────────────────────────────────┐
│   WooCommerce REST    │     │         WPGraphQL                 │
│   /wp-json/wc/v3/     │     │         /graphql                  │
│                       │     │                                   │
│  • Products           │     │  • Pages & Posts                  │
│  • Categories         │     │  • Menus & Navigation             │
│  • Orders             │     │  • Media                          │
│  • Customers          │     │  • Custom Fields (ACF)            │
│  • Coupons            │     │  • Site Settings                  │
└───────────────────────┘     └───────────────────────────────────┘
```

### API Strategy (All Free)

| Data Type | API | Why |
|-----------|-----|-----|
| Products & Variations | WooCommerce REST | Native, well-documented, reliable |
| Categories & Tags | WooCommerce REST | Built-in filtering & sorting |
| Cart (client-side) | Zustand Store | No server cart needed |
| Checkout & Orders | WooCommerce REST | Full order management |
| Customer Accounts | WooCommerce REST API | Customer profiles & data |
| User Authentication | JWT Auth (REST API) | Login, register, token validation |
| Pages & Posts | WPGraphQL | Flexible content queries |
| Menus & Navigation | WPGraphQL | Dynamic menus |
| Site Settings | WPGraphQL | Logo, footer, etc. |

---

## Phase 1: WordPress Configuration

### 1.1 Required WordPress Plugins

| Plugin | Purpose | Install From | Cost |
|--------|---------|--------------|------|
| **WooCommerce** | Ecommerce functionality | WordPress.org | Free |
| **WPGraphQL** | GraphQL API for content (pages, menus) | WordPress.org | Free |
| **JWT Authentication for WP REST API** | User authentication for REST API | WordPress.org | Free |

> **Only 3 plugins needed!** WooCommerce REST API is built-in. JWT Auth plugin handles all authentication via REST API.

### 1.2 Plugin Installation

#### Via WordPress Admin:
1. Go to **Plugins → Add New**
2. Search and install each plugin:
   - WooCommerce
   - WPGraphQL
   - JWT Authentication for WP REST API
3. Activate all plugins

#### Via WP-CLI:
```bash
wp plugin install woocommerce --activate
wp plugin install wp-graphql --activate
wp plugin install jwt-authentication-for-wp-rest-api --activate
```

---

## Phase 2: API Configuration

### 2.1 WooCommerce REST API Keys

#### Step-by-Step Guide:

1. Go to **WooCommerce → Settings → Advanced → REST API**
2. Click **"Add Key"** button
3. Fill in the form:
   - **Description**: `Next.js Storefront`
   - **User**: Select your admin user
   - **Permissions**: Select `Read/Write`
4. Click **"Generate API Key"**

5. **⚠️ CRITICAL: Save these keys immediately!** They are shown only once:
   ```
   Consumer Key:    ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Consumer Secret: cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### API Base URL:
```
https://your-wordpress-site.com/wp-json/wc/v3/
```

#### Available Endpoints:
| Endpoint | Description |
|----------|-------------|
| `/products` | List/create products |
| `/products/{id}` | Get/update/delete product |
| `/products/categories` | Product categories |
| `/products/tags` | Product tags |
| `/products/attributes` | Product attributes (size, color) |
| `/orders` | List/create orders |
| `/orders/{id}` | Get/update order |
| `/customers` | Customer accounts |
| `/coupons` | Discount coupons |

### 2.2 WPGraphQL Configuration

1. Go to **GraphQL → Settings**
2. Verify settings:
   - **GraphQL Endpoint**: `/graphql` (default)
   - **Enable GraphiQL IDE**: ✅ (for testing)
   - **Debug Mode**: ✅ (for development)

#### GraphQL Endpoint:
```
https://your-wordpress-site.com/graphql
```

#### Test Query (in GraphiQL):
```graphql
{
  pages {
    nodes {
      title
      slug
    }
  }
  menus {
    nodes {
      name
      menuItems {
        nodes {
          label
          url
        }
      }
    }
  }
}
```

### 2.3 JWT Authentication Setup

#### Step 1: Edit wp-config.php

Add these lines **BEFORE** the line `/* That's all, stop editing! */`:

```php
/**
 * JWT Authentication Configuration
 *
 * Generate a unique secret key at:
 * https://api.wordpress.org/secret-key/1.1/salt/
 */
define('JWT_AUTH_SECRET_KEY', 'your-unique-secret-key-here-make-it-long-and-random');

/**
 * Enable CORS for JWT Authentication
 */
define('JWT_AUTH_CORS_ENABLE', true);
```

#### Step 2: Configure .htaccess (for Apache servers)

Add this to your WordPress `.htaccess` file (before WordPress rules):

```apache
# BEGIN JWT Authentication
RewriteEngine On
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
# END JWT Authentication
```

#### Step 3: For Nginx servers, add to your server block:

```nginx
# Pass Authorization header to PHP
location ~ \.php$ {
    # ... existing PHP configuration ...
    fastcgi_param HTTP_AUTHORIZATION $http_authorization;
}
```

#### JWT Endpoints:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp-json/jwt-auth/v1/token` | POST | Get JWT token (login) |
| `/wp-json/jwt-auth/v1/token/validate` | POST | Validate token |

### 2.4 CORS Configuration

Add this to your theme's `functions.php` or create a custom plugin:

```php
<?php
/**
 * CORS Headers for Headless Frontend
 * Add to functions.php or a custom plugin
 */

// Define allowed origins
function get_allowed_origins() {
    return [
        'http://localhost:3000',           // Local development
        'https://your-production-site.com', // Production frontend
    ];
}

// Add CORS headers for REST API
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');

    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed_origins = get_allowed_origins();

        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        }

        return $value;
    });
}, 15);

// Add CORS headers for GraphQL
add_action('init_graphql_request', function() {
    $origin = get_http_origin();
    $allowed_origins = get_allowed_origins();

    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
    }
});

// Handle preflight OPTIONS requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = get_http_origin();
        $allowed_origins = get_allowed_origins();

        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            header('Access-Control-Max-Age: 86400');
            status_header(200);
            exit();
        }
    }
});
```

---

## Phase 3: Next.js Project Setup

### 3.1 Create Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

Select these options:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **Yes**
- App Router: **Yes**
- Import alias: **@/***

### 3.2 Install Dependencies

```bash
# State Management
npm install zustand

# Form handling & validation
npm install react-hook-form zod @hookform/resolvers

# Animation (Zara-like smooth transitions)
npm install framer-motion

# Image optimization
npm install sharp

# Utilities
npm install clsx tailwind-merge

# Date formatting (for orders)
npm install date-fns
```

### 3.3 Environment Variables

Create `.env.local` in your project root:

```env
# =================================
# WordPress Configuration
# =================================

# Your WordPress site URL (no trailing slash)
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com

# GraphQL endpoint for content
NEXT_PUBLIC_GRAPHQL_URL=https://your-wordpress-site.com/graphql

# =================================
# WooCommerce REST API
# =================================

# Consumer Key (starts with ck_)
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Consumer Secret (starts with cs_) - KEEP SECRET, server-side only!
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =================================
# JWT Authentication
# =================================

# Must match JWT_AUTH_SECRET_KEY in wp-config.php
JWT_SECRET=your-unique-secret-key-here

# =================================
# Frontend URLs
# =================================

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ Security Note**:
- `WC_CONSUMER_SECRET` and `JWT_SECRET` should NEVER have `NEXT_PUBLIC_` prefix
- They are only used server-side in API routes

---

## Phase 4: Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Global styles
│   │
│   ├── shop/
│   │   ├── page.tsx                  # Shop listing page
│   │   └── [category]/
│   │       └── page.tsx              # Category page
│   │
│   ├── product/
│   │   └── [slug]/
│   │       └── page.tsx              # Product detail page
│   │
│   ├── cart/
│   │   └── page.tsx                  # Cart page
│   │
│   ├── checkout/
│   │   └── page.tsx                  # Checkout page
│   │
│   ├── account/
│   │   ├── page.tsx                  # Account dashboard
│   │   ├── orders/
│   │   │   └── page.tsx              # Order history
│   │   └── login/
│   │       └── page.tsx              # Login page
│   │
│   └── api/                          # API Routes (server-side)
│       ├── products/
│       │   └── route.ts              # Proxy to WooCommerce
│       ├── orders/
│       │   └── route.ts              # Create orders
│       └── auth/
│           └── route.ts              # JWT authentication
│
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── navigation.tsx
│   │   └── mobile-menu.tsx
│   │
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-gallery.tsx
│   │   ├── product-info.tsx
│   │   ├── size-selector.tsx
│   │   └── color-selector.tsx
│   │
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   └── cart-drawer.tsx           # Slide-out mini cart
│   │
│   ├── checkout/
│   │   ├── checkout-form.tsx
│   │   ├── address-form.tsx
│   │   └── order-summary.tsx
│   │
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── modal.tsx
│       └── skeleton.tsx
│
├── lib/
│   ├── woocommerce.ts                # WooCommerce API client
│   ├── graphql.ts                    # GraphQL client for content
│   ├── auth.ts                       # Authentication helpers
│   └── utils.ts                      # Utility functions (cn, formatPrice)
│
├── stores/
│   ├── cart-store.ts                 # Zustand cart store
│   ├── auth-store.ts                 # Auth state
│   └── ui-store.ts                   # UI state (modals, drawers)
│
├── hooks/
│   ├── use-products.ts               # Product fetching hooks
│   ├── use-cart.ts                   # Cart operations
│   └── use-auth.ts                   # Authentication hooks
│
└── types/
    ├── product.ts                    # Product types
    ├── cart.ts                       # Cart types
    ├── order.ts                      # Order types
    └── woocommerce.ts                # WooCommerce API types
```

---

## Phase 5: Key Implementation Code

### 5.1 WooCommerce API Client (Server-Side)

```typescript
// src/lib/woocommerce.ts

const WC_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

interface WooCommerceRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function wooCommerceAPI<T>(
  endpoint: string,
  options: WooCommerceRequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  const url = new URL(`${WC_URL}/wp-json/wc/v3${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  // Create Basic Auth header
  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `WooCommerce API Error: ${response.status}`);
  }

  return response.json();
}

// Product endpoints
export const products = {
  list: (params?: Record<string, string | number>) =>
    wooCommerceAPI<WCProduct[]>('/products', { params, next: { revalidate: 60 } }),

  get: (idOrSlug: number | string) =>
    wooCommerceAPI<WCProduct>(`/products/${idOrSlug}`, { next: { revalidate: 60 } }),

  getBySlug: async (slug: string) => {
    const products = await wooCommerceAPI<WCProduct[]>('/products', {
      params: { slug },
      next: { revalidate: 60 }
    });
    return products[0] || null;
  },

  getVariations: (productId: number) =>
    wooCommerceAPI<WCProductVariation[]>(`/products/${productId}/variations`, {
      params: { per_page: 100 },
      next: { revalidate: 60 }
    }),
};

// Category endpoints
export const categories = {
  list: (params?: Record<string, string | number>) =>
    wooCommerceAPI<WCCategory[]>('/products/categories', {
      params: { ...params, hide_empty: true },
      next: { revalidate: 300 }
    }),

  get: (id: number) =>
    wooCommerceAPI<WCCategory>(`/products/categories/${id}`),
};

// Order endpoints
export const orders = {
  create: (data: CreateOrderData) =>
    wooCommerceAPI<WCOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: number) =>
    wooCommerceAPI<WCOrder>(`/orders/${id}`),

  list: (customerId: number) =>
    wooCommerceAPI<WCOrder[]>('/orders', {
      params: { customer: customerId },
    }),
};

// Customer endpoints
export const customers = {
  create: (data: CreateCustomerData) =>
    wooCommerceAPI<WCCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: number) =>
    wooCommerceAPI<WCCustomer>(`/customers/${id}`),

  update: (id: number, data: Partial<WCCustomer>) =>
    wooCommerceAPI<WCCustomer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const wooCommerce = { products, categories, orders, customers };
```

### 5.2 TypeScript Types

```typescript
// src/types/woocommerce.ts

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'publish' | 'draft' | 'pending' | 'private';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
  images: WCImage[];
  categories: WCCategory[];
  tags: WCTag[];
  attributes: WCAttribute[];
  variations: number[];
  related_ids: number[];
}

export interface WCProductVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  image: WCImage;
  attributes: WCVariationAttribute[];
}

export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  image: WCImage | null;
  count: number;
}

export interface WCTag {
  id: number;
  name: string;
  slug: string;
}

export interface WCAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WCVariationAttribute {
  id: number;
  name: string;
  option: string;
}

export interface WCOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  shipping_total: string;
  discount_total: string;
  customer_id: number;
  billing: WCAddress;
  shipping: WCAddress;
  line_items: WCLineItem[];
  date_created: string;
  payment_method: string;
  payment_method_title: string;
}

export interface WCLineItem {
  id: number;
  product_id: number;
  variation_id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: string;
  total: string;
  sku: string;
  image: WCImage;
}

export interface WCAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: WCAddress;
  shipping: WCAddress;
}

export interface CreateOrderData {
  payment_method: string;
  payment_method_title: string;
  set_paid?: boolean;
  billing: WCAddress;
  shipping: WCAddress;
  line_items: Array<{
    product_id: number;
    variation_id?: number;
    quantity: number;
  }>;
  customer_id?: number;
}

export interface CreateCustomerData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  billing?: Partial<WCAddress>;
  shipping?: Partial<WCAddress>;
}
```

### 5.3 Cart Store (Client-Side with Zustand)

```typescript
// src/stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;                    // Unique cart item ID
  productId: number;
  variationId?: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  attributes?: Record<string, string>;  // e.g., { Size: 'M', Color: 'Black' }
  maxQuantity?: number;          // Stock limit
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

interface CartGetters {
  getTotal: () => number;
  getItemCount: () => number;
  getItem: (productId: number, variationId?: number) => CartItem | undefined;
}

type CartStore = CartState & CartActions & CartGetters;

// Generate unique ID for cart items
const generateCartItemId = (productId: number, variationId?: number, attributes?: Record<string, string>) => {
  const base = variationId ? `${productId}-${variationId}` : `${productId}`;
  if (attributes) {
    const attrString = Object.entries(attributes).sort().map(([k, v]) => `${k}:${v}`).join('-');
    return `${base}-${attrString}`;
  }
  return base;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      isOpen: false,

      // Actions
      addItem: (item) => {
        const id = generateCartItemId(item.productId, item.variationId, item.attributes);

        set((state) => {
          const existingItem = state.items.find((i) => i.id === id);

          if (existingItem) {
            // Update quantity if item exists
            const newQuantity = existingItem.quantity + item.quantity;
            const maxQty = existingItem.maxQuantity;

            return {
              items: state.items.map((i) =>
                i.id === id
                  ? { ...i, quantity: maxQty ? Math.min(newQuantity, maxQty) : newQuantity }
                  : i
              ),
              isOpen: true, // Open cart drawer when adding
            };
          }

          // Add new item
          return {
            items: [...state.items, { ...item, id }],
            isOpen: true,
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }

          return {
            items: state.items.map((i) => {
              if (i.id !== id) return i;
              const maxQty = i.maxQuantity;
              return { ...i, quantity: maxQty ? Math.min(quantity, maxQty) : quantity };
            }),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Getters
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getItem: (productId, variationId) => {
        return get().items.find(
          (i) => i.productId === productId && i.variationId === variationId
        );
      },
    }),
    {
      name: 'cart-storage',
      version: 1,
    }
  )
);
```

### 5.4 API Routes (Next.js Server-Side)

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: Record<string, string | number> = {
    per_page: Number(searchParams.get('per_page')) || 12,
    page: Number(searchParams.get('page')) || 1,
  };

  // Add optional filters
  const category = searchParams.get('category');
  if (category) params.category = category;

  const search = searchParams.get('search');
  if (search) params.search = search;

  const orderby = searchParams.get('orderby');
  if (orderby) params.orderby = orderby;

  const order = searchParams.get('order');
  if (order) params.order = order;

  try {
    const products = await wooCommerce.products.list(params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Validate required fields
    if (!orderData.billing || !orderData.line_items?.length) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }

    const order = await wooCommerce.orders.create(orderData);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

### 5.5 GraphQL Client for Content

```typescript
// src/lib/graphql.ts

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL!;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { revalidate?: number }
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: options?.revalidate ?? 60 },
  });

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

// Example queries
export const getMenus = () => graphqlFetch<{ menus: { nodes: Menu[] } }>(`
  query GetMenus {
    menus {
      nodes {
        id
        name
        slug
        menuItems {
          nodes {
            id
            label
            url
            parentId
          }
        }
      }
    }
  }
`, undefined, { revalidate: 300 });

export const getPages = () => graphqlFetch<{ pages: { nodes: Page[] } }>(`
  query GetPages {
    pages {
      nodes {
        id
        title
        slug
        content
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`);

interface Menu {
  id: string;
  name: string;
  slug: string;
  menuItems: {
    nodes: MenuItem[];
  };
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
  parentId: string | null;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  } | null;
}
```

### 5.6 Utility Functions

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price
export function formatPrice(
  price: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(numericPrice);
}

// Strip HTML tags
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Generate product URL
export function getProductUrl(slug: string): string {
  return `/product/${slug}`;
}

// Generate category URL
export function getCategoryUrl(slug: string): string {
  return `/shop/${slug}`;
}
```

---

## Phase 6: Implementation Roadmap

### Sprint 1: Foundation
- [ ] Initialize Next.js project with TypeScript & Tailwind
- [ ] Set up environment variables
- [ ] Create WooCommerce API client
- [ ] Create GraphQL client for content
- [ ] Basic layout (Header, Footer)
- [ ] Configure next.config.js for WordPress images

### Sprint 2: Product Display
- [ ] Product listing page with grid
- [ ] Category navigation
- [ ] Product detail page
- [ ] Image gallery component
- [ ] Size/Color selectors
- [ ] Loading skeletons

### Sprint 3: Cart Functionality
- [ ] Zustand cart store
- [ ] Add to cart from product page
- [ ] Cart drawer (slide-out)
- [ ] Cart page
- [ ] Update quantities
- [ ] Remove items

### Sprint 4: User Authentication
- [ ] JWT authentication helpers
- [ ] Login page
- [ ] Register page
- [ ] Account dashboard
- [ ] Protected routes middleware
- [ ] Order history

### Sprint 5: Checkout
- [ ] Checkout page layout
- [ ] Address form
- [ ] Order summary
- [ ] Order creation API
- [ ] Order confirmation page
- [ ] Guest checkout option

### Sprint 6: Polish
- [ ] SEO meta tags
- [ ] Zara-like animations (Framer Motion)
- [ ] Mobile responsive design
- [ ] Image optimization
- [ ] Error handling
- [ ] Loading states

---

## Phase 7: Testing Your Setup

### Test WooCommerce REST API:

```bash
# Get products
curl -X GET "https://your-site.com/wp-json/wc/v3/products" \
  -u "ck_xxx:cs_xxx"

# Get single product
curl -X GET "https://your-site.com/wp-json/wc/v3/products/123" \
  -u "ck_xxx:cs_xxx"

# Get categories
curl -X GET "https://your-site.com/wp-json/wc/v3/products/categories" \
  -u "ck_xxx:cs_xxx"
```

### Test GraphQL:

```bash
curl -X POST "https://your-site.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pages { nodes { title slug } } }"}'
```

### Test JWT Authentication:

```bash
# Get token
curl -X POST "https://your-site.com/wp-json/jwt-auth/v1/token" \
  -H "Content-Type: application/json" \
  -d '{"username": "your-user", "password": "your-pass"}'

# Validate token
curl -X POST "https://your-site.com/wp-json/jwt-auth/v1/token/validate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Quick Reference

### Environment Variables Checklist

| Variable | Where to Get | Example |
|----------|--------------|---------|
| `NEXT_PUBLIC_WORDPRESS_URL` | Your WP site URL | `https://shop.example.com` |
| `NEXT_PUBLIC_GRAPHQL_URL` | WP URL + /graphql | `https://shop.example.com/graphql` |
| `WC_CONSUMER_KEY` | WooCommerce → Settings → REST API | `ck_abc123...` |
| `WC_CONSUMER_SECRET` | WooCommerce → Settings → REST API | `cs_xyz789...` |
| `JWT_SECRET` | Must match wp-config.php | Long random string |

### WordPress Configuration Checklist

- [ ] WooCommerce installed & activated
- [ ] WPGraphQL installed & activated
- [ ] JWT Auth plugin installed & activated
- [ ] WooCommerce REST API keys generated
- [ ] JWT_AUTH_SECRET_KEY added to wp-config.php
- [ ] .htaccess updated for Authorization header
- [ ] CORS configured in functions.php
- [ ] Products added to WooCommerce

---

## Next Steps

1. ✅ Configure WordPress (plugins, API keys, JWT)
2. Initialize Next.js project
3. Start implementing Sprint 1

Ready to begin implementation?
