import { NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';
import { validateToken, getCurrentUser } from '@/lib/auth';

interface UpdateRequestBody {
  firstName?: string;
  lastName?: string;
  email?: string;
}

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

    // Get customer by email
    const customer = await wooCommerce.customers.getByEmail(user.email);
    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    const body: UpdateRequestBody = await request.json();

    // Update customer
    const updatedCustomer = await wooCommerce.customers.update(customer.id, {
      first_name: body.firstName || customer.first_name,
      last_name: body.lastName || customer.last_name,
      email: body.email || customer.email,
    });

    return NextResponse.json({
      id: updatedCustomer.id,
      email: updatedCustomer.email,
      firstName: updatedCustomer.first_name,
      lastName: updatedCustomer.last_name,
    });
  } catch (error) {
    console.error('Error updating account:', error);

    const message = error instanceof Error ? error.message : 'Failed to update account';
    return NextResponse.json({ message }, { status: 500 });
  }
}
