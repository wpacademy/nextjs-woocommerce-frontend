'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useIsAuthenticated, useAuthToken } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WCAddress } from '@/types/woocommerce';

const addressSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address_1: z.string().min(1, 'Address is required'),
  address_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postcode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const token = useAuthToken();

  const [billing, setBilling] = useState<WCAddress | null>(null);
  const [shipping, setShipping] = useState<WCAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBilling, setEditingBilling] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const billingForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US' },
  });

  const shippingForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US' },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/account/login?redirect=/account/addresses');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      fetchAddresses();
    }
  }, [mounted, isAuthenticated, token]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/account/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      setBilling(data.billing);
      setShipping(data.shipping);

      if (data.billing) {
        billingForm.reset(data.billing);
      }
      if (data.shipping) {
        shippingForm.reset(data.shipping);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAddress = async (type: 'billing' | 'shipping', data: AddressFormData) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/account/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [type]: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      const result = await response.json();

      if (type === 'billing') {
        setBilling(result.billing);
        setEditingBilling(false);
      } else {
        setShipping(result.shipping);
        setEditingShipping(false);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} address updated successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  const renderAddressDisplay = (address: WCAddress | null, type: 'billing' | 'shipping') => {
    if (!address || !address.address_1) {
      return (
        <p className="text-gray-500">No {type} address saved.</p>
      );
    }

    return (
      <address className="not-italic text-sm text-gray-600">
        {address.first_name} {address.last_name}
        {address.company && <><br />{address.company}</>}
        <br />
        {address.address_1}
        {address.address_2 && <><br />{address.address_2}</>}
        <br />
        {address.city}, {address.state} {address.postcode}
        <br />
        {address.country}
        {address.phone && <><br /><br />{address.phone}</>}
        {address.email && <><br />{address.email}</>}
      </address>
    );
  };

  const renderAddressForm = (
    form: ReturnType<typeof useForm<AddressFormData>>,
    type: 'billing' | 'shipping',
    onCancel: () => void
  ) => (
    <form onSubmit={form.handleSubmit((data) => saveAddress(type, data))} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="First name"
          {...form.register('first_name')}
          error={form.formState.errors.first_name?.message}
        />
        <Input
          placeholder="Last name"
          {...form.register('last_name')}
          error={form.formState.errors.last_name?.message}
        />
      </div>
      <Input
        placeholder="Company (optional)"
        {...form.register('company')}
      />
      <Input
        placeholder="Address"
        {...form.register('address_1')}
        error={form.formState.errors.address_1?.message}
      />
      <Input
        placeholder="Apartment, suite, etc. (optional)"
        {...form.register('address_2')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="City"
          {...form.register('city')}
          error={form.formState.errors.city?.message}
        />
        <Input
          placeholder="State / Province"
          {...form.register('state')}
          error={form.formState.errors.state?.message}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="Postal code"
          {...form.register('postcode')}
          error={form.formState.errors.postcode?.message}
        />
        <select
          {...form.register('country')}
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
      {type === 'billing' && (
        <>
          <Input
            type="tel"
            placeholder="Phone"
            {...form.register('phone')}
          />
          <Input
            type="email"
            placeholder="Email"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
        </>
      )}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Address'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );

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
          <li className="text-black">Addresses</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-light">Addresses</h1>
      <p className="mt-2 text-gray-500">
        Manage your billing and shipping addresses.
      </p>

      {error && (
        <div className="mt-6 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse border border-gray-200 p-6">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 w-48 bg-gray-200 rounded"></div>
                <div className="h-3 w-40 bg-gray-200 rounded"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {/* Billing Address */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-medium">Billing Address</h2>
              {!editingBilling && (
                <button
                  onClick={() => setEditingBilling(true)}
                  className="text-sm text-gray-600 underline hover:text-black"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-4">
              {editingBilling ? (
                renderAddressForm(billingForm, 'billing', () => setEditingBilling(false))
              ) : (
                renderAddressDisplay(billing, 'billing')
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-medium">Shipping Address</h2>
              {!editingShipping && (
                <button
                  onClick={() => setEditingShipping(true)}
                  className="text-sm text-gray-600 underline hover:text-black"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-4">
              {editingShipping ? (
                renderAddressForm(shippingForm, 'shipping', () => setEditingShipping(false))
              ) : (
                renderAddressDisplay(shipping, 'shipping')
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
