/**
 * @fileoverview Payments Documentation
 * @description Merchant payment integration and payment links.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'Payments - PRVCSH Docs',
  description: 'Merchant payment integration with PRVCSH',
};

export default function Payments() {
  return (
    <article className={styles.main}>
      <header>
        <h1>Payments</h1>
        <p className={styles.description}>
          Accept private payments on your website, app, or platform.
        </p>
      </header>

      <section>
        <h2>Overview</h2>
        <p>
          PRVCSH Payments enables merchants to accept privacy-preserving payments 
          while maintaining full transaction records for accounting and compliance.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h4>🔒 Private Payments</h4>
            <p>Customers pay from shielded pools, protecting their transaction history.</p>
          </div>
          <div className={styles.feature}>
            <h4>📊 Full Records</h4>
            <p>Merchants receive standard payment records with order metadata.</p>
          </div>
          <div className={styles.feature}>
            <h4>💰 Low Fees</h4>
            <p>Only 0.3% fee + network gas. No monthly fees.</p>
          </div>
          <div className={styles.feature}>
            <h4>⚡ Instant Settlement</h4>
            <p>Funds arrive in your wallet within seconds.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 id="quick-start">Quick Start</h2>
        
        <h3>1. Install the Package</h3>
        <pre className={styles.codeBlock}>
          <code>{`npm install @prvcsh/payments`}</code>
        </pre>

        <h3>2. Create a Payment Link</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { PaymentLink } from '@prvcsh/payments';

const payments = new PaymentLink({
  merchantId: 'your-merchant-id',
  apiKey: process.env.PRIVACY_CASH_API_KEY,
});

// Create a payment link
const link = await payments.create({
  amount: 1_000_000_000, // 1 SOL in lamports
  recipient: 'YourWalletAddress...',
  metadata: {
    orderId: 'order-123',
    customerEmail: 'customer@example.com',
  },
  expiresIn: 3600, // 1 hour
});

console.log('Payment URL:', link.url);
// https://pay.privacycash.app/p/abc123xyz`}</code>
        </pre>

        <h3>3. Handle the Webhook</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { verifyWebhookSignature } from '@prvcsh/payments';

app.post('/webhook/payment', (req, res) => {
  const isValid = verifyWebhookSignature({
    payload: req.rawBody,
    signature: req.headers['x-prvcsh-signature'],
    timestamp: req.headers['x-prvcsh-timestamp'],
    secret: process.env.WEBHOOK_SECRET,
  });

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  
  if (event.type === 'payment.completed') {
    // Fulfill the order
    await fulfillOrder(event.data.metadata.orderId);
  }

  res.json({ received: true });
});`}</code>
        </pre>
      </section>

      <section>
        <h2 id="payment-link-api">Payment Link API</h2>

        <h3>PaymentLink Constructor</h3>
        <pre className={styles.codeBlock}>
          <code>{`const payments = new PaymentLink({
  merchantId: string,      // Your merchant ID
  apiKey: string,          // API key from dashboard
  environment?: 'production' | 'sandbox',
  defaultCurrency?: 'SOL' | 'USDC',
});`}</code>
        </pre>

        <h3>create(options)</h3>
        <p>Create a new payment link.</p>
        <pre className={styles.codeBlock}>
          <code>{`interface CreatePaymentOptions {
  amount: number;              // Amount in smallest unit (lamports for SOL)
  recipient: string;           // Wallet address to receive funds
  currency?: 'SOL' | 'USDC';   // Default: 'SOL'
  expiresIn?: number;          // Seconds until expiry
  metadata?: Record<string, any>; // Custom data (returned in webhooks)
  callbackUrl?: string;        // Webhook URL for this payment
  successUrl?: string;         // Redirect after successful payment
  cancelUrl?: string;          // Redirect if payment cancelled
  allowPartial?: boolean;      // Accept partial payments
}

interface PaymentLinkResult {
  id: string;                  // Payment link ID
  url: string;                 // URL to share with customer
  expiresAt: Date;             // Expiration timestamp
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
}`}</code>
        </pre>

        <h3>get(paymentId)</h3>
        <p>Retrieve payment status.</p>
        <pre className={styles.codeBlock}>
          <code>{`const payment = await payments.get('pay_abc123');

console.log(payment.status); // 'completed'
console.log(payment.paidAmount); // 1000000000
console.log(payment.txHash); // 'abc...xyz'`}</code>
        </pre>

        <h3>list(options)</h3>
        <p>List all payments with filtering.</p>
        <pre className={styles.codeBlock}>
          <code>{`const recentPayments = await payments.list({
  status: 'completed',
  from: new Date('2025-01-01'),
  to: new Date(),
  limit: 50,
  offset: 0,
});

for (const payment of recentPayments.data) {
  console.log(\`\${payment.id}: \${payment.amount} - \${payment.status}\`);
}`}</code>
        </pre>

        <h3>cancel(paymentId)</h3>
        <p>Cancel a pending payment.</p>
        <pre className={styles.codeBlock}>
          <code>{`await payments.cancel('pay_abc123');`}</code>
        </pre>
      </section>

      <section>
        <h2 id="checkout-widget">Checkout Widget</h2>
        <p>Embed a checkout button directly in your website.</p>

        <h3>React Component</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { CheckoutButton } from '@prvcsh/payments/react';

function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.price} SOL</p>
      
      <CheckoutButton
        merchantId="your-merchant-id"
        amount={product.price * 1e9}
        recipient="YourWalletAddress..."
        metadata={{ productId: product.id }}
        onSuccess={(payment) => {
          console.log('Payment successful!', payment);
          router.push('/thank-you');
        }}
        onError={(error) => {
          console.error('Payment failed:', error);
        }}
        theme="dark"
        label="Pay with PRVCSH"
      />
    </div>
  );
}`}</code>
        </pre>

        <h3>Vanilla JavaScript</h3>
        <pre className={styles.codeBlock}>
          <code>{`<script src="https://js.privacycash.app/checkout.js"></script>

<button id="pay-button">Pay Now</button>

<script>
  const checkout = new PRVCSHCheckout({
    merchantId: 'your-merchant-id',
  });

  document.getElementById('pay-button').onclick = async () => {
    const result = await checkout.open({
      amount: 1000000000,
      recipient: 'YourWalletAddress...',
      metadata: { orderId: '12345' },
    });

    if (result.success) {
      window.location.href = '/thank-you';
    }
  };
</script>`}</code>
        </pre>
      </section>

      <section>
        <h2 id="invoices">Invoices</h2>
        <p>Create detailed invoices with line items.</p>
        <pre className={styles.codeBlock}>
          <code>{`import { Invoice } from '@prvcsh/payments';

const invoice = new Invoice({
  merchantId: 'your-merchant-id',
  apiKey: process.env.PRIVACY_CASH_API_KEY,
});

const inv = await invoice.create({
  customer: {
    email: 'customer@example.com',
    name: 'John Doe',
  },
  items: [
    {
      description: 'Pro Subscription (Monthly)',
      quantity: 1,
      unitPrice: 29_990_000_000, // 29.99 SOL in lamports
    },
    {
      description: 'Add-on: Extra Storage',
      quantity: 1,
      unitPrice: 5_000_000_000, // 5 SOL
    },
  ],
  tax: 0.08, // 8% tax
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
  notes: 'Thank you for your business!',
  recipient: 'YourWalletAddress...',
});

console.log('Invoice URL:', inv.url);
console.log('Total:', inv.total); // Including tax`}</code>
        </pre>
      </section>

      <section>
        <h2 id="subscriptions">Subscriptions</h2>
        <p>Set up recurring payments.</p>
        <pre className={styles.codeBlock}>
          <code>{`import { Subscription } from '@prvcsh/payments';

const subscriptions = new Subscription({
  merchantId: 'your-merchant-id',
  apiKey: process.env.PRIVACY_CASH_API_KEY,
});

// Create a subscription plan
const plan = await subscriptions.createPlan({
  name: 'Pro Plan',
  amount: 29_990_000_000, // 29.99 SOL
  interval: 'monthly',
  trialDays: 14,
});

// Subscribe a customer
const sub = await subscriptions.create({
  planId: plan.id,
  customer: {
    email: 'customer@example.com',
    walletAddress: 'CustomerWallet...',
  },
  recipient: 'YourWalletAddress...',
});

console.log('Subscription ID:', sub.id);
console.log('Next billing:', sub.nextBillingDate);

// Handle subscription events
subscriptions.on('subscription.payment_due', async (event) => {
  // Send payment reminder
  await sendEmail(event.customer.email, {
    subject: 'Payment Due',
    body: \`Your subscription payment of \${event.amount} SOL is due.\`,
    paymentUrl: event.paymentUrl,
  });
});

subscriptions.on('subscription.cancelled', async (event) => {
  // Revoke access
  await revokeAccess(event.customer.walletAddress);
});`}</code>
        </pre>
      </section>

      <section>
        <h2 id="webhooks">Webhooks</h2>
        
        <h3>Webhook Events</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>payment.created</code></td>
              <td>New payment link created</td>
            </tr>
            <tr>
              <td><code>payment.completed</code></td>
              <td>Payment successfully received</td>
            </tr>
            <tr>
              <td><code>payment.expired</code></td>
              <td>Payment link expired</td>
            </tr>
            <tr>
              <td><code>payment.cancelled</code></td>
              <td>Payment was cancelled</td>
            </tr>
            <tr>
              <td><code>subscription.created</code></td>
              <td>New subscription started</td>
            </tr>
            <tr>
              <td><code>subscription.payment_due</code></td>
              <td>Subscription payment is due</td>
            </tr>
            <tr>
              <td><code>subscription.payment_failed</code></td>
              <td>Subscription payment failed</td>
            </tr>
            <tr>
              <td><code>subscription.cancelled</code></td>
              <td>Subscription was cancelled</td>
            </tr>
          </tbody>
        </table>

        <h3>Webhook Payload</h3>
        <pre className={styles.codeBlock}>
          <code>{`{
  "id": "evt_abc123",
  "type": "payment.completed",
  "created": "2025-01-15T10:30:00Z",
  "data": {
    "id": "pay_xyz789",
    "amount": 1000000000,
    "currency": "SOL",
    "status": "completed",
    "txHash": "abc123...",
    "paidAt": "2025-01-15T10:29:55Z",
    "metadata": {
      "orderId": "order-123",
      "customerEmail": "customer@example.com"
    }
  }
}`}</code>
        </pre>

        <h3>Webhook Signature Verification</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { verifyWebhookSignature } from '@prvcsh/payments';

// Express.js example
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const isValid = verifyWebhookSignature({
    payload: req.body, // raw body as buffer
    signature: req.headers['x-prvcsh-signature'],
    timestamp: req.headers['x-prvcsh-timestamp'],
    secret: process.env.WEBHOOK_SECRET,
  });

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process the event...
});

// Next.js App Router
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  const isValid = verifyWebhookSignature({
    payload: body,
    signature: req.headers.get('x-prvcsh-signature')!,
    timestamp: req.headers.get('x-prvcsh-timestamp')!,
    secret: process.env.WEBHOOK_SECRET!,
  });

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  // Process...
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="testing">Testing</h2>
        <p>Use sandbox mode for development and testing.</p>
        <pre className={styles.codeBlock}>
          <code>{`const payments = new PaymentLink({
  merchantId: 'your-merchant-id',
  apiKey: process.env.PRIVACY_CASH_API_KEY,
  environment: 'sandbox', // Use devnet
});

// In sandbox mode, use devnet wallets
// Payments are simulated and don't use real funds`}</code>
        </pre>

        <h3>Test Cards / Scenarios</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Test Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Successful payment</td>
              <td>Any valid amount</td>
            </tr>
            <tr>
              <td>Payment fails</td>
              <td>Amount ending in 666</td>
            </tr>
            <tr>
              <td>Payment timeout</td>
              <td>Amount ending in 408</td>
            </tr>
            <tr>
              <td>Partial payment</td>
              <td>Amount ending in 206</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Dashboard</h2>
        <p>
          Manage your payments, view analytics, and configure webhooks in the 
          <a href="https://dashboard.privacycash.app" target="_blank" rel="noopener noreferrer">
            {' '}PRVCSH Dashboard
          </a>.
        </p>
        <ul>
          <li>📊 Real-time payment analytics</li>
          <li>💳 Payment history and search</li>
          <li>🔧 Webhook configuration</li>
          <li>🔑 API key management</li>
          <li>👥 Team member access</li>
        </ul>
      </section>
    </article>
  );
}
