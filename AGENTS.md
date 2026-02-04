# AGENTS.md - AI Assistant Guidelines

This document provides detailed instructions for AI assistants working on this headless WordPress e-commerce frontend.

## Project Context

This is a **production-ready headless e-commerce storefront** that:
- Fetches content from WordPress via GraphQL (WPGraphQL plugin)
- Manages products/orders via WooCommerce REST API v3
- Uses JWT for customer authentication
- Persists cart and auth state to localStorage

## Before Making Changes

### 1. Understand the Architecture
- **Server Components** render on the server (default in App Router)
- **Client Components** require `'use client'` directive
- API routes in `src/app/api/` handle sensitive operations
- State lives in Zustand stores, not React context

### 2. Check Existing Patterns
Before creating new code, check these files for existing patterns:
- `src/lib/utils.ts` - Utility functions (don't duplicate)
- `src/types/woocommerce.ts` - Type definitions (extend, don't recreate)
- `src/components/ui/` - Reusable UI components

### 3. Verify Dependencies
All necessary packages are installed. Avoid adding new dependencies unless absolutely necessary. Current stack handles:
- Forms: React Hook Form + Zod
- Animation: Framer Motion
- Styling: Tailwind CSS
- State: Zustand
- Dates: date-fns

## Code Standards

### TypeScript
```typescript
// ✅ Good: Explicit types, use existing types
import { WCProduct } from '@/types/woocommerce'
const product: WCProduct = await productsApi.get(id)

// ❌ Bad: Using 'any' or inline object types
const product: any = await fetch(...)
```

### Component Structure
```typescript
// Client component example
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  className?: string
}

export function MyComponent({ title, className }: Props) {
  const [state, setState] = useState(false)

  return (
    <div className={cn('base-styles', className)}>
      <h2>{title}</h2>
      <Button onClick={() => setState(!state)}>Toggle</Button>
    </div>
  )
}
```

### Server Component with Data Fetching
```typescript
// Server component example (no 'use client')
import { productsApi } from '@/lib/woocommerce'
import { ProductGrid } from '@/components/product/product-grid'

export default async function ShopPage() {
  const products = await productsApi.list({ per_page: 12 })

  return (
    <main className="container py-8">
      <ProductGrid products={products} />
    </main>
  )
}
```

### Zustand Store Usage
```typescript
// ✅ Good: Use selector hooks to prevent re-renders
import { useCartItems, useCartTotal } from '@/stores/cart-store'

function CartSummary() {
  const items = useCartItems()
  const total = useCartTotal()
  // Component only re-renders when items or total change
}

// ❌ Bad: Selecting entire store
import { useCartStore } from '@/stores/cart-store'

function CartSummary() {
  const store = useCartStore() // Re-renders on ANY store change
}
```

### Form Handling
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

## API Integration Guidelines

### GraphQL Queries
```typescript
import { graphqlFetch } from '@/lib/graphql'

// Define query with variables
const query = `
  query GetProduct($slug: String!) {
    product(id: $slug, idType: SLUG) {
      id
      name
      description
    }
  }
`

// Execute with caching
const data = await graphqlFetch(query, { slug }, {
  next: { revalidate: 60 } // Cache for 60 seconds
})
```

### WooCommerce REST API
```typescript
import { productsApi, ordersApi } from '@/lib/woocommerce'

// List products with filters
const products = await productsApi.list({
  category: '5',
  per_page: 20,
  orderby: 'date',
  order: 'desc',
})

// Get single product with variations
const product = await productsApi.getBySlug('product-slug')
const variations = await productsApi.getVariations(product.id)

// Create order (server-side only)
const order = await ordersApi.create({
  payment_method: 'cod',
  billing: { /* address */ },
  line_items: [{ product_id: 123, quantity: 2 }],
})
```

### Error Handling Pattern
```typescript
import { WooCommerceError } from '@/lib/woocommerce'

try {
  const product = await productsApi.get(id)
} catch (error) {
  if (error instanceof WooCommerceError) {
    if (error.status === 404) {
      notFound() // Next.js not found page
    }
    console.error(`WC Error ${error.status}: ${error.message}`)
  }
  throw error
}
```

## Styling Guidelines

### Tailwind CSS Patterns
```typescript
// Use cn() for conditional classes
import { cn } from '@/lib/utils'

<button className={cn(
  'px-4 py-2 rounded font-medium',
  'bg-black text-white hover:bg-gray-800',
  isDisabled && 'opacity-50 cursor-not-allowed',
  className
)}>

// Responsive design (mobile-first)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Common spacing scale
// p-4 = 16px, p-6 = 24px, p-8 = 32px
// gap-4 = 16px, gap-6 = 24px
```

### Using UI Components
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// Button variants: primary, secondary, outline, ghost, link
// Button sizes: sm, md, lg, icon
<Button variant="outline" size="lg" loading={isLoading}>
  Submit
</Button>
```

## File Organization

When adding new features:

```
src/
├── app/
│   └── [feature]/
│       ├── page.tsx          # Main page component
│       ├── loading.tsx       # Loading state
│       └── error.tsx         # Error boundary
├── components/
│   └── [feature]/
│       ├── feature-list.tsx  # List component
│       └── feature-card.tsx  # Card component
├── lib/
│   └── [feature].ts          # API/utility functions (if needed)
└── types/
    └── [feature].ts          # Types (if many, otherwise add to existing)
```

## Common Tasks

### Adding a New Page
1. Create `src/app/[route]/page.tsx`
2. Add loading state: `src/app/[route]/loading.tsx`
3. Use server components for data fetching
4. Add client components only for interactivity

### Adding a New API Route
1. Create `src/app/api/[route]/route.ts`
2. Export async functions: `GET`, `POST`, `PUT`, `DELETE`
3. Use WooCommerce API client from `@/lib/woocommerce`
4. Handle errors with appropriate status codes

### Adding a New Component
1. Determine if server or client component
2. Check if similar component exists in `src/components/ui/`
3. Use TypeScript interfaces for props
4. Follow existing naming conventions

### Modifying Cart Logic
1. Edit `src/stores/cart-store.ts`
2. Add new actions to the store interface
3. Create selector hooks for new state slices
4. Cart persists to localStorage automatically

### Adding Product Features
1. Check `src/types/woocommerce.ts` for existing types
2. Update `src/lib/woocommerce.ts` for new API calls
3. Modify `src/components/product/` components
4. Test with variable and simple products

## Testing Checklist

Before submitting changes:

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Page loads correctly in browser
- [ ] Mobile responsive design works
- [ ] Cart functionality persists after refresh
- [ ] Error states handled gracefully
- [ ] Loading states show correctly

## Security Considerations

- **Never expose** `WC_CONSUMER_KEY` or `WC_CONSUMER_SECRET` to client
- **Always use API routes** for sensitive operations (orders, payments)
- **Validate user input** with Zod schemas
- **Sanitize HTML** from WordPress with `stripHtml()` or DOMPurify
- **Check authentication** in protected routes/API endpoints

## Performance Best Practices

1. **Images**: Always use Next.js `<Image>` component
2. **Data Fetching**: Use `revalidate` option for caching
3. **Client State**: Use Zustand selectors to minimize re-renders
4. **Bundle Size**: Avoid importing entire libraries
5. **Lazy Loading**: Use dynamic imports for heavy components

## Debugging Tips

### Check Store State
```typescript
// In browser console
localStorage.getItem('cart-storage')
localStorage.getItem('auth-storage')
```

### GraphQL Queries
Test queries at: `{WORDPRESS_URL}/graphql` (GraphiQL interface)

### WooCommerce API
Test endpoints at: `{WORDPRESS_URL}/wp-json/wc/v3/` (requires auth)

### Common Issues
- **CORS errors**: Ensure WordPress allows frontend origin
- **401 errors**: Check WooCommerce API credentials
- **Hydration errors**: Ensure server/client render same content
- **Cart not persisting**: Check localStorage in browser dev tools

## Quick Reference

| Task | File/Location |
|------|---------------|
| Add utility function | `src/lib/utils.ts` |
| Add WC type | `src/types/woocommerce.ts` |
| Modify cart behavior | `src/stores/cart-store.ts` |
| Add reusable component | `src/components/ui/` |
| Add product component | `src/components/product/` |
| Add API route | `src/app/api/[route]/route.ts` |
| Add page | `src/app/[route]/page.tsx` |
| Configure Next.js | `next.config.ts` |
| Add env variable | `.env.local` + update `.env.example` |
