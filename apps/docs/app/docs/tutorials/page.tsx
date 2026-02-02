/**
 * @fileoverview Tutorials Page
 * @description Step-by-step integration guides.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'Tutorials - PRVCSH Docs',
  description: 'Step-by-step guides for integrating PRVCSH',
};

export default function Tutorials() {
  return (
    <article className={styles.main}>
      <header>
        <h1>Tutorials</h1>
        <p className={styles.description}>
          Step-by-step guides for common integration scenarios.
        </p>
      </header>

      <nav className={styles.toc}>
        <h2>Available Tutorials</h2>
        <ul>
          <li><a href="#basic-mixer">Basic Mixer Integration</a></li>
          <li><a href="#merchant-payments">Merchant Payment Integration</a></li>
          <li><a href="#mobile-wallet">Mobile Wallet App</a></li>
          <li><a href="#analytics-dashboard">Custom Analytics Dashboard</a></li>
          <li><a href="#batch-processing">Batch Processing Setup</a></li>
        </ul>
      </nav>

      <section id="basic-mixer">
        <h2>Tutorial 1: Basic Mixer Integration</h2>
        <p>Build a simple privacy mixer in a React application.</p>

        <h3>Step 1: Install Dependencies</h3>
        <pre className={styles.codeBlock}>
          <code>{`npm install @prvcsh/sdk-wrapper @solana/wallet-adapter-react @solana/wallet-adapter-wallets`}</code>
        </pre>

        <h3>Step 2: Set Up Wallet Provider</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const wallets = [new PhantomWalletAdapter()];

function App() {
  return (
    <WalletProvider wallets={wallets}>
      <MixerComponent />
    </WalletProvider>
  );
}`}</code>
        </pre>

        <h3>Step 3: Create Mixer Component</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PRVCSHBrowser } from '@prvcsh/sdk-wrapper';

function MixerComponent() {
  const wallet = useWallet();
  const [privacyCash, setPRVCSH] = useState(null);
  const [balance, setBalance] = useState({ public: 0n, shielded: 0n });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet.connected) {
      initializeSDK();
    }
  }, [wallet.connected]);

  const initializeSDK = async () => {
    const sdk = await PRVCSHBrowser.create({
      network: 'devnet',
      wallet: {
        publicKey: wallet.publicKey,
        signMessage: wallet.signMessage,
        signTransaction: wallet.signTransaction,
      },
    });
    await sdk.initializeEncryption();
    setPRVCSH(sdk);
    refreshBalance(sdk);
  };

  const refreshBalance = async (sdk) => {
    const shielded = await sdk.getShieldedBalance();
    setBalance({ shielded });
  };

  const handleDeposit = async (amount) => {
    setLoading(true);
    try {
      const result = await privacyCash.depositSOL({
        amount: BigInt(amount * 1e9),
      });
      console.log('Deposited:', result.signature);
      // Save the note securely!
      localStorage.setItem(\`note_\${result.commitment}\`, result.note);
      await refreshBalance(privacyCash);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount, recipient, note) => {
    setLoading(true);
    try {
      const result = await privacyCash.withdrawSOL({
        amount: BigInt(amount * 1e9),
        recipient,
        note,
      });
      console.log('Withdrawn:', result.signature);
      await refreshBalance(privacyCash);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Privacy Mixer</h2>
      <p>Shielded Balance: {Number(balance.shielded) / 1e9} SOL</p>
      {/* Add UI for deposit/withdraw */}
    </div>
  );
}`}</code>
        </pre>
      </section>

      <section id="merchant-payments">
        <h2>Tutorial 2: Merchant Payment Integration</h2>
        <p>Accept private payments on your e-commerce site.</p>

        <h3>Step 1: Get API Credentials</h3>
        <p>Sign up at merchant.privacycash.app and get your API key and secret.</p>

        <h3>Step 2: Backend Integration</h3>
        <pre className={styles.codeBlock}>
          <code>{`// server.js (Node.js/Express)
import express from 'express';
import { PRVCSHSDK, verifyWebhookSignature } from '@prvcsh/payments';

const app = express();
app.use(express.json());

const sdk = new PRVCSHSDK({
  apiKey: process.env.PRIVACY_CASH_API_KEY,
  apiSecret: process.env.PRIVACY_CASH_API_SECRET,
  environment: 'production',
});

