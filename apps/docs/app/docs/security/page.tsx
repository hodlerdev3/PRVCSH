/**
 * @fileoverview Security Documentation
 * @description Security best practices and audit information.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'Security - PRVCSH Docs',
  description: 'Security best practices and audit information for PRVCSH',
};

export default function Security() {
  return (
    <article className={styles.main}>
      <header>
        <h1>Security</h1>
        <p className={styles.description}>
          Security best practices, audit reports, and responsible disclosure.
        </p>
      </header>

      <section>
        <h2 id="audit">Security Audit</h2>
        <div className={styles.auditBadge}>
          <span>✅ Audited by Zigtur</span>
        </div>
        <p>
          The PRVCSH SDK has been audited by <strong>Zigtur Security</strong>, 
          a leading blockchain security firm. The audit covered:
        </p>
        <ul>
          <li>Zero-knowledge circuit implementations</li>
          <li>Smart contract security</li>
          <li>Cryptographic primitives (Poseidon hash, EdDSA)</li>
          <li>WASM module security</li>
          <li>Key derivation and storage</li>
        </ul>
        <p>
          <a href="https://github.com/Privacy-Cash/prvcsh-sdk/blob/main/audits/zigtur-2025.pdf" 
             target="_blank" rel="noopener noreferrer">
            📄 View Full Audit Report
          </a>
        </p>
      </section>

      <section>
        <h2 id="best-practices">Security Best Practices</h2>

        <h3>🔐 Key Management</h3>
        <ul>
          <li>
            <strong>Never store private keys in plain text</strong> - Use secure storage 
            (Keychain on iOS, EncryptedSharedPreferences on Android)
          </li>
          <li>
            <strong>Enable biometric authentication</strong> - Require Face ID/Touch ID 
            for sensitive operations
          </li>
          <li>
            <strong>Derive keys from wallet signature</strong> - Don&apos;t generate separate 
            keys; derive from the user&apos;s wallet signature
          </li>
        </ul>

        <h3>📝 Note Storage</h3>
        <ul>
          <li>
            <strong>Encrypt deposit notes</strong> - Notes contain information needed 
            for withdrawal; encrypt them at rest
          </li>
          <li>
            <strong>Back up notes securely</strong> - If notes are lost, funds cannot 
            be recovered
          </li>
          <li>
            <strong>Never transmit notes over insecure channels</strong> - Use end-to-end 
            encrypted messaging if sharing
          </li>
        </ul>

        <h3>🌐 Network Security</h3>
        <ul>
          <li>
            <strong>Use HTTPS only</strong> - All API calls should use TLS 1.3
          </li>
          <li>
            <strong>Verify RPC endpoints</strong> - Only use trusted Solana RPC providers
          </li>
          <li>
            <strong>Pin SSL certificates</strong> - In mobile apps, implement certificate pinning
          </li>
        </ul>

        <h3>🔒 Transaction Security</h3>
        <ul>
          <li>
            <strong>Verify recipient addresses</strong> - Double-check addresses before withdrawal
          </li>
          <li>
            <strong>Set appropriate timeouts</strong> - Don&apos;t leave payment links open indefinitely
          </li>
          <li>
            <strong>Monitor for unusual activity</strong> - Implement rate limiting and anomaly detection
          </li>
        </ul>
      </section>

      <section>
        <h2 id="threat-model">Threat Model</h2>
        
        <h3>What PRVCSH Protects Against</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Threat</th>
              <th>Protection</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>On-chain transaction tracing</td>
              <td>✅ ZK proofs break the link between deposits and withdrawals</td>
            </tr>
            <tr>
              <td>Balance surveillance</td>
              <td>✅ Shielded balances are encrypted</td>
            </tr>
            <tr>
              <td>Timing analysis</td>
              <td>✅ Variable delay pools and relayer batching</td>
            </tr>
            <tr>
              <td>Amount correlation</td>
              <td>✅ Fixed denomination pools prevent amount matching</td>
            </tr>
          </tbody>
        </table>

        <h3>Limitations</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Threat</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>IP address logging by RPC</td>
              <td>⚠️ Use Tor or VPN for maximum privacy</td>
            </tr>
            <tr>
              <td>Device fingerprinting</td>
              <td>⚠️ Outside SDK scope; use privacy browsers</td>
            </tr>
            <tr>
              <td>Social engineering</td>
              <td>⚠️ User education required</td>
            </tr>
            <tr>
              <td>Compromised device</td>
              <td>⚠️ Device security is user responsibility</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 id="implementation">Secure Implementation Examples</h2>

        <h3>Secure Key Storage (React Native)</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { SecureStorage } from '@prvcsh/react-native';

const storage = new SecureStorage({
  service: 'com.yourapp',
  accessibility: 'when_unlocked_this_device_only',
});

// Store encrypted note
await storage.setItem('deposit_note', encryptedNote, {
  requireBiometric: true,
});

// Retrieve with biometric auth
const note = await storage.getItem('deposit_note');`}</code>
        </pre>

        <h3>Webhook Signature Verification</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { verifyWebhookSignature } from '@prvcsh/payments';
import crypto from 'crypto';

function handleWebhook(req, res) {
  const signature = req.headers['x-prvcsh-signature'];
  const timestamp = req.headers['x-prvcsh-timestamp'];
  
  // Check timestamp freshness (prevent replay attacks)
  const age = Date.now() - parseInt(timestamp);
  if (age > 300000) { // 5 minutes
    return res.status(401).json({ error: 'Timestamp too old' });
  }
  
  // Verify signature
  const isValid = verifyWebhookSignature({
    payload: req.rawBody,
    signature,
    timestamp,
    secret: process.env.WEBHOOK_SECRET,
  });
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="disclosure">Responsible Disclosure</h2>
        <p>
          If you discover a security vulnerability in PRVCSH, please report it responsibly:
        </p>
        <ul>
          <li>📧 Email: <a href="mailto:security@privacycash.app">security@privacycash.app</a></li>
          <li>🔐 PGP Key: <a href="/security/pgp-key.asc">Download PGP Key</a></li>
          <li>💰 Bug Bounty: Up to $50,000 for critical vulnerabilities</li>
        </ul>
        <p>
          <strong>Please do not:</strong>
        </p>
        <ul>
          <li>Publicly disclose vulnerabilities before we&apos;ve had time to fix them</li>
          <li>Access or modify other users&apos; data</li>
          <li>Perform denial of service attacks</li>
        </ul>
        <p>
          We commit to acknowledging reports within 24 hours and providing a fix timeline 
          within 72 hours for critical issues.
        </p>
      </section>

      <section>
        <h2 id="compliance">Compliance</h2>
        <p>
          PRVCSH is designed with regulatory compliance in mind:
        </p>
        <ul>
          <li>
            <strong>Travel Rule Support</strong> - Optional metadata for regulated entities
          </li>
          <li>
            <strong>Audit Trail</strong> - Merchants can maintain records while preserving user privacy
          </li>
          <li>
            <strong>Selective Disclosure</strong> - Users can prove transaction history if required
          </li>
        </ul>
      </section>
    </article>
  );
}
