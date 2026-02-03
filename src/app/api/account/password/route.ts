import { NextResponse } from 'next/server';
import { validateToken, getCurrentUser, login } from '@/lib/auth';

interface PasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

export async function PUT(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate token
    const isValid = await validateToken(token);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user info
    const user = await getCurrentUser(token);

    const body: PasswordRequestBody = await request.json();

    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to login
    try {
      await login(user.email, body.currentPassword);
    } catch {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password using WordPress REST API
    const response = await fetch(`${WP_URL}/wp-json/wp/v2/users/${user.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password: body.newPassword,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update password');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating password:', error);

    const message = error instanceof Error ? error.message : 'Failed to update password';
    return NextResponse.json({ message }, { status: 500 });
  }
}