// Create payment
app.post('/api/create-payment', async (req, res) => {
  const { orderId, amount, currency } = req.body;
  
  const link = await sdk.paymentLinks.create({
    amount,
    currency,
    description: \`Order #\${orderId}\`,
    metadata: { orderId },
    redirectUrl: \`https://yoursite.com/order/\${orderId}/success\`,
    webhookUrl: 'https://yoursite.com/api/webhook',
    expiresIn: 3600, // 1 hour
  });
  
  res.json({ paymentUrl: link.url, paymentId: link.id });
});

// Handle webhook
app.post('/api/webhook', async (req, res) => {
  const signature = req.headers['x-prvcsh-signature'];
  
  if (!verifyWebhookSignature({
    payload: JSON.stringify(req.body),
    signature,
    secret: process.env.WEBHOOK_SECRET,
  })) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { event, data } = req.body;
  
  if (event === 'payment.completed') {
    await markOrderPaid(data.metadata.orderId);
  }
  
  res.json({ received: true });
});`}</code>
        </pre>

        <h3>Step 3: Frontend Integration</h3>
        <pre className={styles.codeBlock}>
          <code>{`// Checkout.jsx
async function handleCheckout() {
  const response = await fetch('/api/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      amount: order.total,
      currency: 'USDC',
    }),
  });
  
  const { paymentUrl } = await response.json();
  
  // Redirect to payment page
  window.location.href = paymentUrl;
}`}</code>
        </pre>
      </section>

      <section id="mobile-wallet">
        <h2>Tutorial 3: Mobile Wallet App</h2>
        <p>Build a mobile wallet with React Native.</p>

        <h3>Step 1: Create Expo Project</h3>
        <pre className={styles.codeBlock}>
          <code>{`npx create-expo-app privacy-wallet
cd privacy-wallet
npx expo install expo-prvcsh`}</code>
        </pre>

        <h3>Step 2: Configure App</h3>
        <pre className={styles.codeBlock}>
          <code>{`// app.config.js
module.exports = {
  expo: {
    plugins: [
      ['expo-prvcsh', {
        biometricAuth: true,
        cameraAccess: true,
      }]
    ],
  },
};`}</code>
        </pre>

        <h3>Step 3: Build Wallet Screen</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { 
  PRVCSHProvider,
  useExpoWallet,
  useBalance,
  ConnectButton,
  BalanceDisplay,
  SendForm,
  QRScanner,
} from 'expo-prvcsh';

function App() {
  return (
    <PRVCSHProvider network="mainnet-beta" config={{ biometricAuth: true }}>
      <WalletScreen />
    </PRVCSHProvider>
  );
}

function WalletScreen() {
  const { connected, publicKey } = useExpoWallet();
  const balance = useBalance({ publicKey });
  const [showScanner, setShowScanner] = useState(false);

  if (!connected) {
    return <ConnectButton />;
  }

  return (
    <View style={styles.container}>
      <BalanceDisplay publicKey={publicKey} />
      
      <SendForm onSuccess={() => Alert.alert('Sent!')} />
      
      <Button title="Scan QR" onPress={() => setShowScanner(true)} />
      
      {showScanner && (
        <QRScanner
          onScan={(result) => {
            if (result.type === 'solana-pay') {
              handlePayment(result.solanaPay);
            }
            setShowScanner(false);
          }}
        />
      )}
    </View>
  );
}`}</code>
        </pre>
      </section>

      <section id="analytics-dashboard">
        <h2>Tutorial 4: Custom Analytics Dashboard</h2>
        <p>Build a custom analytics dashboard for your dApp.</p>

        <pre className={styles.codeBlock}>
          <code>{`import { 
  DataAggregator, 
  ChartDataGenerator,
  VolumeChart,
  TVLChart,
  MetricCard,
} from '@prvcsh/analytics';

function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const aggregator = new DataAggregator({
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      programId: 'YourProgramId...',
    });
    
    aggregator.start();
    
    const interval = setInterval(() => {
      setMetrics(aggregator.getMetrics('24h'));
    }, 5000);
    
    return () => {
      aggregator.stop();
      clearInterval(interval);
    };
  }, []);

  if (!metrics) return <Loading />;

  return (
    <div className="dashboard">
      <div className="metrics-row">
        <MetricCard
          title="24h Volume"
          value={formatSOL(metrics.depositVolume + metrics.withdrawalVolume)}
          change={calculateChange(metrics)}
          trend="up"
        />
        <MetricCard
          title="Total TVL"
          value={formatSOL(metrics.totalTVL)}
        />
        <MetricCard
          title="Unique Users"
          value={metrics.uniqueDepositors}
        />
      </div>
      
      <VolumeChart timeRange="7d" />
      <TVLChart timeRange="30d" />
    </div>
  );
}`}</code>
        </pre>
      </section>

      <section id="batch-processing">
        <h2>Tutorial 5: Batch Processing Setup</h2>
        <p>Reduce costs with batch processing for high-volume applications.</p>

        <pre className={styles.codeBlock}>
          <code>{`import { BatchProcessor, ScheduledTransactions } from '@prvcsh/batch';

// Initialize processor
const processor = new BatchProcessor({
  maxBatchSize: 20,
  maxWaitTime: 60000, // 1 minute
  gasStrategy: 'economic',
  onBatchComplete: (result) => {
    console.log(\`Batch completed: \${result.successCount}/\${result.totalCount}\`);
    console.log(\`Gas saved: \${result.gasSaved} lamports\`);
  },
});

// Scheduled transaction manager
const scheduler = new ScheduledTransactions({
  processor,
  persistPath: './scheduled.json',
});

// Add deposits from multiple users
async function processUserDeposits(users) {
  const operationIds = [];
  
  for (const user of users) {
    const opId = processor.addDeposit({
      amount: user.amount,
      pool: 'sol-1',
      sender: user.publicKey,
      priority: 'normal',
      onComplete: (result) => {
        notifyUser(user.id, result);
      },
    });
    operationIds.push(opId);
  }
  
  // Wait for batch or execute immediately if enough operations
  if (processor.pendingCount >= 10) {
    await processor.executeBatch();
  }
  
  return operationIds;
}

// Schedule future transactions
scheduler.schedule({
  type: 'withdrawal',
  amount: 10_000_000_000n,
  recipient: 'Recipient...',
  executeAt: new Date('2026-02-15T10:00:00Z'),
});`}</code>
        </pre>
      </section>
    </article>
  );
}
