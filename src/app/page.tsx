import Link from 'next/link';
import Image from 'next/image';
import { wooCommerce } from '@/lib/woocommerce';
import { ProductGrid } from '@/components/product/product-grid';
import { HeroSlider } from '@/components/home/hero-slider';
import { Button } from '@/components/ui/button';
import type { WCCategory } from '@/types/woocommerce';

// Define which category slugs to show on homepage
const FEATURED_CATEGORY_SLUGS = ['women', 'men', 'accessories'];

export default async function HomePage() {
  // Fetch featured/new products and categories
  let featuredProducts: Awaited<ReturnType<typeof wooCommerce.products.list>> = [];
  let newProducts: Awaited<ReturnType<typeof wooCommerce.products.list>> = [];
  let categories: WCCategory[] = [];

  try {
    [featuredProducts, newProducts, categories] = await Promise.all([
      wooCommerce.products.list({ featured: true, per_page: 4 }),
      wooCommerce.products.list({ orderby: 'date', order: 'desc', per_page: 8 }),
      wooCommerce.categories.list({ per_page: 100, hide_empty: false }),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  // Filter and order categories based on FEATURED_CATEGORY_SLUGS
  const featuredCategories = FEATURED_CATEGORY_SLUGS
    .map(slug => categories.find(cat => cat.slug === slug))
    .filter((cat): cat is WCCategory => cat !== undefined);

  return (
    <div className="animate-fadeIn">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Categories Grid */}
      {featuredCategories.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/shop/${category.slug}`}
                  className={`group relative aspect-[3/4] overflow-hidden bg-gray-100 ${
                    index === featuredCategories.length - 1 && featuredCategories.length === 3
                      ? 'md:col-span-2 lg:col-span-1'
                      : ''
                  }`}
                >
                  {category.image?.src && (
                    <Image
                      src={category.image.src}
                      alt={category.image.alt || category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="font-heading text-2xl font-normal text-white">{category.name}</h3>
                    <span className="mt-2 inline-block text-sm text-white/80 group-hover:underline">
                      Shop now
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-medium">Featured</h2>
              <Link href="/shop?featured=true" className="text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-8">
              <ProductGrid products={featuredProducts} columns={4} />
            </div>
          </div>
        </section>
      )}

      {/* Banner */}
      <section className="bg-black py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
            Limited Time
          </p>
          <h2 className="mt-4 font-heading text-3xl font-medium md:text-4xl">
            Free Shipping on Orders Over $100
          </h2>
          <p className="mt-4 text-gray-400">
            Use code FREESHIP at checkout
          </p>
          <Link href="/shop">
            <Button variant="outline" className="mt-8 border-white text-white hover:bg-white hover:text-black">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-medium">New Arrivals</h2>
              <Link href="/shop?orderby=date" className="text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-8">
              <ProductGrid products={newProducts} columns={4} />
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
              <h3 className="mt-4 font-heading font-medium">Free Shipping</h3>
              <p className="mt-2 text-sm text-gray-500">
                On all orders over $100
              </p>
            </div>
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <h3 className="mt-4 font-heading font-medium">Easy Returns</h3>
              <p className="mt-2 text-sm text-gray-500">
                30-day return policy
              </p>
            </div>
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <h3 className="mt-4 font-heading font-medium">Secure Payment</h3>
              <p className="mt-2 text-sm text-gray-500">
                100% secure checkout
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
