'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useIsAuthenticated, useAuthToken } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
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

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const token = useAuthToken();

  const [order, setOrder] = useState<WCOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push(`/account/login?redirect=/account/orders/${id}`);
    }
  }, [mounted, isAuthenticated, router, id]);

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      fetchOrder();
    }
  }, [mounted, isAuthenticated, token, id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/account/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="text-center">
          <h1 className="text-2xl font-light">Order Not Found</h1>
          <p className="mt-2 text-gray-500">{error || 'This order could not be found.'}</p>
          <Link href="/account/orders">
            <button className="mt-6 bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800">
              Back to Orders
            </button>
          </Link>
        </div>
      </div>
    );
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
          <li>
            <Link href="/account/orders" className="hover:text-black">
              Orders
            </Link>
          </li>
          <li>/</li>
          <li className="text-black">#{order.number}</li>
        </ol>
      </nav>

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light">Order #{order.number}</h1>
          <p className="mt-2 text-gray-500">
            Placed on{' '}
            {new Date(order.date_created).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            statusColors[order.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      {/* Order Items */}
      <div className="mt-8 border border-gray-200">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h2 className="font-medium">Order Items</h2>
        </div>
        <div className="divide-y">
          {order.line_items.map((item) => (
            <div key={item.id} className="flex gap-4 p-6">
              <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-gray-100">
                {item.image?.src ? (
                  <Image
                    src={item.image.src}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    {item.meta_data.length > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        {item.meta_data
                          .filter((m) => !m.key.startsWith('_'))
                          .map((m) => `${m.key}: ${m.value}`)
                          .join(' / ')}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(parseFloat(item.total))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="mt-8 border border-gray-200 p-6">
        <h2 className="font-medium">Order Summary</h2>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>
              {formatPrice(
                order.line_items.reduce((acc, item) => acc + parseFloat(item.subtotal), 0)
              )}
            </span>
          </div>
          {parseFloat(order.discount_total) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">-{formatPrice(parseFloat(order.discount_total))}</span>
            </div>
          )}
          {order.shipping_lines.map((shipping) => (
            <div key={shipping.id} className="flex justify-between text-sm">
              <span className="text-gray-500">{shipping.method_title}</span>
              <span>{formatPrice(parseFloat(shipping.total))}</span>
            </div>
          ))}
          {parseFloat(order.total_tax) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>{formatPrice(parseFloat(order.total_tax))}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-lg font-medium">
            <span>Total</span>
            <span>{formatPrice(parseFloat(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="border border-gray-200 p-6">
          <h2 className="font-medium">Billing Address</h2>
          <address className="mt-4 not-italic text-sm text-gray-600">
            {order.billing.first_name} {order.billing.last_name}
            <br />
            {order.billing.address_1}
            {order.billing.address_2 && (
              <>
                <br />
                {order.billing.address_2}
              </>
            )}
            <br />
            {order.billing.city}, {order.billing.state} {order.billing.postcode}
            <br />
            {order.billing.country}
            <br />
            <br />
            {order.billing.email}
            <br />
            {order.billing.phone}
          </address>
        </div>
        <div className="border border-gray-200 p-6">
          <h2 className="font-medium">Shipping Address</h2>
          <address className="mt-4 not-italic text-sm text-gray-600">
            {order.shipping.first_name} {order.shipping.last_name}
            <br />
            {order.shipping.address_1}
            {order.shipping.address_2 && (
              <>
                <br />
                {order.shipping.address_2}
              </>
            )}
            <br />
            {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
            <br />
            {order.shipping.country}
          </address>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mt-8 border border-gray-200 p-6">
        <h2 className="font-medium">Payment Method</h2>
        <p className="mt-2 text-sm text-gray-600">{order.payment_method_title}</p>
      </div>

      {/* Order Notes */}
      {order.customer_note && (
        <div className="mt-8 bg-gray-50 p-6">
          <h2 className="font-medium">Order Notes</h2>
          <p className="mt-2 text-sm text-gray-600">{order.customer_note}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Link href="/account/orders">
          <button className="border border-gray-300 px-6 py-3 text-sm font-medium hover:border-black">
            ← Back to Orders
          </button>
        </Link>
      </div>
    </div>
  );
}
