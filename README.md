<p align="center">
  <img src="https://img.shields.io/badge/PRVCSH-Zero%20Knowledge%20Privacy-00D4AA?style=for-the-badge&logo=solana&logoColor=white" alt="PRVCSH" />
</p>

<h1 align="center">🔐 PRVCSH</h1>

<p align="center">
  <strong>Zero-Knowledge Privacy Protocol for Solana</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-blueviolet?style=flat-square&logo=solana" alt="Solana" />
  <img src="https://img.shields.io/badge/ZK-Groth16-00D4AA?style=flat-square" alt="ZK-Groth16" />
  <img src="https://img.shields.io/badge/Audit-Zigtur-blue?style=flat-square" alt="Audit" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#packages">Packages</a> •
  <a href="#demo">Demo</a>
</p>

---

## 🎯 What is PRVCSH?

**PRVCSH** is a privacy-preserving financial infrastructure built on Solana using Zero-Knowledge proofs (Groth16). Users can deposit, shield, and withdraw tokens without revealing transaction history — breaking the on-chain link between sender and receiver.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    💰 Deposit          🔐 Shield           💸 Withdraw          │
│    ─────────    →     ─────────    →     ─────────             │
│    Public SOL         ZK Mixer           Private SOL            │
│                                                                 │
│    Your wallet        Zero-Knowledge      Any wallet            │
│    is visible         proof generated     (untraceable)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🛡️ **Zero-Knowledge Proofs** | Groth16 ZK-SNARKs ensure complete transaction privacy |
| ⚡ **Solana Speed** | Sub-second finality with minimal fees (~$0.00025) |
| 🔒 **Non-Custodial** | Your keys, your coins. No third-party trust required |
| 📱 **Multi-Platform** | Web app, React Native SDK, and REST API |
| 💳 **Payment Links** | Generate private payment links for e-commerce |
| 📊 **Analytics** | Privacy-preserving pool statistics and metrics |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/nicholasoxford/PRVCSH.git
cd PRVCSH

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your RPC URL

# Start development server
pnpm run dev --filter=@prvcsh/web
```

### Open the app

Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

```
PRVCSH/
├── apps/
│   ├── web/              # Next.js 16 frontend
│   └── docs/             # Documentation site
├── packages/
│   ├── sdk-wrapper/      # Browser SDK wrapper
│   ├── react-native/     # Mobile SDK
│   ├── payments/         # Payment processing
│   ├── analytics/        # Pool analytics
│   ├── batch/            # Batch transactions
│   ├── dex/              # Private DEX (coming soon)
│   ├── bridge/           # Cross-chain bridge (coming soon)
│   ├── dao/              # Governance (coming soon)
│   └── ui/               # Shared UI components
└── docs/                 # Architecture docs
```

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@prvcsh/sdk-wrapper` | Browser-compatible SDK | ✅ Ready |
| `@prvcsh/react-native` | React Native SDK | ✅ Ready |
| `@prvcsh/payments` | Payment links & webhooks | ✅ Ready |
| `@prvcsh/analytics` | Pool statistics | ✅ Ready |
| `@prvcsh/batch` | Batch transactions | ✅ Ready |
| `@prvcsh/dex` | Private DEX | 🚧 WIP |
| `@prvcsh/bridge` | Cross-chain bridge | 🚧 WIP |
| `@prvcsh/dao` | Governance | 🚧 WIP |

## 💻 Usage

### Web SDK

```typescript
import { PRVCSHBrowser } from '@prvcsh/sdk-wrapper';

const client = new PRVCSHBrowser({
  rpcUrl: 'https://api.devnet.solana.com',
  network: 'devnet',
});

// Initialize with wallet
await client.initializeEncryption(walletAddress, signMessage);

// Deposit SOL
const result = await client.depositSOL({ amount: '1.0' });

// Withdraw to any address
const withdrawal = await client.withdrawSOL({
  amount: '1.0',
  recipient: 'ANY_SOLANA_ADDRESS',
});
```

### React Hook

```tsx
import { usePRVCSH } from '@prvcsh/sdk-wrapper';

function MixerComponent() {
  const { deposit, withdraw, getPrivateBalance } = usePRVCSH({
    config: {
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
      network: 'devnet',
    },
  });

  // Your component logic
}
```

## 🔐 Security

- **Audited by Zigtur Security**
- Non-custodial architecture
- Client-side ZK proof generation
- Encrypted note storage
- No IP logging or tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Blockchain**: Solana, @solana/web3.js
- **ZK Proofs**: Groth16 (circom/snarkjs)
- **Monorepo**: Turborepo + pnpm
- **Mobile**: React Native + Expo

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with 🛡️ for the Solana ecosystem</strong>
</p>

<p align="center">
  <a href="https://github.com/nicholasoxford/PRVCSH">GitHub</a> •
  <a href="https://x.com/nicholasoxford">Twitter</a>
</p>
