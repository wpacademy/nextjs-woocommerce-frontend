import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { wooCommerce } from '@/lib/woocommerce';
import { ProductDetailSkeleton } from '@/components/ui/skeleton';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';
import { ProductGrid } from '@/components/product/product-grid';
import type { Metadata } from 'next';
import type { WCProductVariation } from '@/types/woocommerce';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await wooCommerce.products.getBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.name,
    description: product.short_description?.replace(/<[^>]*>/g, '') || product.description?.replace(/<[^>]*>/g, '').slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.short_description?.replace(/<[^>]*>/g, ''),
      images: product.images[0]?.src ? [{ url: product.images[0].src }] : [],
    },
  };
}

async function RelatedProducts({ product }: { product: Awaited<ReturnType<typeof wooCommerce.products.getBySlug>> }) {
  if (!product || !product.related_ids?.length) return null;

  const relatedProducts = await wooCommerce.products.getRelated(product, 4);

  if (relatedProducts.length === 0) return null;

  return (
    <section className="mt-16 border-t pt-16">
      <h2 className="mb-8 text-2xl font-light">You May Also Like</h2>
      <ProductGrid products={relatedProducts} columns={4} />
    </section>
  );
}

async function ProductDetail({ slug }: { slug: string }) {
  const product = await wooCommerce.products.getBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch variations if variable product
  let variations: WCProductVariation[] = [];
  if (product.type === 'variable' && product.variations.length > 0) {
    variations = await wooCommerce.products.getVariations(product.id);
  }

  return (
    <>
      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Product Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Product Info */}
        <ProductInfo product={product} variations={variations} />
      </div>

      {/* Related Products */}
      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>
    </>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail slug={slug} />
      </Suspense>
    </div>
  );
}
