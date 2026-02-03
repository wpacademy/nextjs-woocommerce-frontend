import { NextResponse } from 'next/server';
import { wooCommerce } from '@/lib/woocommerce';
import { validateToken, getCurrentUser } from '@/lib/auth';
import type { WCAddress } from '@/types/woocommerce';

interface AddressesRequestBody {
  billing?: Partial<WCAddress>;
  shipping?: Partial<WCAddress>;
}

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
      return NextResponse.json({
        billing: null,
        shipping: null,
      });
    }

    return NextResponse.json({
      billing: customer.billing,
      shipping: customer.shipping,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch addresses';
    return NextResponse.json({ message }, { status: 500 });
  }
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

    const body: AddressesRequestBody = await request.json();

    // Build update object - merge with existing customer data to ensure complete addresses
    const updateData: { billing?: WCAddress; shipping?: WCAddress } = {};

    if (body.billing) {
      updateData.billing = {
        ...customer.billing,
        ...body.billing,
      } as WCAddress;
    }

    if (body.shipping) {
      updateData.shipping = {
        ...customer.shipping,
        ...body.shipping,
      } as WCAddress;
    }

    // Update customer
    const updatedCustomer = await wooCommerce.customers.update(customer.id, updateData as Partial<typeof customer>);

    return NextResponse.json({
      billing: updatedCustomer.billing,
      shipping: updatedCustomer.shipping,
    });
  } catch (error) {
    console.error('Error updating addresses:', error);

    const message = error instanceof Error ? error.message : 'Failed to update addresses';
    return NextResponse.json({ message }, { status: 500 });
  }
}
