'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  image: string | null;
  stock_status: string;
}

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Search({ isOpen, onClose }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search with useEffect
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(data.products || []);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle form submit - go to shop page with search query
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  // Handle clicking a result
  const handleResultClick = () => {
    onClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-gray-200 overflow-hidden bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search products..."
                className="w-full border-b border-gray-300 bg-transparent py-2 pr-10 text-sm focus:border-black focus:outline-none"
                autoComplete="off"
              />

              {/* Search icon or loading spinner */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <svg
                    className="h-5 w-5 animate-spin text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {(results.length > 0 || (hasSearched && query.length >= 2)) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="mt-4 max-h-96 overflow-y-auto"
                >
                  {results.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-3">
                        {results.length} product{results.length !== 1 ? 's' : ''} found
                      </p>
                      <div className="space-y-2">
                        {results.map((product) => (
                          <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {/* Product Image */}
                            <div className="relative h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <svg
                                    className="h-6 w-6 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {product.on_sale && product.sale_price ? (
                                  <>
                                    <span className="text-sm font-medium text-red-600">
                                      {formatPrice(product.sale_price)}
                                    </span>
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatPrice(product.regular_price)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                              </div>
                              {product.stock_status === 'outofstock' && (
                                <span className="text-xs text-red-500 mt-1">
                                  Out of stock
                                </span>
                              )}
                            </div>

                            {/* Arrow */}
                            <svg
                              className="h-4 w-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </Link>
                        ))}
                      </div>

                      {/* View All Results Link */}
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="mt-4 w-full py-2 text-center text-sm font-medium text-black hover:underline"
                      >
                        View all results for &quot;{query}&quot;
                      </button>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        No products found for &quot;{query}&quot;
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Try a different search term
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
