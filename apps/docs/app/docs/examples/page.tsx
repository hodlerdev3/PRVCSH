/**
 * @fileoverview Examples Documentation
 * @description Copy-paste ready code examples for common use cases.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'Examples - PRVCSH Docs',
  description: 'Copy-paste ready code examples for PRVCSH SDK',
};

export default function Examples() {
  return (
    <article className={styles.main}>
      <header>
        <h1>Examples</h1>
        <p className={styles.description}>
          Copy-paste ready examples for common integration scenarios.
        </p>
      </header>

      <nav className={styles.exampleNav}>
        <a href="#quick-deposit">Quick Deposit</a>
        <a href="#anonymous-tip">Anonymous Tip Jar</a>
        <a href="#subscription">Subscription Payment</a>
        <a href="#multi-recipient">Multi-Recipient Split</a>
        <a href="#react-hook">React Hook Integration</a>
        <a href="#next-api">Next.js API Route</a>
      </nav>

      <section>
        <h2 id="quick-deposit">Quick Deposit & Withdraw</h2>
        <p>The most basic flow - deposit SOL and withdraw to a new address.</p>
        <pre className={styles.codeBlock}>
          <code>{`import { PRVCSHBrowser } from '@prvcsh/sdk-wrapper';

async function quickMixer() {
  // Initialize SDK
  const sdk = new PRVCSHBrowser({
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  });
  await sdk.initialize();

  // Connect wallet
  const wallet = await sdk.connectWallet();
  console.log('Connected:', wallet.publicKey.toString());

  // Deposit 1 SOL
  const deposit = await sdk.deposit({
    amount: 1_000_000_000, // 1 SOL in lamports
    pool: 'SOL-1',
  });
  
  // SAVE THIS NOTE! Required for withdrawal
  console.log('Deposit note:', deposit.note);
  localStorage.setItem('deposit_note', deposit.note);
  
  // Wait for deposit confirmation
  await sdk.waitForConfirmation(deposit.txHash);
  
  // Withdraw to a new address (breaks the link!)
  const newAddress = 'NEW_ADDRESS_HERE';
  const withdrawal = await sdk.withdraw({
    note: deposit.note,
    recipient: newAddress,
  });
  
  console.log('Withdrawal complete:', withdrawal.txHash);
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="anonymous-tip">Anonymous Tip Jar</h2>
        <p>Accept anonymous donations/tips with webhook notifications.</p>
        <pre className={styles.codeBlock}>
          <code>{`// Frontend: TipJar.tsx
'use client';

import { useState } from 'react';

const TIP_AMOUNTS = [0.1, 0.5, 1, 5]; // SOL

export function TipJar({ creatorAddress }: { creatorAddress: string }) {
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const createTip = async () => {
    setStatus('loading');
    
    const response = await fetch('/api/create-tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: selectedAmount,
        recipient: creatorAddress,
        message: 'Anonymous tip 🎉',
      }),
    });
    
    const { paymentUrl } = await response.json();
    setPaymentLink(paymentUrl);
    setStatus('idle');
  };

  return (
    <div className="tip-jar">
      <h3>💝 Send Anonymous Tip</h3>
      
      <div className="amounts">
        {TIP_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => setSelectedAmount(amount)}
            className={selectedAmount === amount ? 'selected' : ''}
          >
            {amount} SOL
          </button>
        ))}
      </div>
      
      <button onClick={createTip} disabled={status === 'loading'}>
        {status === 'loading' ? 'Creating...' : \`Tip \${selectedAmount} SOL\`}
      </button>
      
      {paymentLink && (
        <a href={paymentLink} target="_blank" rel="noopener">
          Complete Payment →
        </a>
      )}
    </div>
  );
}

// Backend: app/api/create-tip/route.ts
import { PaymentLink } from '@prvcsh/payments';

export async function POST(request: Request) {
  const { amount, recipient, message } = await request.json();
  
  const paymentLink = new PaymentLink({
    merchantId: process.env.MERCHANT_ID!,
    apiKey: process.env.PRIVACY_CASH_API_KEY!,
  });
  
  const link = await paymentLink.create({
    amount: amount * 1_000_000_000, // Convert to lamports
    recipient,
    metadata: { type: 'tip', message },
    expiresIn: 24 * 60 * 60, // 24 hours
    onComplete: \`\${process.env.APP_URL}/api/tip-complete\`,
  });
  
  return Response.json({ paymentUrl: link.url });
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="subscription">Subscription Payment System</h2>
        <p>Monthly subscriptions with automatic renewal.</p>
        <pre className={styles.codeBlock}>
          <code>{`import { PaymentLink, SubscriptionManager } from '@prvcsh/payments';

class SubscriptionService {
  private payments: PaymentLink;
  private subscriptions: SubscriptionManager;

  constructor() {
    this.payments = new PaymentLink({
      merchantId: process.env.MERCHANT_ID!,
      apiKey: process.env.PRIVACY_CASH_API_KEY!,
    });
    
    this.subscriptions = new SubscriptionManager(this.payments);
  }

  async createSubscription(userId: string, plan: 'basic' | 'pro' | 'enterprise') {
    const pricing = {
      basic: 9.99,
      pro: 29.99,
      enterprise: 99.99,
    };
    
    // Create recurring payment
    const subscription = await this.subscriptions.create({
      userId,
      plan,
      amount: pricing[plan],
      currency: 'USD', // Will be converted to SOL at payment time
      interval: 'monthly',
      metadata: {
        features: this.getPlanFeatures(plan),
      },
    });
    
    return {
      subscriptionId: subscription.id,
      firstPaymentUrl: subscription.paymentUrl,
      nextBillingDate: subscription.nextBillingDate,
    };
  }

  async handleRenewal(subscriptionId: string) {
    const subscription = await this.subscriptions.get(subscriptionId);
    
    // Generate new payment link
    const renewalLink = await this.payments.create({
      amount: subscription.amount,
      recipient: process.env.TREASURY_ADDRESS!,
      metadata: {
        subscriptionId,
        type: 'renewal',
        period: subscription.currentPeriod + 1,
      },
    });
    
    // Send notification to user
    await this.notifyUser(subscription.userId, renewalLink.url);
  }

  private getPlanFeatures(plan: string): string[] {
    const features = {
      basic: ['10 private tx/month', 'Basic support'],
      pro: ['100 private tx/month', 'Priority support', 'Analytics'],
      enterprise: ['Unlimited tx', '24/7 support', 'Custom integration'],
    };
    return features[plan as keyof typeof features];
  }
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="multi-recipient">Multi-Recipient Split Payment</h2>
        <p>Split a payment between multiple recipients privately.</p>
        <pre className={styles.codeBlock}>
          <code>{`import { BatchProcessor } from '@prvcsh/batch';
import { PRVCSHBrowser } from '@prvcsh/sdk-wrapper';

async function splitPayment(
  totalAmount: number,
  recipients: Array<{ address: string; percentage: number }>
) {
  const sdk = new PRVCSHBrowser({
    network: 'mainnet-beta',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  });
  await sdk.initialize();
  
  const batch = new BatchProcessor(sdk);
  
  // Calculate individual amounts
  const operations = recipients.map(r => ({
    type: 'deposit-withdraw' as const,
    amount: Math.floor(totalAmount * (r.percentage / 100)),
    recipient: r.address,
    pool: 'SOL-0.1', // Use smallest pool for flexibility
  }));
  
  // Execute batch with maximum privacy
  const result = await batch.execute(operations, {
    maxBatchSize: 3, // Limit concurrent operations
    delayBetweenBatches: 5000, // 5 second delay
    shuffleOrder: true, // Randomize execution order
    useRelayer: true, // Use relayer for better privacy
  });
  
  console.log('Split payment complete:', result.summary);
  
  return {
    totalSent: totalAmount,
    recipients: recipients.length,
    txHashes: result.transactions.map(t => t.hash),
  };
}

// Usage
await splitPayment(10_000_000_000, [ // 10 SOL
  { address: 'Creator1...', percentage: 60 },
  { address: 'Creator2...', percentage: 30 },
  { address: 'Platform...', percentage: 10 },
]);`}</code>
        </pre>
      </section>

      <section>
        <h2 id="react-hook">React Hook Integration</h2>
        <p>Complete React integration with hooks and context.</p>
        <pre className={styles.codeBlock}>
          <code>{`// hooks/usePRVCSH.ts
'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PRVCSHBrowser } from '@prvcsh/sdk-wrapper';

export function usePRVCSH() {
  const { publicKey, signTransaction } = useWallet();
  const [sdk, setSdk] = useState<PRVCSHBrowser | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [deposits, setDeposits] = useState<string[]>([]);

  const initialize = useCallback(async () => {
    if (sdk || isInitializing) return;
    
    setIsInitializing(true);
    try {
      const instance = new PRVCSHBrowser({
        network: 'mainnet-beta',
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
      });
      await instance.initialize();
      setSdk(instance);
    } finally {
      setIsInitializing(false);
    }
  }, [sdk, isInitializing]);

  const deposit = useCallback(async (amount: number, pool: string) => {
    if (!sdk || !publicKey) throw new Error('Not connected');
    
    const result = await sdk.deposit({ amount, pool });
    
    // Store note securely
    const notes = JSON.parse(localStorage.getItem('privacy_notes') || '[]');
    notes.push({
      note: result.note,
      amount,
      pool,
      timestamp: Date.now(),
    });
    localStorage.setItem('privacy_notes', JSON.stringify(notes));
    
    setDeposits(prev => [...prev, result.note]);
    return result;
  }, [sdk, publicKey]);

  const withdraw = useCallback(async (noteIndex: number, recipient: string) => {
    if (!sdk) throw new Error('SDK not initialized');
    
    const notes = JSON.parse(localStorage.getItem('privacy_notes') || '[]');
    const noteData = notes[noteIndex];
    
    if (!noteData) throw new Error('Note not found');
    
    const result = await sdk.withdraw({
      note: noteData.note,
      recipient,
    });
    
    // Mark note as used
    notes[noteIndex].used = true;
    localStorage.setItem('privacy_notes', JSON.stringify(notes));
    
    return result;
  }, [sdk]);

  const getStoredNotes = useCallback(() => {
    const notes = JSON.parse(localStorage.getItem('privacy_notes') || '[]');
    return notes.filter((n: any) => !n.used);
  }, []);

  return {
    sdk,
    isInitializing,
    initialize,
    deposit,
    withdraw,
    getStoredNotes,
    isConnected: !!publicKey && !!sdk,
  };
}

// components/PrivateWallet.tsx
'use client';

import { usePRVCSH } from '../hooks/usePRVCSH';
import { useEffect, useState } from 'react';

export function PrivateWallet() {
  const {
    isConnected,
    initialize,
    deposit,
    withdraw,
    getStoredNotes,
    isInitializing,
  } = usePRVCSH();
  
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isConnected) {
      setNotes(getStoredNotes());
    }
  }, [isConnected, getStoredNotes]);

  const handleDeposit = async () => {
    const result = await deposit(1_000_000_000, 'SOL-1');
    alert(\`Deposit successful! Save your note: \${result.note.slice(0, 20)}...\`);
    setNotes(getStoredNotes());
  };

  if (isInitializing) return <div>Initializing...</div>;
  if (!isConnected) return <div>Please connect your wallet</div>;

  return (
    <div>
      <h2>Private Wallet</h2>
      
      <button onClick={handleDeposit}>
        Deposit 1 SOL
      </button>
      
      <h3>Available Notes ({notes.length})</h3>
      {notes.map((note, i) => (
        <div key={i}>
          <span>{note.amount / 1e9} SOL ({note.pool})</span>
          <button onClick={() => {
            const recipient = prompt('Enter recipient address:');
            if (recipient) withdraw(i, recipient);
          }}>
            Withdraw
          </button>
        </div>
      ))}
    </div>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="next-api">Next.js API Route Integration</h2>
        <p>Complete backend API for payment processing.</p>
        <pre className={styles.codeBlock}>
          <code>{`// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentLink, verifyWebhookSignature } from '@prvcsh/payments';
import { prisma } from '@/lib/prisma';

const payments = new PaymentLink({
  merchantId: process.env.MERCHANT_ID!,
  apiKey: process.env.PRIVACY_CASH_API_KEY!,
});

// Create new payment
export async function POST(request: NextRequest) {
  const { orderId, amount, currency } = await request.json();
  
  // Get order from database
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  
  // Create payment link
  const link = await payments.create({
    amount,
    currency,
    recipient: process.env.TREASURY_ADDRESS!,
    metadata: {
      orderId,
      userId: order.userId,
    },
    expiresIn: 30 * 60, // 30 minutes
    callbackUrl: \`\${process.env.APP_URL}/api/payments/callback\`,
  });
  
  // Update order with payment info
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentId: link.id,
      paymentStatus: 'pending',
    },
  });
  
  return NextResponse.json({
    paymentId: link.id,
    paymentUrl: link.url,
    expiresAt: link.expiresAt,
  });
}

// app/api/payments/callback/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-prvcsh-signature');
  const timestamp = request.headers.get('x-prvcsh-timestamp');
  const body = await request.text();
  
  // Verify webhook
  const isValid = verifyWebhookSignature({
    payload: body,
    signature: signature!,
    timestamp: timestamp!,
    secret: process.env.WEBHOOK_SECRET!,
  });
  
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  switch (event.type) {
    case 'payment.completed':
      await handlePaymentComplete(event.data);
      break;
    case 'payment.expired':
      await handlePaymentExpired(event.data);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handlePaymentComplete(data: any) {
  const { orderId, txHash, amount } = data.metadata;
  
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'completed',
      paidAmount: amount,
      txHash,
      paidAt: new Date(),
    },
  });
  
  // Send confirmation email, update inventory, etc.
  await sendConfirmationEmail(orderId);
}

async function handlePaymentExpired(data: any) {
  await prisma.order.update({
    where: { id: data.metadata.orderId },
    data: { paymentStatus: 'expired' },
  });
}`}</code>
        </pre>
      </section>

      <section>
        <h2>More Examples</h2>
        <p>
          Find more examples in our GitHub repository:
        </p>
        <ul>
          <li>
            <a href="https://github.com/Privacy-Cash/prvcsh-sdk/tree/main/examples" 
               target="_blank" rel="noopener noreferrer">
              📁 SDK Examples
            </a>
          </li>
          <li>
            <a href="https://github.com/Privacy-Cash/prvcsh-sdk/tree/main/apps/demo" 
               target="_blank" rel="noopener noreferrer">
              🎮 Demo App
            </a>
          </li>
          <li>
            <a href="https://github.com/Privacy-Cash/prvcsh-sdk/tree/main/templates" 
               target="_blank" rel="noopener noreferrer">
              📋 Starter Templates
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}
