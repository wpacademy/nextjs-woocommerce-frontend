import { NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';
import { validateToken, getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
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
      // Return empty array if no customer found
      return NextResponse.json([]);
    }

    // Get orders for this customer
    const orders = await wooCommerce.orders.listByCustomer(customer.id, {
      per_page: 20,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ message }, { status: 500 });
  }
}
