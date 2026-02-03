import { notFound } from 'next/navigation';
import { getPageBySlug, getPages } from '@/lib/graphql';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all pages
export async function generateStaticParams() {
  try {
    const pages = await getPages();
    return pages.map((page) => ({
      slug: page.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  // Extract description from content (first paragraph)
  const description = page.content?.replace(/<[^>]*>/g, '').slice(0, 160) || undefined;

  return {
    title: page.title,
    description,
    openGraph: {
      title: page.title,
      description,
      images: page.featuredImage?.node?.sourceUrl
        ? [{ url: page.featuredImage.node.sourceUrl }]
        : [],
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  // Skip reserved routes
  const reservedSlugs = ['shop', 'product', 'cart', 'checkout', 'account', 'api'];
  if (reservedSlugs.includes(slug)) {
    notFound();
  }

  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  // Determine page type for specific styling
  const isLegalPage = ['privacy-policy', 'privacy', 'terms', 'terms-of-service', 'terms-and-conditions', 'cookie-policy', 'refund-and-returns-policy'].includes(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
      <article>
        <header className="mb-10 border-b border-gray-200 pb-8">
          <h1 className="text-3xl font-light tracking-tight lg:text-4xl">{page.title}</h1>
          {page.modified && (
            <p className="mt-3 text-sm text-gray-500">
              Last updated: {new Date(page.modified).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </header>

        <div
          className={`wp-content page-content ${isLegalPage ? 'legal-content' : ''}`}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}
