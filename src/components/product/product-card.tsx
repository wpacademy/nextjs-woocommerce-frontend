'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { WCProduct } from '@/types/woocommerce';
import { formatPrice, calculateDiscount, getProductUrl } from '@/lib/utils';

interface ProductCardProps {
  product: WCProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const mainImage = product.images[0];
  const hoverImage = product.images[1];
  const hasDiscount = product.on_sale && product.regular_price && product.sale_price;
  const discountPercent = hasDiscount
    ? calculateDiscount(product.regular_price, product.sale_price)
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link href={getProductUrl(product.slug)} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {mainImage ? (
            <>
              <Image
                src={mainImage.src}
                alt={mainImage.alt || product.name}
                fill
                className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                priority={priority}
              />
              {hoverImage && (
                <Image
                  src={hoverImage.src}
                  alt={hoverImage.alt || product.name}
                  fill
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.on_sale && (
              <span className="bg-black px-2 py-1 text-xs font-medium text-white">
                -{discountPercent}%
              </span>
            )}
            {product.featured && (
              <span className="bg-white px-2 py-1 text-xs font-medium text-black">
                New
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {product.stock_status === 'outofstock' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <span className="text-sm font-medium text-gray-600">Out of Stock</span>
            </div>
          )}

          {/* Quick Add Button - Hidden on mobile */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden md:block">
            <button
              type="button"
              className="w-full bg-black py-3 text-sm font-medium text-white hover:bg-gray-800"
              onClick={(e) => {
                e.preventDefault();
                // Navigate to product page for variant selection
                window.location.href = getProductUrl(product.slug);
              }}
            >
              {product.type === 'variable' ? 'Select Options' : 'Quick Add'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-1">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
            {product.name}
          </h3>

          {/* Categories */}
          {product.categories.length > 0 && (
            <p className="text-xs text-gray-500">
              {product.categories[0].name}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            {product.on_sale ? (
              <>
                <span className="text-sm font-medium text-red-600">
                  {formatPrice(product.sale_price)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.regular_price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Color Options Preview */}
          {product.type === 'variable' && product.attributes.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              {product.attributes
                .find((attr) => attr.name.toLowerCase() === 'color')
                ?.options.slice(0, 4)
                .map((color) => (
                  <span
                    key={color}
                    className="h-3 w-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              {(product.attributes.find((attr) => attr.name.toLowerCase() === 'color')?.options.length || 0) > 4 && (
                <span className="text-xs text-gray-500">
                  +{(product.attributes.find((attr) => attr.name.toLowerCase() === 'color')?.options.length || 0) - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
