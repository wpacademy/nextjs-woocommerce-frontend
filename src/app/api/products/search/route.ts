import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/lib/woocommerce';

// Force Node.js runtime (needed for Buffer in woocommerce.ts)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    const results = await products.list({
      search: query.trim(),
      per_page: 8,
      status: 'publish',
    });

    // Return simplified product data for search results
    const searchResults = results.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      on_sale: product.on_sale,
      image: product.images?.[0]?.src || null,
      stock_status: product.stock_status,
    }));

    return NextResponse.json({ products: searchResults });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
