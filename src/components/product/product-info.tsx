'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { WCProduct, WCProductVariation } from '@/types/woocommerce';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice, getStockStatusLabel, getStockStatusColor, stripHtml } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductInfoProps {
  product: WCProduct;
  variations: WCProductVariation[];
}

export function ProductInfo({ product, variations }: ProductInfoProps) {
  const { addItem } = useCartStore();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const isVariable = product.type === 'variable';

  // Find matching variation based on selected attributes
  const selectedVariation = useMemo(() => {
    if (!isVariable || variations.length === 0) return null;

    return variations.find((variation) =>
      variation.attributes.every((attr) => {
        const selectedValue = selectedAttributes[attr.name];
        // Empty option means "any"
        return !attr.option || attr.option === selectedValue;
      })
    );
  }, [isVariable, variations, selectedAttributes]);

  // Get current price (from variation or product)
  const currentPrice = selectedVariation?.price || product.price;
  const currentRegularPrice = selectedVariation?.regular_price || product.regular_price;
  const currentSalePrice = selectedVariation?.sale_price || product.sale_price;
  const isOnSale = selectedVariation?.on_sale ?? product.on_sale;
  const stockStatus = selectedVariation?.stock_status || product.stock_status;
  const stockQuantity = selectedVariation?.stock_quantity ?? product.stock_quantity;

  // Check if all required attributes are selected
  const allAttributesSelected = useMemo(() => {
    if (!isVariable) return true;
    return product.attributes
      .filter((attr) => attr.variation)
      .every((attr) => selectedAttributes[attr.name]);
  }, [isVariable, product.attributes, selectedAttributes]);

  const canAddToCart = stockStatus === 'instock' && allAttributesSelected;

  const handleAddToCart = async () => {
    if (!canAddToCart) return;

    setIsAdding(true);

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    addItem({
      productId: product.id,
      variationId: selectedVariation?.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(currentPrice),
      regularPrice: currentRegularPrice ? parseFloat(currentRegularPrice) : undefined,
      quantity,
      image: selectedVariation?.image?.src || product.images[0]?.src || '',
      attributes: isVariable ? selectedAttributes : undefined,
      maxQuantity: stockQuantity || undefined,
    });

    setIsAdding(false);
  };

  return (
    <div className="lg:sticky lg:top-24">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/shop" className="hover:text-black">Shop</Link>
        {product.categories[0] && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/shop/${product.categories[0].slug}`} className="hover:text-black">
              {product.categories[0].name}
            </Link>
          </>
        )}
      </nav>

      {/* Product Name */}
      <h1 className="text-2xl font-medium lg:text-3xl">{product.name}</h1>

      {/* Price */}
      <div className="mt-4 flex items-center gap-3">
        {isOnSale && currentSalePrice ? (
          <>
            <span className="text-xl font-medium text-red-600">
              {formatPrice(currentSalePrice)}
            </span>
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(currentRegularPrice)}
            </span>
          </>
        ) : (
          <span className="text-xl font-medium">
            {currentPrice ? formatPrice(currentPrice) : 'Price unavailable'}
          </span>
        )}
      </div>

      {/* Stock Status */}
      <p className={cn('mt-2 text-sm', getStockStatusColor(stockStatus))}>
        {getStockStatusLabel(stockStatus)}
        {stockQuantity && stockQuantity <= 5 && stockStatus === 'instock' && (
          <span className="ml-1">- Only {stockQuantity} left</span>
        )}
      </p>

      {/* Short Description */}
      {product.short_description && (
        <div
          className="mt-4 text-sm text-gray-600"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />
      )}

      {/* Variant Selectors */}
      {isVariable && product.attributes.filter((attr) => attr.variation).length > 0 && (
        <div className="mt-6 space-y-4">
          {product.attributes
            .filter((attr) => attr.variation)
            .map((attribute) => (
              <div key={attribute.id}>
                <label className="mb-2 block text-sm font-medium">
                  {attribute.name}
                  {selectedAttributes[attribute.name] && (
                    <span className="ml-2 font-normal text-gray-500">
                      : {selectedAttributes[attribute.name]}
                    </span>
                  )}
                </label>

                <div className="flex flex-wrap gap-2">
                  {attribute.options.map((option) => {
                    const isSelected = selectedAttributes[attribute.name] === option;
                    const isColor = attribute.name.toLowerCase() === 'color';

                    // Check if this option is available in any variation
                    const isAvailable = variations.some((v) => {
                      const attrMatch = v.attributes.find((a) => a.name === attribute.name);
                      return (!attrMatch?.option || attrMatch.option === option) && v.stock_status === 'instock';
                    });

                    if (isColor) {
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setSelectedAttributes((prev) => ({ ...prev, [attribute.name]: option }))
                          }
                          disabled={!isAvailable}
                          className={cn(
                            'h-8 w-8 rounded-full border-2 transition-all',
                            isSelected ? 'border-black ring-2 ring-black ring-offset-2' : 'border-gray-300',
                            !isAvailable && 'opacity-30 cursor-not-allowed'
                          )}
                          style={{ backgroundColor: option.toLowerCase() }}
                          title={option}
                          aria-label={option}
                        />
                      );
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setSelectedAttributes((prev) => ({ ...prev, [attribute.name]: option }))
                        }
                        disabled={!isAvailable}
                        className={cn(
                          'min-w-[3rem] border px-4 py-2 text-sm transition-colors',
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-black',
                          !isAvailable && 'opacity-30 cursor-not-allowed line-through'
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium">Quantity</label>
        <div className="flex items-center border border-gray-300 w-fit">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-3 hover:bg-gray-100"
            aria-label="Decrease quantity"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
          <span className="w-12 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => (stockQuantity ? Math.min(stockQuantity, q + 1) : q + 1))}
            disabled={stockQuantity ? quantity >= stockQuantity : false}
            className="px-4 py-3 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="mt-6 space-y-3">
        <Button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          isLoading={isAdding}
          className="w-full"
          size="lg"
        >
          {stockStatus === 'outofstock'
            ? 'Out of Stock'
            : !allAttributesSelected
            ? 'Select Options'
            : 'Add to Bag'}
        </Button>

        {/* Wishlist Button */}
        <Button variant="outline" className="w-full" size="lg">
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          Add to Wishlist
        </Button>
      </div>

      {/* Product Details Accordion */}
      <div className="mt-8 border-t pt-8">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-medium">
            Description
            <svg
              className="h-5 w-5 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div
            className="pb-4 text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
          />
        </details>

        {product.sku && (
          <details className="group border-t">
            <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-medium">
              Details
              <svg
                className="h-5 w-5 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="pb-4 text-sm text-gray-600">
              <p>SKU: {product.sku}</p>
              {product.weight && <p>Weight: {product.weight}</p>}
              {product.dimensions.length && (
                <p>
                  Dimensions: {product.dimensions.length} x {product.dimensions.width} x{' '}
                  {product.dimensions.height}
                </p>
              )}
            </div>
          </details>
        )}

        <details className="group border-t">
          <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-medium">
            Shipping & Returns
            <svg
              className="h-5 w-5 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="pb-4 text-sm text-gray-600">
            <p>Free shipping on orders over $100.</p>
            <p className="mt-2">Free returns within 30 days.</p>
          </div>
        </details>
      </div>
    </div>
  );
}
