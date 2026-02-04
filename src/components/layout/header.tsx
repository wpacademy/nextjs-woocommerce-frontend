'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useCartItemCount } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { useIsAuthenticated, useUser } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { Search } from './search';

const navigation = [
  { name: 'New offers', href: '/shop/new-in' },
  { name: 'Products', href: '/shop' },
  { name: 'Men', href: '/shop/men' },
  { name: 'Women', href: '/shop/women' },
  { name: 'Children', href: '/shop/children' },
  { name: 'Brands', href: '/shop/brands' },
  { name: 'About', href: '/about' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart } = useCartStore();
  const itemCount = useCartItemCount();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Top Bar - Logo centered with hamburger and icons */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Left - Hamburger Menu */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            className="flex items-center"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>

          {/* Center - Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 font-heading text-2xl font-bold tracking-tight">
            MSR Lifestyle
          </Link>

          {/* Right - Search & Cart */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            {/* Divider */}
            <span className="hidden sm:block h-5 w-px bg-gray-300" />

            {/* Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative"
              aria-label="Open cart"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <nav className="hidden lg:block border-b border-gray-100 py-2">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex-1 text-center text-sm font-medium transition-colors hover:text-black',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-black font-semibold'
                    : 'text-gray-700'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Search Bar with AJAX */}
      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile/Sidebar Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={closeMobileMenu}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white shadow-xl"
            >
              <div className="flex h-16 items-center justify-between border-b px-6">
                <span className="font-heading text-lg font-bold">MSR Lifestyle</span>
                <button type="button" onClick={closeMobileMenu} aria-label="Close menu">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto h-[calc(100vh-4rem)]">
                {/* Navigation Links */}
                <nav className="px-6 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Menu</p>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'block py-3 text-base border-b border-gray-100',
                        pathname === item.href ? 'font-medium text-black' : 'text-gray-700'
                      )}
                      onClick={closeMobileMenu}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Account Section */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Account</p>
                  {mounted && isAuthenticated ? (
                    <>
                      <div className="py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="font-medium">{user?.displayName || user?.email}</p>
                      </div>
                      <Link href="/account" className="block py-3 text-gray-700 border-b border-gray-100" onClick={closeMobileMenu}>
                        My Account
                      </Link>
                      <Link href="/account/orders" className="block py-3 text-gray-700 border-b border-gray-100" onClick={closeMobileMenu}>
                        Orders
                      </Link>
                      <Link href="/account/addresses" className="block py-3 text-gray-700 border-b border-gray-100" onClick={closeMobileMenu}>
                        Addresses
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/account/login" className="block py-3 text-gray-700 border-b border-gray-100" onClick={closeMobileMenu}>
                        Sign In
                      </Link>
                      <Link href="/account/register" className="block py-3 text-gray-700 border-b border-gray-100" onClick={closeMobileMenu}>
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Account Dropdown (Desktop - triggered from nav or elsewhere) */}
      <AnimatePresence>
        {isAccountMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-4 top-16 w-48 bg-white border border-gray-200 shadow-lg z-50 lg:right-8"
          >
            {mounted && isAuthenticated ? (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium truncate">
                    {user?.displayName || user?.email}
                  </p>
                </div>
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  My Account
                </Link>
                <Link
                  href="/account/orders"
                  className="block px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  href="/account/addresses"
                  className="block px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  Addresses
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account/login"
                  className="block px-4 py-3 text-sm font-medium hover:bg-gray-50"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/account/register"
                  className="block px-4 py-3 text-sm hover:bg-gray-50 border-t border-gray-100"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  Create Account
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
