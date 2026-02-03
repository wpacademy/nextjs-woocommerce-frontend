import { Suspense } from 'react';
import { wooCommerce } from '@/lib/woocommerce';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All',
  description: 'Browse our complete collection of fashion items.',
};

interface ShopPageProps {
  searchParams: Promise<{
    page?: string;
    orderby?: string;
    order?: string;
    featured?: string;
    on_sale?: string;
    search?: string;
  }>;
}

async function ProductList({ searchParams }: { searchParams: ShopPageProps['searchParams'] }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const perPage = 12;

  const products = await wooCommerce.products.list({
    page,
    per_page: perPage,
    orderby: params.orderby as 'date' | 'price' | 'popularity' | undefined,
    order: params.order as 'asc' | 'desc' | undefined,
    featured: params.featured === 'true' ? true : undefined,
    on_sale: params.on_sale === 'true' ? true : undefined,
    search: params.search,
  });

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <>
      <ProductGrid products={products} columns={4} />

      {/* Pagination placeholder */}
      {products.length === perPage && (
        <div className="mt-12 flex justify-center">
          <a
            href={`/shop?page=${page + 1}`}
            className="border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            Load More
          </a>
        </div>
      )}
    </>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categories = await wooCommerce.categories.list({ per_page: 20 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light">Shop All</h1>
        {params.search && (
          <p className="mt-2 text-gray-500">
            Search results for &quot;{params.search}&quot;
          </p>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider">Categories</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="/shop"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    All Products
                  </a>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <a
                      href={`/shop/${category.slug}`}
                      className="text-sm text-gray-600 hover:text-black"
                    >
                      {category.name} ({category.count})
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider">Sort By</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="/shop?orderby=date&order=desc"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Newest
                  </a>
                </li>
                <li>
                  <a
                    href="/shop?orderby=price&order=asc"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Price: Low to High
                  </a>
                </li>
                <li>
                  <a
                    href="/shop?orderby=price&order=desc"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Price: High to Low
                  </a>
                </li>
                <li>
                  <a
                    href="/shop?orderby=popularity"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Popularity
                  </a>
                </li>
              </ul>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider">Filter</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="/shop?on_sale=true"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    On Sale
                  </a>
                </li>
                <li>
                  <a
                    href="/shop?featured=true"
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Featured
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {/* Mobile Filters */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <button
              type="button"
              className="flex items-center gap-2 text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filters
            </button>
            <select
              className="border-none bg-transparent text-sm focus:ring-0"
              defaultValue=""
            >
              <option value="">Sort by</option>
              <option value="date-desc">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <ProductList searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
