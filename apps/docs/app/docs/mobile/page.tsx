/**
 * @fileoverview Mobile Development Documentation
 * @description React Native and Expo integration guides.
 */

import styles from '../page.module.css';

export const metadata = {
  title: 'Mobile Development - PRVCSH Docs',
  description: 'React Native and Expo integration for PRVCSH',
};

export default function Mobile() {
  return (
    <article className={styles.main}>
      <header>
        <h1>Mobile Development</h1>
        <p className={styles.description}>
          Build privacy-preserving mobile wallets with React Native and Expo.
        </p>
      </header>

      <section>
        <h2>Quick Start</h2>
        <p>Choose your preferred framework:</p>
        <div className={styles.optionCards}>
          <div className={styles.optionCard}>
            <h3>📱 Expo (Recommended)</h3>
            <p>Fastest way to build and deploy mobile apps.</p>
            <code>npx expo install expo-prvcsh</code>
          </div>
          <div className={styles.optionCard}>
            <h3>⚛️ React Native CLI</h3>
            <p>Full control over native code.</p>
            <code>npm install @prvcsh/react-native</code>
          </div>
        </div>
      </section>

      <section>
        <h2 id="expo-setup">Expo Setup</h2>
        
        <h3>Step 1: Install Dependencies</h3>
        <pre className={styles.codeBlock}>
          <code>{`npx expo install expo-prvcsh expo-secure-store expo-local-authentication expo-camera`}</code>
        </pre>

        <h3>Step 2: Configure app.json</h3>
        <pre className={styles.codeBlock}>
          <code>{`{
  "expo": {
    "name": "My Privacy Wallet",
    "plugins": [
      [
        "expo-prvcsh",
        {
          "enableBiometrics": true,
          "enableQRScanner": true,
          "enablePushNotifications": true,
          "network": "mainnet-beta"
        }
      ],
      "expo-secure-store",
      "expo-local-authentication",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to scan QR codes"
        }
      ]
    ]
  }
}`}</code>
        </pre>

        <h3>Step 3: Wrap Your App</h3>
        <pre className={styles.codeBlock}>
          <code>{`// App.tsx
import { PRVCSHProvider } from 'expo-prvcsh';

export default function App() {
  return (
    <PRVCSHProvider
      config={{
        network: 'mainnet-beta',
        rpcUrl: process.env.EXPO_PUBLIC_RPC_URL,
      }}
    >
      <Navigator />
    </PRVCSHProvider>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="rn-setup">React Native CLI Setup</h2>

        <h3>Step 1: Install Dependencies</h3>
        <pre className={styles.codeBlock}>
          <code>{`npm install @prvcsh/react-native
npm install react-native-keychain react-native-biometrics react-native-camera

# iOS
cd ios && pod install && cd ..`}</code>
        </pre>

        <h3>Step 2: iOS Configuration (Info.plist)</h3>
        <pre className={styles.codeBlock}>
          <code>{`<key>NSFaceIDUsageDescription</key>
<string>Enable Face ID for secure access to your wallet</string>
<key>NSCameraUsageDescription</key>
<string>Scan QR codes to send and receive payments</string>`}</code>
        </pre>

        <h3>Step 3: Android Configuration (AndroidManifest.xml)</h3>
        <pre className={styles.codeBlock}>
          <code>{`<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />`}</code>
        </pre>
      </section>

      <section>
        <h2 id="wallet">Wallet Management</h2>

        <h3>Create/Connect Wallet</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { useWallet } from '@prvcsh/react-native';

function WalletScreen() {
  const {
    connect,
    disconnect,
    isConnected,
    publicKey,
    balance,
  } = useWallet();

  const handleConnect = async () => {
    try {
      // This opens the wallet connection modal
      await connect();
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    }
  };

  if (isConnected) {
    return (
      <View>
        <Text>Connected: {publicKey?.slice(0, 8)}...</Text>
        <Text>Balance: {(balance / 1e9).toFixed(4)} SOL</Text>
        <Button title="Disconnect" onPress={disconnect} />
      </View>
    );
  }

  return (
    <View>
      <Button title="Connect Wallet" onPress={handleConnect} />
    </View>
  );
}`}</code>
        </pre>

        <h3>Using ConnectButton Component</h3>
        <pre className={styles.codeBlock}>
          <code>{`import { ConnectButton } from '@prvcsh/react-native';

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>My Wallet</Text>
      <ConnectButton
        theme="dark"
        size="medium"
        showBalance={true}
        onConnect={(wallet) => console.log('Connected:', wallet)}
        onDisconnect={() => console.log('Disconnected')}
      />
    </View>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="biometric">Biometric Authentication</h2>
        <pre className={styles.codeBlock}>
          <code>{`import { useBiometrics } from '@prvcsh/react-native';

function SecureAction() {
  const {
    isAvailable,
    biometryType, // 'Face ID', 'Touch ID', 'Fingerprint'
    authenticate,
  } = useBiometrics();

  const handleSecureAction = async () => {
    if (!isAvailable) {
      Alert.alert('Biometrics not available');
      return;
    }

    const result = await authenticate({
      promptMessage: 'Authenticate to withdraw funds',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      // Proceed with withdrawal
      await performWithdrawal();
    } else {
      Alert.alert('Authentication failed', result.error);
    }
  };

  return (
    <TouchableOpacity onPress={handleSecureAction}>
      <Text>Withdraw (requires {biometryType})</Text>
    </TouchableOpacity>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="qr-scanner">QR Code Scanner</h2>
        <pre className={styles.codeBlock}>
          <code>{`import { QRScanner, QRGenerator } from '@prvcsh/react-native';

// Scan a payment request
function ScanScreen() {
  const handleScan = async (data: string) => {
    // Parse PRVCSH payment URL
    const payment = parsePaymentUrl(data);
    
    if (payment) {
      navigation.navigate('ConfirmPayment', {
        recipient: payment.recipient,
        amount: payment.amount,
      });
    }
  };

  return (
    <QRScanner
      onScan={handleScan}
      flashMode="off"
      showFrame={true}
      frameColor="#00ff00"
      instructions="Scan a PRVCSH QR code"
    />
  );
}

// Generate a receive QR code
function ReceiveScreen() {
  const { publicKey } = useWallet();
  
  const paymentUrl = \`privacycash://pay?to=\${publicKey}&amount=1000000000\`;
  
  return (
    <View style={styles.container}>
      <Text>Scan to send me SOL</Text>
      <QRGenerator
        value={paymentUrl}
        size={250}
        logo={require('./assets/logo.png')}
        logoSize={50}
        backgroundColor="#ffffff"
        color="#000000"
      />
      <Text selectable>{publicKey}</Text>
    </View>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="secure-storage">Secure Storage</h2>
        <pre className={styles.codeBlock}>
          <code>{`import { SecureStorage } from '@prvcsh/react-native';

const storage = new SecureStorage({
  service: 'com.myapp.wallet',
  // iOS Keychain accessibility
  accessibility: 'when_unlocked_this_device_only',
});

// Store a deposit note (encrypted, biometric protected)
async function saveNote(note: string) {
  await storage.setItem('deposit_note_1', note, {
    requireBiometric: true,
    biometricPrompt: 'Authenticate to save note',
  });
}

// Retrieve note (will prompt for biometric)
async function getNote(): Promise<string | null> {
  return storage.getItem('deposit_note_1');
}

// List all stored items
async function listNotes(): Promise<string[]> {
  return storage.getAllKeys();
}

// Delete a note
async function deleteNote(key: string) {
  await storage.removeItem(key);
}

// Clear all stored data
async function clearAll() {
  await storage.clear();
}`}</code>
        </pre>
      </section>

      <section>
        <h2 id="notifications">Push Notifications</h2>
        <pre className={styles.codeBlock}>
          <code>{`import { NotificationService } from '@prvcsh/react-native';

// Initialize notifications
const notifications = new NotificationService({
  apiUrl: process.env.EXPO_PUBLIC_NOTIFICATION_API,
});

// Register for push notifications
async function registerNotifications() {
  const token = await notifications.register();
  
  // Send token to your server
  await fetch('/api/register-device', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// Subscribe to transaction updates
async function subscribeToTransactions(walletAddress: string) {
  await notifications.subscribe({
    topic: \`wallet:\${walletAddress}\`,
    events: ['deposit', 'withdrawal', 'payment_received'],
  });
}

// Handle incoming notifications
notifications.onNotification((notification) => {
  switch (notification.type) {
    case 'deposit_confirmed':
      Alert.alert('Deposit Confirmed', \`\${notification.amount} SOL deposited\`);
      break;
    case 'payment_received':
      Alert.alert('Payment Received!', notification.message);
      break;
  }
});`}</code>
        </pre>
      </section>

      <section>
        <h2 id="complete-example">Complete Wallet Example</h2>
        <pre className={styles.codeBlock}>
          <code>{`// screens/WalletScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import {
  useWallet,
  useBalance,
  usePrivateMixer,
  SecureStorage,
  useBiometrics,
} from '@prvcsh/react-native';

export function WalletScreen() {
  const { publicKey, isConnected } = useWallet();
  const { balance, shieldedBalance, refresh } = useBalance();
  const { deposit, withdraw, getDepositNotes } = usePrivateMixer();
  const { authenticate } = useBiometrics();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    loadNotes();
  }, [isConnected]);

  const loadNotes = async () => {
    if (isConnected) {
      const storedNotes = await getDepositNotes();
      setNotes(storedNotes);
    }
  };

  const handleDeposit = async () => {
    try {
      const result = await deposit({
        amount: 1_000_000_000, // 1 SOL
        pool: 'SOL-1',
      });
      
      Alert.alert('Success', 'Deposit initiated!');
      await loadNotes();
      await refresh();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleWithdraw = async (note: any) => {
    // Require biometric auth for withdrawals
    const auth = await authenticate({
      promptMessage: 'Authenticate to withdraw',
    });
    
    if (!auth.success) {
      Alert.alert('Authentication required');
      return;
    }

    try {
      const recipient = await promptForAddress();
      
      const result = await withdraw({
        note: note.data,
        recipient,
      });
      
      Alert.alert('Success', 'Withdrawal complete!');
      await loadNotes();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>
          {((balance + shieldedBalance) / 1e9).toFixed(4)} SOL
        </Text>
        <View style={styles.balanceRow}>
          <Text>Public: {(balance / 1e9).toFixed(4)}</Text>
          <Text>Shielded: {(shieldedBalance / 1e9).toFixed(4)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.depositBtn} onPress={handleDeposit}>
        <Text style={styles.btnText}>Shield 1 SOL</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Shielded Notes ({notes.length})</Text>
      
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <View>
              <Text>{item.amount / 1e9} SOL</Text>
              <Text style={styles.noteDate}>{item.createdAt}</Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => handleWithdraw(item)}
            >
              <Text>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No shielded funds yet</Text>
        }
      />
    </View>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h2>Platform-Specific Notes</h2>
        
        <h3>iOS</h3>
        <ul>
          <li>Minimum iOS version: 13.0</li>
          <li>Keychain sharing requires entitlements</li>
          <li>App Transport Security allows localhost by default</li>
          <li>Face ID requires NSFaceIDUsageDescription</li>
        </ul>

        <h3>Android</h3>
        <ul>
          <li>Minimum SDK version: 23 (Android 6.0)</li>
          <li>Biometrics require API 28+ for BiometricPrompt</li>
          <li>EncryptedSharedPreferences for secure storage</li>
          <li>ProGuard rules included in package</li>
        </ul>
      </section>
    </article>
  );
}
