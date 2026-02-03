'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useIsAuthenticated, useUser } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

const accountLinks = [
  {
    title: 'Orders',
    description: 'View your order history and track shipments',
    href: '/account/orders',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    title: 'Addresses',
    description: 'Manage your billing and shipping addresses',
    href: '/account/addresses',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: 'Account Details',
    description: 'Update your name, email, and password',
    href: '/account/details',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function AccountPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const { logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/account/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light">My Account</h1>
          <p className="mt-2 text-gray-500">
            Welcome back, {user?.displayName || user?.firstName || 'there'}!
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      {/* Quick Links */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group border border-gray-200 p-6 transition-colors hover:border-black"
          >
            <div className="text-gray-400 transition-colors group-hover:text-black">
              {link.icon}
            </div>
            <h2 className="mt-4 font-medium">{link.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Account Info Summary */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-lg font-medium">Account Information</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div className="bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-500">Contact</h3>
            <p className="mt-2">{user?.displayName}</p>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <Link
              href="/account/details"
              className="mt-2 inline-block text-sm text-gray-600 underline hover:text-black"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Need Help */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-lg font-medium">Need Help?</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p>
            <Link href="/customer-service" className="underline hover:text-black">
              Contact Customer Service
            </Link>
          </p>
          <p>
            <Link href="/faq" className="underline hover:text-black">
              View FAQs
            </Link>
          </p>
          <p>
            <Link href="/size-guide" className="underline hover:text-black">
              Size Guide
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
