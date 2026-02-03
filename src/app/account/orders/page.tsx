'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIsAuthenticated, useAuthToken } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { WCOrder } from '@/types/woocommerce';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending Payment',
  processing: 'Processing',
  'on-hold': 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  failed: 'Failed',
};

export default function OrdersPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const token = useAuthToken();

  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/account/login?redirect=/account/orders');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      fetchOrders();
    }
  }, [mounted, isAuthenticated, token]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/account/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href="/account" className="hover:text-black">
              Account
            </Link>
          </li>
          <li>/</li>
          <li className="text-black">Orders</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-light">Order History</h1>
      <p className="mt-2 text-gray-500">
        View and track your recent orders.
      </p>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border border-gray-200 p-6">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-4 h-4 w-48 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 text-center py-12 border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium">No orders yet</h2>
          <p className="mt-1 text-gray-500">Start shopping to see your orders here.</p>
          <Link href="/shop">
            <Button className="mt-6">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 p-6 transition-colors hover:border-gray-300"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Order #{order.number}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Placed on{' '}
                    {new Date(order.date_created).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(parseFloat(order.total))}</p>
                  <p className="text-sm text-gray-500">
                    {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mt-4 border-t pt-4">
                <div className="space-y-2">
                  {order.line_items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(parseFloat(item.total))}</span>
                    </div>
                  ))}
                  {order.line_items.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{order.line_items.length - 3} more item{order.line_items.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* View Details Link */}
              <div className="mt-4 border-t pt-4">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="text-sm font-medium text-black hover:underline"
                >
                  View Order Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
