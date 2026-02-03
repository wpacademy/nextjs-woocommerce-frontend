import { NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';
import { validateToken, getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'Invalid order ID' },
        { status: 400 }
      );
    }

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

    // Get the order
    const order = await wooCommerce.orders.get(orderId);

    // Verify the order belongs to this customer (by email since customer_id might not match)
    if (order.billing.email !== user.email && order.customer_id !== customer?.id) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
