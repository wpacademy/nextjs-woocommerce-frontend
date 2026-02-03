import { notFound } from 'next/navigation';
import Link from 'next/link';
import { wooCommerce } from '@/lib/woocommerce';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    notFound();
  }

  let order;
  try {
    order = await wooCommerce.orders.get(orderId);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-light">Thank you for your order!</h1>
        <p className="mt-2 text-gray-500">
          Your order has been received and is being processed.
        </p>
      </div>

      {/* Order Details */}
      <div className="mt-12 border border-gray-200 p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <p className="text-sm text-gray-500">Order number</p>
            <p className="text-lg font-medium">#{order.number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-lg font-medium">
              {new Date(order.date_created).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Items ordered
          </h2>
          <div className="mt-4 divide-y">
            {order.line_items.map((item) => (
              <div key={item.id} className="flex justify-between py-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">{formatPrice(parseFloat(item.total))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 border-t pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>
                {formatPrice(
                  order.line_items.reduce((acc, item) => acc + parseFloat(item.total), 0)
                )}
              </span>
            </div>
            {parseFloat(order.shipping_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span>{formatPrice(parseFloat(order.shipping_total))}</span>
              </div>
            )}
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
        <div className="mt-6 grid gap-6 border-t pt-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
              Billing Address
            </h2>
            <address className="mt-2 not-italic text-sm text-gray-700">
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
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
              Shipping Address
            </h2>
            <address className="mt-2 not-italic text-sm text-gray-700">
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

        {/* Payment Info */}
        <div className="mt-6 border-t pt-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Payment Method
          </h2>
          <p className="mt-2 text-sm text-gray-700">{order.payment_method_title}</p>
        </div>
      </div>

      {/* Order Note */}
      {order.customer_note && (
        <div className="mt-6 bg-gray-50 p-4">
          <h2 className="text-sm font-medium">Order Note</h2>
          <p className="mt-1 text-sm text-gray-600">{order.customer_note}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link href="/shop">
          <Button variant="outline" size="lg">
            Continue Shopping
          </Button>
        </Link>
        <Link href="/account/orders">
          <Button size="lg">View Order History</Button>
        </Link>
      </div>

      {/* Email Notice */}
      <p className="mt-8 text-center text-sm text-gray-500">
        A confirmation email has been sent to{' '}
        <span className="font-medium">{order.billing.email}</span>
      </p>
    </div>
  );
}
