/**
 * @fileoverview PRVCSH Documentation Site - Main Page
 * @description Landing page for the documentation site.
 */

import Link from 'next/link';
import styles from './page.module.css';

export default function DocsHome() {
  return (
    <div className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>PRVCSH Documentation</h1>
        <p className={styles.description}>
          Complete privacy solution for Solana blockchain transactions
        </p>
      </header>

      <section className={styles.quickStart}>
        <h2>Quick Start</h2>
        <div className={styles.codeBlock}>
          <code>
            npm install @prvcsh/sdk @prvcsh/react-native
          </code>
        </div>
      </section>

      <nav className={styles.navigation}>
        <div className={styles.cardGrid}>
          <Link href="/docs/getting-started" className={styles.card}>
            <h3>🚀 Getting Started</h3>
            <p>Installation, setup, and first transaction</p>
          </Link>

          <Link href="/docs/sdk" className={styles.card}>
            <h3>📦 SDK Reference</h3>
            <p>Complete API documentation for all packages</p>
          </Link>

          <Link href="/docs/tutorials" className={styles.card}>
            <h3>📖 Tutorials</h3>
            <p>Step-by-step guides for common use cases</p>
          </Link>

          <Link href="/docs/mobile" className={styles.card}>
            <h3>📱 Mobile SDK</h3>
            <p>React Native and Expo integration</p>
          </Link>

          <Link href="/docs/payments" className={styles.card}>
            <h3>💳 Payments API</h3>
            <p>Merchant integration and payment links</p>
          </Link>

          <Link href="/docs/analytics" className={styles.card}>
            <h3>📊 Analytics</h3>
            <p>Dashboard and data aggregation</p>
          </Link>

          <Link href="/docs/security" className={styles.card}>
            <h3>🔐 Security</h3>
            <p>Best practices and audit reports</p>
          </Link>

          <Link href="/docs/examples" className={styles.card}>
            <h3>💡 Examples</h3>
            <p>Sample code and reference implementations</p>
          </Link>
        </div>
      </nav>

      <section className={styles.features}>
        <h2>Key Features</h2>
        <ul className={styles.featureList}>
          <li>
            <strong>Zero-Knowledge Proofs</strong> - Complete transaction privacy using ZK-SNARKs
          </li>
          <li>
            <strong>Multi-Token Support</strong> - SOL, USDC, USDT, and custom SPL tokens
          </li>
          <li>
            <strong>Cross-Platform</strong> - Web, React Native, and Expo support
          </li>
          <li>
            <strong>Merchant APIs</strong> - Easy integration for businesses
          </li>
          <li>
            <strong>Audited Security</strong> - Reviewed by Zigtur security auditors
          </li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <p>
          PRVCSH | 
          <a href="https://github.com/Privacy-Cash" target="_blank" rel="noopener noreferrer"> GitHub</a> | 
          <a href="https://discord.gg/prvcsh" target="_blank" rel="noopener noreferrer"> Discord</a>
        </p>
      </footer>
    </div>
  );
}
