import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { wooCommerce } from '@/lib/woocommerce';
import { ProductGrid } from '@/components/product/product-grid';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    page?: string;
    orderby?: string;
    order?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await wooCommerce.categories.getBySlug(categorySlug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: category.name,
    description: category.description || `Shop our ${category.name} collection.`,
  };
}

async function CategoryProducts({
  categoryId,
  searchParams,
}: {
  categoryId: number;
  searchParams: CategoryPageProps['searchParams'];
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const perPage = 12;

  const products = await wooCommerce.products.list({
    category: String(categoryId),
    page,
    per_page: perPage,
    orderby: params.orderby as 'date' | 'price' | 'popularity' | undefined,
    order: params.order as 'asc' | 'desc' | undefined,
  });

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No products found in this category.</p>
      </div>
    );
  }

  return (
    <>
      <ProductGrid products={products} columns={4} />

      {products.length === perPage && (
        <div className="mt-12 flex justify-center">
          <a
            href={`?page=${page + 1}`}
            className="border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            Load More
          </a>
        </div>
      )}
    </>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = await wooCommerce.categories.getBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const allCategories = await wooCommerce.categories.list({ per_page: 20 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4 text-sm text-gray-500">
          <a href="/shop" className="hover:text-black">Shop</a>
          <span className="mx-2">/</span>
          <span className="text-black">{category.name}</span>
        </nav>
        <h1 className="text-3xl font-light">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-gray-600" dangerouslySetInnerHTML={{ __html: category.description }} />
        )}
        <p className="mt-2 text-sm text-gray-500">{category.count} products</p>
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
                {allCategories.map((cat) => (
                  <li key={cat.id}>
                    <a
                      href={`/shop/${cat.slug}`}
                      className={`text-sm hover:text-black ${
                        cat.id === category.id ? 'font-medium text-black' : 'text-gray-600'
                      }`}
                    >
                      {cat.name} ({cat.count})
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
                  <a href="?orderby=date&order=desc" className="text-sm text-gray-600 hover:text-black">
                    Newest
                  </a>
                </li>
                <li>
                  <a href="?orderby=price&order=asc" className="text-sm text-gray-600 hover:text-black">
                    Price: Low to High
                  </a>
                </li>
                <li>
                  <a href="?orderby=price&order=desc" className="text-sm text-gray-600 hover:text-black">
                    Price: High to Low
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <CategoryProducts categoryId={category.id} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
