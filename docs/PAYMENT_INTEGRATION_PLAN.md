# Payment Integration Plan

This document outlines the implementation plan for adding Stripe, PayPal, and WooCommerce Checkout Block payment methods to the headless WordPress frontend.

---

## Current Status

- **Implemented**: Cash on Delivery (COD)
- **Pending**: Stripe, PayPal, WooCommerce Checkout Block

---

## 1. Stripe Integration

### Overview
Stripe Checkout provides a hosted payment page that handles card input, validation, and 3D Secure authentication. This is the most secure and PCI-compliant approach.

### Flow
```
1. User fills checkout form →
2. Frontend creates order (status: pending) →
3. Frontend calls /api/checkout/stripe →
4. API creates Stripe Checkout Session →
5. User redirected to Stripe →
6. User completes payment →
7. Stripe redirects to success page →
8. Stripe webhook updates order to "processing"
```

### Requirements

**WordPress Plugins:**
- WooCommerce Stripe Gateway (for webhook handling)

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**npm Packages:**
```bash
npm install stripe @stripe/stripe-js
```

### Implementation Steps

#### Step 1: Create Stripe API Route
**File:** `src/app/api/checkout/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderId, items, customerEmail } = body;

  const lineItems = items.map((item: any) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(parseFloat(item.price) * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    customer_email: customerEmail,
    metadata: {
      order_id: orderId,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-confirmation/${orderId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?payment=cancelled`,
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
```

#### Step 2: Create Stripe Webhook Handler
**File:** `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { orders } from '@/lib/woocommerce';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      // Update WooCommerce order status
      await orders.update(parseInt(orderId), {
        status: 'processing',
        transaction_id: session.payment_intent as string,
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

#### Step 3: Update Checkout Page
**File:** `src/app/checkout/page.tsx` (add Stripe option)

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// In payment method selection
const handleStripePayment = async (orderId: number) => {
  const response = await fetch('/api/checkout/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      items: cartItems,
      customerEmail: billing.email,
    }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe
};
```

#### Step 4: Create Payment Method Selector Component
**File:** `src/components/checkout/payment-methods.tsx`

```typescript
interface PaymentMethodsProps {
  selected: string;
  onChange: (method: string) => void;
}

export function PaymentMethods({ selected, onChange }: PaymentMethodsProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 p-4 border rounded cursor-pointer">
        <input
          type="radio"
          name="payment"
          value="stripe"
          checked={selected === 'stripe'}
          onChange={() => onChange('stripe')}
        />
        <span>Credit Card (Stripe)</span>
      </label>

      <label className="flex items-center gap-3 p-4 border rounded cursor-pointer">
        <input
          type="radio"
          name="payment"
          value="paypal"
          checked={selected === 'paypal'}
          onChange={() => onChange('paypal')}
        />
        <span>PayPal</span>
      </label>

      <label className="flex items-center gap-3 p-4 border rounded cursor-pointer">
        <input
          type="radio"
          name="payment"
          value="cod"
          checked={selected === 'cod'}
          onChange={() => onChange('cod')}
        />
        <span>Cash on Delivery</span>
      </label>
    </div>
  );
}
```

### Testing Checklist
- [ ] Stripe test mode keys configured
- [ ] Checkout session creates successfully
- [ ] Redirect to Stripe works
- [ ] Payment completes in test mode
- [ ] Webhook receives events
- [ ] Order status updates to "processing"
- [ ] Success page displays correctly
- [ ] Cancelled payment redirects properly

---

## 2. PayPal Integration

### Overview
PayPal Checkout SDK provides buttons and handles the payment flow. Similar to Stripe, it redirects users or opens a popup for payment.

### Flow
```
1. User selects PayPal →
2. PayPal button rendered →
3. User clicks PayPal button →
4. PayPal popup/redirect opens →
5. User logs in and pays →
6. PayPal calls onApprove callback →
7. Frontend captures payment →
8. Order updated to "processing"
```

### Requirements

**WordPress Plugins:**
- WooCommerce PayPal Payments (for order sync)

**Environment Variables:**
```env
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox  # or 'live'
```

**npm Packages:**
```bash
npm install @paypal/react-paypal-js
```

### Implementation Steps

#### Step 1: Create PayPal Provider
**File:** `src/components/providers/paypal-provider.tsx`

```typescript
'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export function PayPalProvider({ children }: { children: React.ReactNode }) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
```

#### Step 2: Create PayPal Button Component
**File:** `src/components/checkout/paypal-button.tsx`

```typescript
'use client';

import { PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: string;
  orderId: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

export function PayPalButton({ amount, orderId, onSuccess, onError }: PayPalButtonProps) {
  return (
    <PayPalButtons
      style={{ layout: 'vertical' }}
      createOrder={(data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount,
              },
              custom_id: orderId.toString(),
            },
          ],
        });
      }}
      onApprove={async (data, actions) => {
        const details = await actions.order?.capture();

        // Update WooCommerce order
        await fetch('/api/checkout/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paypalOrderId: data.orderID,
            transactionId: details?.id,
          }),
        });

        onSuccess(details);
      }}
      onError={onError}
    />
  );
}
```

#### Step 3: Create PayPal Capture API Route
**File:** `src/app/api/checkout/paypal/capture/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { orders } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  const { orderId, paypalOrderId, transactionId } = await request.json();

  try {
    // Update WooCommerce order
    await orders.update(orderId, {
      status: 'processing',
      payment_method: 'paypal',
      payment_method_title: 'PayPal',
      transaction_id: transactionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
  }
}
```

#### Step 4: Add PayPal to Checkout Page
```typescript
// In checkout page, when PayPal is selected:
{paymentMethod === 'paypal' && (
  <PayPalButton
    amount={cartTotal.toFixed(2)}
    orderId={orderId}
    onSuccess={(details) => {
      router.push(`/order-confirmation/${orderId}?payment=success`);
    }}
    onError={(error) => {
      setError('PayPal payment failed. Please try again.');
    }}
  />
)}
```

### Testing Checklist
- [ ] PayPal sandbox credentials configured
- [ ] PayPal buttons render correctly
- [ ] Popup opens on button click
- [ ] Payment completes in sandbox
- [ ] Order captures successfully
- [ ] WooCommerce order updates
- [ ] Success redirect works

---

## 3. WooCommerce Checkout Block (iframe)

### Overview
Embed the native WooCommerce checkout in an iframe. This is the easiest approach but provides less control over the UI and is not truly "headless".

### Flow
```
1. User clicks "Checkout" →
2. Cart synced to WooCommerce →
3. iframe loads WC checkout →
4. User completes checkout in iframe →
5. WC handles payment (any gateway) →
6. Redirect to confirmation page
```

### Pros & Cons

**Pros:**
- Supports ALL WooCommerce payment gateways automatically
- No additional integration per gateway
- WooCommerce handles PCI compliance
- Familiar checkout experience for WP users

**Cons:**
- Less control over UI/UX
- Styling is limited
- Not truly headless
- Requires CORS/iframe configuration
- Cart sync complexity

### Implementation Steps

#### Step 1: Create Cart Sync API
**File:** `src/app/api/cart/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

export async function POST(request: NextRequest) {
  const { items } = await request.json();

  // Use WooCommerce Store API to sync cart
  const response = await fetch(`${WP_URL}/wp-json/wc/store/v1/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  const cart = await response.json();
  return NextResponse.json(cart);
}
```

#### Step 2: Create Checkout iframe Component
**File:** `src/components/checkout/wc-checkout-iframe.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

interface WCCheckoutIframeProps {
  cartItems: any[];
  onComplete: (orderId: string) => void;
}

export function WCCheckoutIframe({ cartItems, onComplete }: WCCheckoutIframeProps) {
  const [iframeSrc, setIframeSrc] = useState('');
  const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

  useEffect(() => {
    // Sync cart first, then load iframe
    const syncAndLoad = async () => {
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems }),
      });

      setIframeSrc(`${WP_URL}/checkout/?headless=true`);
    };

    syncAndLoad();
  }, [cartItems, WP_URL]);

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== WP_URL) return;

      if (event.data.type === 'wc-order-complete') {
        onComplete(event.data.orderId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [WP_URL, onComplete]);

  return (
    <div className="w-full min-h-[600px]">
      {iframeSrc ? (
        <iframe
          src={iframeSrc}
          className="w-full h-[800px] border-0"
          title="WooCommerce Checkout"
        />
      ) : (
        <div className="flex items-center justify-center h-[600px]">
          <p>Loading checkout...</p>
        </div>
      )}
    </div>
  );
}
```

#### Step 3: WordPress Configuration Required

Add to WordPress theme's `functions.php`:

```php
// Allow iframe embedding from your frontend domain
add_action('send_headers', function() {
    if (isset($_GET['headless']) && $_GET['headless'] === 'true') {
        header('X-Frame-Options: ALLOW-FROM ' . esc_url('https://your-frontend-domain.com'));
        header('Content-Security-Policy: frame-ancestors https://your-frontend-domain.com');
    }
});

// Send message to parent on order complete
add_action('woocommerce_thankyou', function($order_id) {
    if (isset($_GET['headless'])) {
        ?>
        <script>
            window.parent.postMessage({
                type: 'wc-order-complete',
                orderId: '<?php echo esc_js($order_id); ?>'
            }, '*');
        </script>
        <?php
    }
});

// Optional: Hide header/footer for iframe
add_action('wp_head', function() {
    if (isset($_GET['headless']) && $_GET['headless'] === 'true') {
        echo '<style>
            header, footer, .site-header, .site-footer { display: none !important; }
            .woocommerce-checkout { padding: 20px; }
        </style>';
    }
});
```

### Testing Checklist
- [ ] WordPress CORS headers configured
- [ ] iframe loads without errors
- [ ] Cart syncs correctly
- [ ] Checkout form works in iframe
- [ ] Payment gateways appear
- [ ] Order completion message received
- [ ] Redirect to confirmation works

---

## Recommended Implementation Order

1. **Stripe** (Most common, best UX for card payments)
2. **PayPal** (Second most requested payment method)
3. **WooCommerce iframe** (Optional fallback for other gateways)

---

## Environment Variables Summary

Add these to `.env.local` and `.env.example`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox

# WooCommerce (existing)
NEXT_PUBLIC_WORDPRESS_URL=https://your-wp-site.com
WC_CONSUMER_KEY=ck_xxxxx
WC_CONSUMER_SECRET=cs_xxxxx
```

---

## File Structure After Implementation

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   ├── stripe/
│   │   │   │   └── route.ts
│   │   │   └── paypal/
│   │   │       └── capture/
│   │   │           └── route.ts
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── cart/
│   │       └── sync/
│   │           └── route.ts
│   └── checkout/
│       └── page.tsx (updated)
├── components/
│   ├── checkout/
│   │   ├── payment-methods.tsx
│   │   ├── paypal-button.tsx
│   │   └── wc-checkout-iframe.tsx
│   └── providers/
│       └── paypal-provider.tsx
└── lib/
    └── stripe.ts (optional helper)
```

---

## Security Considerations

1. **Never expose secret keys** to the client
2. **Validate webhook signatures** to prevent spoofing
3. **Use HTTPS** for all payment-related requests
4. **Verify order amounts** server-side before processing
5. **Implement rate limiting** on payment endpoints
6. **Log all payment events** for debugging and auditing

---

## Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [PayPal JavaScript SDK](https://developer.paypal.com/docs/checkout/)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WooCommerce Store API](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/docs/README.md)
