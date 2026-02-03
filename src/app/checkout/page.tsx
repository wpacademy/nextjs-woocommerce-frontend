'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore, useCartItems, useCartTotal } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postcode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  shippingSameAsBilling: z.boolean(),
  shippingFirstName: z.string().optional(),
  shippingLastName: z.string().optional(),
  shippingAddress1: z.string().optional(),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostcode: z.string().optional(),
  shippingCountry: z.string().optional(),
  orderNotes: z.string().optional(),
  createAccount: z.boolean().optional(),
  password: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartItems();
  const total = useCartTotal();
  const { clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingSameAsBilling: true,
      createAccount: false,
      country: 'US',
      shippingCountry: 'US',
    },
  });

  const shippingSameAsBilling = watch('shippingSameAsBilling');
  const createAccount = watch('createAccount');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setValue('email', user.email);
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
    }
  }, [isAuthenticated, user, setValue]);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-light">Your cart is empty</h1>
          <p className="mt-2 text-gray-500">Add some items to your cart before checkout.</p>
          <Link href="/shop">
            <Button className="mt-8">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const billingAddress = {
        first_name: data.firstName,
        last_name: data.lastName,
        address_1: data.address1,
        address_2: data.address2 || '',
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.country,
        email: data.email,
        phone: data.phone,
        company: '',
      };

      const shippingAddress = data.shippingSameAsBilling
        ? { ...billingAddress }
        : {
            first_name: data.shippingFirstName || data.firstName,
            last_name: data.shippingLastName || data.lastName,
            address_1: data.shippingAddress1 || data.address1,
            address_2: data.shippingAddress2 || '',
            city: data.shippingCity || data.city,
            state: data.shippingState || data.state,
            postcode: data.shippingPostcode || data.postcode,
            country: data.shippingCountry || data.country,
            company: '',
          };

      const lineItems = items.map((item) => ({
        product_id: item.productId,
        variation_id: item.variationId || 0,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billing: billingAddress,
          shipping: shippingAddress,
          line_items: lineItems,
          customer_note: data.orderNotes || '',
          create_account: data.createAccount,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      clearCart();
      router.push(`/order-confirmation/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
      <h1 className="text-3xl font-light">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Form Section */}
        <div className="lg:col-span-7">
          {/* Contact Information */}
          <section>
            <h2 className="text-lg font-medium">Contact Information</h2>
            {!isAuthenticated && (
              <p className="mt-1 text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/account/login?redirect=/checkout" className="text-black underline">
                  Log in
                </Link>
              </p>
            )}
            <div className="mt-4">
              <Input
                type="email"
                placeholder="Email address"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>
          </section>

          {/* Billing Address */}
          <section className="mt-8">
            <h2 className="text-lg font-medium">Billing Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="First name"
                {...register('firstName')}
                error={errors.firstName?.message}
              />
              <Input
                placeholder="Last name"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
              <div className="sm:col-span-2">
                <Input
                  placeholder="Phone number"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  placeholder="Address"
                  {...register('address1')}
                  error={errors.address1?.message}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  placeholder="Apartment, suite, etc. (optional)"
                  {...register('address2')}
                />
              </div>
              <Input
                placeholder="City"
                {...register('city')}
                error={errors.city?.message}
              />
              <Input
                placeholder="State / Province"
                {...register('state')}
                error={errors.state?.message}
              />
              <Input
                placeholder="Postal code"
                {...register('postcode')}
                error={errors.postcode?.message}
              />
              <select
                {...register('country')}
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="mt-8">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shippingSameAsBilling"
                {...register('shippingSameAsBilling')}
                className="h-4 w-4 border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="shippingSameAsBilling" className="text-sm">
                Shipping address same as billing
              </label>
            </div>

            {!shippingSameAsBilling && (
              <div className="mt-4">
                <h2 className="text-lg font-medium">Shipping Address</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="First name"
                    {...register('shippingFirstName')}
                  />
                  <Input
                    placeholder="Last name"
                    {...register('shippingLastName')}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Address"
                      {...register('shippingAddress1')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Apartment, suite, etc. (optional)"
                      {...register('shippingAddress2')}
                    />
                  </div>
                  <Input
                    placeholder="City"
                    {...register('shippingCity')}
                  />
                  <Input
                    placeholder="State / Province"
                    {...register('shippingState')}
                  />
                  <Input
                    placeholder="Postal code"
                    {...register('shippingPostcode')}
                  />
                  <select
                    {...register('shippingCountry')}
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Create Account */}
          {!isAuthenticated && (
            <section className="mt-8">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  {...register('createAccount')}
                  className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="createAccount" className="text-sm">
                  Create an account for faster checkout
                </label>
              </div>

              {createAccount && (
                <div className="mt-4">
                  <Input
                    type="password"
                    placeholder="Create password"
                    {...register('password')}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Order Notes */}
          <section className="mt-8">
            <label htmlFor="orderNotes" className="text-sm font-medium">
              Order notes (optional)
            </label>
            <textarea
              id="orderNotes"
              {...register('orderNotes')}
              rows={3}
              className="mt-2 w-full border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
              placeholder="Special instructions for your order..."
            />
          </section>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit Button - Mobile */}
          <div className="mt-8 lg:hidden">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-8 lg:col-span-5 lg:mt-0">
          <div className="sticky top-24 bg-gray-50 p-6">
            <h2 className="text-lg font-medium">Order Summary</h2>

            {/* Items */}
            <div className="mt-6 divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-gray-100">
                    {item.image ? (
                      <Image
                        src={item.image}
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
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                      <span className="text-xs text-gray-500">
                        {Object.entries(item.attributes)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' / ')}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-3 border-t pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>Calculated at next step</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>Calculated at next step</span>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Submit Button - Desktop */}
            <div className="mt-6 hidden lg:block">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </Button>
            </div>

            {/* Security Note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <span className="text-xs">Secure checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
