'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, useIsAuthenticated, useUser, useAuthToken } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const detailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type DetailsFormData = z.infer<typeof detailsSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AccountDetailsPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const token = useAuthToken();
  const { setUser } = useAuthStore();

  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const detailsForm = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/account/login?redirect=/account/details');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      detailsForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user, detailsForm]);

  const onSubmitDetails = async (data: DetailsFormData) => {
    setIsSubmittingDetails(true);
    setDetailsError(null);
    setDetailsSuccess(false);

    try {
      const response = await fetch('/api/account/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update details');
      }

      // Update local state
      if (user && token) {
        setUser(
          {
            ...user,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            displayName: `${data.firstName} ${data.lastName}`,
          },
          token
        );
      }

      setDetailsSuccess(true);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsSubmittingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update password');
      }

      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8 lg:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href="/account" className="hover:text-black">
              Account
            </Link>
          </li>
          <li>/</li>
          <li className="text-black">Account Details</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-light">Account Details</h1>
      <p className="mt-2 text-gray-500">Update your personal information.</p>

      {/* Personal Details Form */}
      <form onSubmit={detailsForm.handleSubmit(onSubmitDetails)} className="mt-8">
        <h2 className="text-lg font-medium">Personal Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            placeholder="First name"
            {...detailsForm.register('firstName')}
            error={detailsForm.formState.errors.firstName?.message}
          />
          <Input
            placeholder="Last name"
            {...detailsForm.register('lastName')}
            error={detailsForm.formState.errors.lastName?.message}
          />
          <div className="sm:col-span-2">
            <Input
              type="email"
              placeholder="Email address"
              {...detailsForm.register('email')}
              error={detailsForm.formState.errors.email?.message}
            />
          </div>
        </div>

        {detailsError && (
          <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {detailsError}
          </div>
        )}

        {detailsSuccess && (
          <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-600">
            Your details have been updated successfully.
          </div>
        )}

        <div className="mt-6">
          <Button type="submit" disabled={isSubmittingDetails}>
            {isSubmittingDetails ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Password Form */}
      <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="mt-12 border-t pt-8">
        <h2 className="text-lg font-medium">Change Password</h2>
        <div className="mt-4 space-y-4">
          <Input
            type="password"
            placeholder="Current password"
            {...passwordForm.register('currentPassword')}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            type="password"
            placeholder="New password"
            {...passwordForm.register('newPassword')}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            {...passwordForm.register('confirmPassword')}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
        </div>

        {passwordError && (
          <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-600">
            Your password has been changed successfully.
          </div>
        )}

        <div className="mt-6">
          <Button type="submit" disabled={isSubmittingPassword}>
            {isSubmittingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
