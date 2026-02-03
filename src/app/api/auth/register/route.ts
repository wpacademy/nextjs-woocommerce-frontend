import { NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';

interface RegisterRequestBody {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterRequestBody = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await wooCommerce.customers.getByEmail(body.email);
    if (existingCustomer) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create the customer
    const customer = await wooCommerce.customers.create({
      email: body.email,
      password: body.password,
      first_name: body.firstName || '',
      last_name: body.lastName || '',
    });

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
    });
  } catch (error) {
    console.error('Registration error:', error);

    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
