import { NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

interface ForgotPasswordRequestBody {
  email: string;
}

export async function POST(request: Request) {
  try {
    const body: ForgotPasswordRequestBody = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Use WordPress REST API to request password reset
    // This triggers WordPress to send a password reset email
    const response = await fetch(`${WP_URL}/wp-json/wp/v2/users/lostpassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_login: body.email,
      }),
    });

    // Even if the email doesn't exist, we return success for security
    // (prevents email enumeration attacks)
    if (!response.ok) {
      // Log the actual error for debugging but return generic success
      console.log('Password reset request:', await response.text());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Return success anyway for security
    return NextResponse.json({ success: true });
  }
}
