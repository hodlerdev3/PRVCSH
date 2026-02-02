/**
 * @fileoverview Getting Started Guide
 * @description Installation and setup guide for PRVCSH SDK.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'Getting Started - PRVCSH Docs',
  description: 'Learn how to install and set up the PRVCSH SDK',
};

export default function GettingStarted() {
  return (
    <article className={styles.main}>
      <header>
        <h1>Getting Started with PRVCSH</h1>
        <p className={styles.description}>
          This guide will walk you through installing the PRVCSH SDK and making your first private transaction.
        </p>
      </header>

      <section>
        <h2 id="installation">Installation</h2>
        <p>Install the core SDK package:</p>
        <pre className={styles.codeBlock}>
          <code>npm install privacycash @prvcsh/sdk-wrapper</code>
        </pre>
        <p>For React Native projects:</p>
        <pre className={styles.codeBlock}>
          <code>npm install @prvcsh/react-native</code>
        </pre>
        <p>For Expo projects:</p>
        <pre className={styles.codeBlock}>
          <code>npx expo install expo-prvcsh</code>
        </pre>
      </section>

      <section>
        <h2 id="setup">Basic Setup</h2>
        <h3>Web Application</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { PRVCSHBrowser } from '@prvcsh/sdk-wrapper';
import { useWallet } from '@solana/wallet-adapter-react';

function App() {
  const wallet = useWallet();
  
  const initializePRVCSH = async () => {
    const privacyCash = await PRVCSHBrowser.create({
      network: 'mainnet-beta',
      wallet: {
        publicKey: wallet.publicKey,
        signMessage: wallet.signMessage,
        signTransaction: wallet.signTransaction,
      },
    });
    
    // Initialize encryption (one-time setup)
    await privacyCash.initializeEncryption();
    
    return privacyCash;
  };
}`}</code>
        </pre>

        <h3>React Native</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { PRVCSHProvider, usePRVCSH } from '@prvcsh/react-native';

function App() {
  return (
    <PRVCSHProvider network="mainnet-beta">
      <HomeScreen />
    </PRVCSHProvider>
  );
}

function HomeScreen() {
  const { deposit, withdraw, balance } = usePRVCSH();
  
  return (
    <View>
      <Text>Shielded Balance: {balance.shielded.sol}</Text>
      <Button onPress={() => deposit(1_000_000_000n)} title="Deposit 1 SOL" />
    </View>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="first-deposit">Your First Deposit</h2>
        <pre className={styles.codeBlock}>
          <code>{`// Deposit 1 SOL into the privacy pool
const depositResult = await privacyCash.depositSOL({
  amount: 1_000_000_000n, // 1 SOL in lamports
  pool: 'sol-1', // 1 SOL pool for larger anonymity set
});

console.log('Deposit signature:', depositResult.signature);
console.log('Deposit note (save this!):', depositResult.note);`}</code>
        </pre>
        <p>
          <strong>⚠️ Important:</strong> Save your deposit note securely! 
          This is required to withdraw your funds later.
        </p>
      </section>

      <section>
        <h2 id="first-withdrawal">Your First Withdrawal</h2>
        <pre className={styles.codeBlock}>
          <code>{`// Withdraw 1 SOL to any address
const withdrawResult = await privacyCash.withdrawSOL({
  amount: 1_000_000_000n,
  recipient: 'RecipientAddress...',
  note: depositNote, // The note from deposit
});

console.log('Withdrawal signature:', withdrawResult.signature);`}</code>
        </pre>
      </section>

      <section>
        <h2 id="pools">Available Pools</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pool ID</th>
              <th>Token</th>
              <th>Amount</th>
              <th>Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sol-0.1</code></td>
              <td>SOL</td>
              <td>0.1 SOL</td>
              <td>Small transactions</td>
            </tr>
            <tr>
              <td><code>sol-1</code></td>
              <td>SOL</td>
              <td>1 SOL</td>
              <td>Medium transactions</td>
            </tr>
            <tr>
              <td><code>sol-10</code></td>
              <td>SOL</td>
              <td>10 SOL</td>
              <td>Large transactions</td>
            </tr>
            <tr>
              <td><code>sol-100</code></td>
              <td>SOL</td>
              <td>100 SOL</td>
              <td>Whale transactions</td>
            </tr>
            <tr>
              <td><code>usdc-100</code></td>
              <td>USDC</td>
              <td>100 USDC</td>
              <td>Stable transactions</td>
            </tr>
            <tr>
              <td><code>usdc-1000</code></td>
              <td>USDC</td>
              <td>1000 USDC</td>
              <td>Large stable transactions</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 id="next-steps">Next Steps</h2>
        <ul>
          <li>📖 Read the <a href="/docs/sdk">SDK Reference</a> for complete API documentation</li>
          <li>📱 Set up <a href="/docs/mobile">Mobile SDK</a> for React Native or Expo</li>
          <li>💳 Integrate <a href="/docs/payments">Payments API</a> for your business</li>
          <li>🔐 Review <a href="/docs/security">Security Best Practices</a></li>
        </ul>
      </section>
    </article>
  );
}
