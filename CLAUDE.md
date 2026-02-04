# CLAUDE.md - Project Overview

This file provides essential context for AI assistants working on this codebase.

## Project Summary

A **headless WordPress e-commerce frontend** built with Next.js 16, React 19, and Tailwind CSS v4. It connects to WordPress/WooCommerce via GraphQL and REST APIs to deliver a modern, fast shopping experience.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI Library | React 19.2.3 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand 5.0.11 |
| Forms | React Hook Form 7.71 + Zod 4.3 |
| Animation | Framer Motion 12.31 |
| Language | TypeScript 5 (strict mode) |

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (auth, orders, account)
│   ├── account/           # User account pages
│   ├── product/[slug]/    # Product detail pages
│   ├── shop/              # Product listing pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── layout/            # Header, Footer, Navigation
│   ├── product/           # ProductCard, ProductGrid, ProductGallery
│   ├── cart/              # CartDrawer
│   ├── home/              # HeroSlider
│   └── ui/                # Button, Input, Skeleton (reusable)
├── lib/
│   ├── graphql.ts         # GraphQL client for WordPress content
│   ├── woocommerce.ts     # WooCommerce REST API client
│   ├── auth.ts            # JWT authentication utilities
│   └── utils.ts           # Helper functions (cn, formatPrice, etc.)
├── stores/
│   ├── cart-store.ts      # Shopping cart state (persisted)
│   ├── auth-store.ts      # User authentication state
│   └── ui-store.ts        # UI state (modals, menus)
└── types/
    └── woocommerce.ts     # TypeScript types for WC API
```

## Key Patterns & Conventions

### Component Patterns
- **Server Components** (default): Pages and layouts for SSR
- **Client Components**: Mark with `'use client'` for interactivity
- Use **Suspense** with loading states for async operations
- Use `notFound()` for missing resources

### Naming Conventions
- Components: `PascalCase` (ProductCard.tsx)
- Utilities: `camelCase` (formatPrice, cn)
- Hooks: `useCamelCase` (useCartStore)
- Types: `PascalCase` (WCProduct, CartState)

### Styling
- Use Tailwind CSS utility classes
- Combine classes with `cn()` utility from `@/lib/utils`
- Fonts: Inter (body), Syne (headings)
- Color scheme: Minimal black/white/gray palette

### State Management
```typescript
// Zustand stores with selectors to prevent re-renders
import { useCartItems, useCartTotal } from '@/stores/cart-store'

// Use specific selectors instead of full store
const items = useCartItems()
const total = useCartTotal()
```

### API Integration

**GraphQL** (content queries):
```typescript
import { graphqlFetch, getPageBySlug } from '@/lib/graphql'
```

**WooCommerce REST** (e-commerce):
```typescript
import { productsApi, ordersApi, customersApi } from '@/lib/woocommerce'
```

**Authentication**:
```typescript
import { login, validateToken, getCurrentUser } from '@/lib/auth'
```

## Common Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_WORDPRESS_URL=https://your-wp-site.com
NEXT_PUBLIC_GRAPHQL_URL=https://your-wp-site.com/graphql
WC_CONSUMER_KEY=ck_xxxxx        # Server-side only
WC_CONSUMER_SECRET=cs_xxxxx    # Server-side only
JWT_SECRET=your-secret-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | Core utilities (cn, formatPrice, slugify) |
| `src/lib/woocommerce.ts` | WooCommerce API client |
| `src/lib/graphql.ts` | GraphQL query functions |
| `src/stores/cart-store.ts` | Cart state with localStorage persistence |
| `src/types/woocommerce.ts` | All WooCommerce TypeScript types |
| `src/components/providers.tsx` | Client-side provider setup |

## Type Definitions

Key types are in `src/types/woocommerce.ts`:
- `WCProduct`, `WCProductVariation` - Product data
- `WCCategory`, `WCTag` - Taxonomy
- `WCOrder`, `WCLineItem` - Order data
- `WCCustomer`, `WCAddress` - Customer data
- `ProductsQueryParams` - Query filter types

## Error Handling

Custom error classes:
- `GraphQLError` - GraphQL query failures
- `WooCommerceError` - WC API errors (includes status code)
- `AuthError` - Authentication failures

Always wrap API calls in try-catch and provide user-friendly messages.

## Performance Notes

- Images: Use Next.js `<Image>` with remote patterns configured
- Caching: GraphQL queries use revalidation (60-3600 seconds)
- Bundle: Standalone output for Docker deployment
- Client state: localStorage persistence for cart/auth

## Docker Deployment

```bash
docker build -t headless-wp .
docker run -p 3000:3000 --env-file .env headless-wp
```

Production builds use multi-stage Dockerfile optimized for Dokploy.
