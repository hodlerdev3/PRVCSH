/**
 * @fileoverview SDK API Reference
 * @description Complete API documentation for PRVCSH SDK.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'SDK Reference - PRVCSH Docs',
  description: 'Complete API reference for PRVCSH SDK packages',
};

export default function SDKReference() {
  return (
    <article className={styles.main}>
      <header>
        <h1>SDK Reference</h1>
        <p className={styles.description}>
          Complete API documentation for all PRVCSH SDK packages.
        </p>
      </header>

      <nav className={styles.toc}>
        <h2>Packages</h2>
        <ul>
          <li><a href="#sdk-wrapper">@prvcsh/sdk-wrapper</a></li>
          <li><a href="#react-native">@prvcsh/react-native</a></li>
          <li><a href="#payments">@prvcsh/payments</a></li>
          <li><a href="#analytics">@prvcsh/analytics</a></li>
          <li><a href="#batch">@prvcsh/batch</a></li>
        </ul>
      </nav>

      <section id="sdk-wrapper">
        <h2>@prvcsh/sdk-wrapper</h2>
        <p>Browser-compatible wrapper for the PRVCSH SDK with WASM support.</p>

        <h3>PRVCSHBrowser</h3>
        <pre className={styles.codeBlock}>
          <code>{`interface PRVCSHBrowserConfig {
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  wallet: {
    publicKey: PublicKey;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  };
  rpcUrl?: string;
  relayerUrl?: string;
}

class PRVCSHBrowser {
  static create(config: PRVCSHBrowserConfig): Promise<PRVCSHBrowser>;
  
  initializeEncryption(): Promise<void>;
  
  depositSOL(params: {
    amount: bigint;
    pool?: PoolId;
  }): Promise<DepositResult>;
  
  depositSPL(params: {
    mint: string;
    amount: bigint;
    pool?: PoolId;
  }): Promise<DepositResult>;
  
  withdrawSOL(params: {
    amount: bigint;
    recipient: string;
    note: string;
  }): Promise<WithdrawResult>;
  
  withdrawSPL(params: {
    mint: string;
    amount: bigint;
    recipient: string;
    note: string;
  }): Promise<WithdrawResult>;
  
  getShieldedBalance(currency?: Currency): Promise<bigint>;
  getPoolStats(pool: PoolId): Promise<PoolStats>;
  getNotes(): Promise<Note[]>;
}`}</code>
        </pre>

        <h3>Types</h3>
        <pre className={styles.codeBlock}>
          <code>{`type PoolId = 
  | 'sol-0.1' | 'sol-1' | 'sol-10' | 'sol-100'
  | 'usdc-100' | 'usdc-1000';

type Currency = 'SOL' | 'USDC' | 'USDT';

interface DepositResult {
  signature: string;
  note: string;
  commitment: string;
  slot: number;
}

interface WithdrawResult {
  signature: string;
  nullifier: string;
  slot: number;
}

interface PoolStats {
  pool: PoolId;
  tvl: bigint;
  anonymitySet: number;
  recentDeposits: number;
  recentWithdrawals: number;
}`}</code>
        </pre>
      </section>

      <section id="react-native">
        <h2>@prvcsh/react-native</h2>
        <p>React Native wrapper with hooks and components.</p>

        <h3>Provider</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { PRVCSHProvider } from '@prvcsh/react-native';

<PRVCSHProvider
  network="mainnet-beta"
  config={{
    autoConnect: true,
    biometricAuth: true,
    secureStorage: true,
  }}
>
  <App />
</PRVCSHProvider>`}</code>
        </pre>

        <h3>Hooks</h3>
        <pre className={styles.codeBlock}>
          <code>{`// Wallet hook
const { 
  connected, 
  connecting, 
  publicKey, 
  connect, 
  disconnect,
  signMessage,
} = useWallet();

// Balance hook
const { 
  sol, 
  tokens, 
  loading, 
  refresh,
} = useBalance({ publicKey });

// Transaction hook
const {
  transactions,
  pending,
  loading,
  loadMore,
  refresh,
} = useTransactions({ publicKey });

// Payment hook
const {
  pay,
  paying,
  error,
} = usePayment();

// Biometric hook
const {
  available,
  biometryType,
  authenticate,
} = useBiometricAuth();`}</code>
        </pre>

        <h3>Components</h3>
        <pre className={styles.codeBlock}>
          <code>{`import {
  ConnectButton,
  BalanceDisplay,
  TransactionList,
  SendForm,
  PaymentQRCode,
  QRScanner,
} from '@prvcsh/react-native';

// Connect button with wallet selection
<ConnectButton 
  onConnect={(publicKey) => console.log('Connected:', publicKey)}
/>

// Balance display with tokens
<BalanceDisplay 
  publicKey={publicKey} 
  showTokens={true}
/>

// Transaction list with pagination
<TransactionList
  publicKey={publicKey}
  onTransactionPress={(tx) => console.log(tx)}
/>

// Send form
<SendForm
  onSuccess={(signature) => console.log('Sent:', signature)}
/>

// Payment QR code
<PaymentQRCode
  recipient={merchantAddress}
  amount={10}
  label="Coffee Shop"
/>

// QR Scanner
<QRScanner
  onScan={(result) => handlePayment(result)}
/>`}</code>
        </pre>
      </section>

      <section id="payments">
        <h2>@prvcsh/payments</h2>
        <p>Merchant API for payment processing.</p>

        <h3>MerchantSDK</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { PRVCSHSDK } from '@prvcsh/payments';

const sdk = new PRVCSHSDK({
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret',
  environment: 'production',
});

// Create payment link
const link = await sdk.paymentLinks.create({
  amount: 10.00,
  currency: 'USDC',
  description: 'Order #1234',
  redirectUrl: 'https://yoursite.com/success',
  webhookUrl: 'https://yoursite.com/webhook',
});

// Create invoice
const invoice = await sdk.invoices.create({
  merchantId: 'merchant_123',
  amount: 100.00,
  currency: 'USDC',
  dueDate: new Date('2026-03-01'),
  items: [
    { description: 'Widget', quantity: 2, unitPrice: 50 },
  ],
});

// Process refund
const refund = await sdk.refunds.create({
  paymentId: 'payment_123',
  amount: 25.00,
  reason: 'customer_request',
});`}</code>
        </pre>

        <h3>Webhooks</h3>
        <pre className={styles.codeBlock}>
          <code>{`// Webhook event types
type WebhookEvent = 
  | 'payment.created'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.expired'
  | 'refund.created'
  | 'refund.completed'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue';

// Verify webhook signature
import { verifyWebhookSignature } from '@prvcsh/payments';

const isValid = verifyWebhookSignature({
  payload: request.body,
  signature: request.headers['x-prvcsh-signature'],
  secret: webhookSecret,
});`}</code>
        </pre>
      </section>

      <section id="analytics">
        <h2>@prvcsh/analytics</h2>
        <p>On-chain data aggregation and visualization.</p>

        <h3>DataAggregator</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { DataAggregator } from '@prvcsh/analytics';

const aggregator = new DataAggregator({
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  programId: 'PRVCSH...',
  pollingInterval: 5000,
});

await aggregator.start();

// Get metrics
const metrics = aggregator.getMetrics('7d');
console.log('Total Volume:', metrics.depositVolume + metrics.withdrawalVolume);

// Get TVL
const tvl = aggregator.getTotalTVL();

// Get pool breakdown
const pools = aggregator.getPoolMetrics();

// Get network health
const health = aggregator.getNetworkHealth();`}</code>
        </pre>

        <h3>React Components</h3>
        <pre className={styles.codeBlock}>
          <code>{`import {
  AnalyticsDashboard,
  VolumeChart,
  TVLChart,
  PoolDistribution,
  NetworkHealth,
} from '@prvcsh/analytics';

// Full dashboard
<AnalyticsDashboard />

// Individual charts
<VolumeChart timeRange="7d" />
<TVLChart timeRange="30d" />
<PoolDistribution />
<NetworkHealth />`}</code>
        </pre>
      </section>

      <section id="batch">
        <h2>@prvcsh/batch</h2>
        <p>Batch processing for cost optimization.</p>

        <h3>BatchProcessor</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { BatchProcessor } from '@prvcsh/batch';

const processor = new BatchProcessor({
  maxBatchSize: 10,
  maxWaitTime: 30000,
  gasStrategy: 'economic',
});

// Add operations
const opId1 = processor.addDeposit({
  amount: 1_000_000_000n,
  pool: 'sol-1',
  sender: publicKey,
});

const opId2 = processor.addDeposit({
  amount: 1_000_000_000n,
  pool: 'sol-1',
  sender: anotherPublicKey,
});

// Execute batch
const result = await processor.executeBatch();
console.log('Success:', result.successCount);
console.log('Gas saved:', result.gasSaved);

// Schedule for later
processor.schedule({
  type: 'deposit',
  amount: 1_000_000_000n,
  pool: 'sol-1',
  executeAt: new Date('2026-02-10'),
});`}</code>
        </pre>
      </section>
    </article>
  );
}
