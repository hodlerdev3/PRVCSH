/**
 * PRVCSH Browser Client
 *
 * Browser-compatible wrapper for the PRVCSH SDK.
 * Handles ZK proof generation, deposit/withdraw operations,
 * and balance management.
 */

import {
  type PRVCSHConfig,
  type PRVCSHState,
  type DepositParams,
  type WithdrawParams,
  type TransactionResult,
  type PrivateBalance,
  type SupportedToken,
  type ZKProofStatus,
  type PRVCSHError,
} from "../types";
import { SUPPORTED_TOKENS, ZK_PROOF_MESSAGES } from "../constants";
import { parseAmount, formatAmount } from "../utils";

/**
 * PRVCSHBrowser - Main client class for browser environments
 *
 * @example
 * ```typescript
 * const client = new PRVCSHBrowser({
 *   rpcUrl: 'https://api.devnet.solana.com',
 *   network: 'devnet',
 *   relayerUrl: 'https://relayer-devnet.privacycash.io'
 * });
 *
 * await client.initializeEncryption(wallet);
 * const result = await client.depositSOL({ amount: '1.0' });
 * ```
 */
export class PRVCSHBrowser {
  private _config: PRVCSHConfig;
  private _state: PRVCSHState;
  private _proofStatus: ZKProofStatus;
  private _encryptionKey: CryptoKey | null = null;

  constructor(config: PRVCSHConfig) {
    this._config = config;
    this._state = {
      isInitialized: false,
      isEncryptionReady: false,
      walletAddress: null,
      isLoading: false,
      error: null,
    };
    this._proofStatus = {
      step: "idle",
      progress: 0,
      message: ZK_PROOF_MESSAGES.idle ?? "",
    };
  }

  // ============================================
  // Getters
  // ============================================

  get config(): PRVCSHConfig {
    return { ...this._config };
  }

  get state(): PRVCSHState {
    return { ...this._state };
  }

  get proofStatus(): ZKProofStatus {
    return { ...this._proofStatus };
  }

  get isReady(): boolean {
    return this._state.isInitialized && this._state.isEncryptionReady;
  }

  get hasEncryptionKey(): boolean {
    return this._encryptionKey !== null;
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize encryption using wallet signature
   * This derives an encryption key from a signed message
   */
  async initializeEncryption(
    walletAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ): Promise<void> {
    try {
      this._state.isLoading = true;
      this._state.error = null;

      // Create a deterministic message for signing
      const message = new TextEncoder().encode(
        `PRVCSH Encryption Key Derivation\nWallet: ${walletAddress}\nDo not share this signature.`
      );

      // Sign the message
      const signature = await signMessage(message);

      // Derive encryption key from signature using Web Crypto API
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        signature.slice(0, 32),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );

      this._encryptionKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: new TextEncoder().encode("prvcsh-v1"),
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      this._state.walletAddress = walletAddress;
      this._state.isEncryptionReady = true;
      this._state.isInitialized = true;
    } catch (error) {
      this._state.error = {
        code: "ENCRYPTION_NOT_INITIALIZED",
        message: "Failed to initialize encryption",
        details: error,
      };
      throw error;
    } finally {
      this._state.isLoading = false;
    }
  }

  // ============================================
  // Deposit Operations
  // ============================================

  /**
   * Deposit SOL into the privacy pool
   */
  async depositSOL(params: Omit<DepositParams, "token">): Promise<TransactionResult> {
    return this.deposit({ ...params, token: "SOL" });
  }

  /**
   * Deposit SPL tokens into the privacy pool
   */
  async depositSPL(params: DepositParams): Promise<TransactionResult> {
    if (params.token === "SOL") {
      throw this.createError("INVALID_AMOUNT", "Use depositSOL for SOL deposits");
    }
    return this.deposit(params);
  }

  /**
   * Generic deposit method
   */
  async deposit(params: DepositParams): Promise<TransactionResult> {
    this.ensureReady();

    try {
      this._state.isLoading = true;
      this._state.error = null;

      // Parse amount to lamports
      const amountRaw = parseAmount(params.amount, params.token);

      // Validate amount
      if (amountRaw <= 0n) {
        throw this.createError("INVALID_AMOUNT", "Amount must be greater than 0");
      }

      // Update proof status
      this.updateProofStatus("setup", 10);

      // TODO: Implement actual deposit logic with SDK
      // This is a placeholder for the actual implementation
      await this.simulateProofGeneration();

      this.updateProofStatus("complete", 100);

      return {
        success: true,
        signature: "simulated_signature_" + Date.now(),
        confirmationStatus: "confirmed",
      };
    } catch (error) {
      this.updateProofStatus("error", 0);
      const pcError = error as PRVCSHError;
      this._state.error = pcError;
      return {
        success: false,
        signature: null,
        error: pcError.message,
      };
    } finally {
      this._state.isLoading = false;
    }
  }

  // ============================================
  // Withdraw Operations
  // ============================================

  /**
   * Withdraw SOL from the privacy pool
   */
  async withdrawSOL(params: Omit<WithdrawParams, "token">): Promise<TransactionResult> {
    return this.withdraw({ ...params, token: "SOL" });
  }

  /**
   * Withdraw SPL tokens from the privacy pool
   */
  async withdrawSPL(params: WithdrawParams): Promise<TransactionResult> {
    if (params.token === "SOL") {
      throw this.createError("INVALID_AMOUNT", "Use withdrawSOL for SOL withdrawals");
    }
    return this.withdraw(params);
  }

  /**
   * Generic withdraw method
   */
  async withdraw(params: WithdrawParams): Promise<TransactionResult> {
    this.ensureReady();

    try {
      this._state.isLoading = true;
      this._state.error = null;

      // Validate recipient address
      if (!params.recipient || params.recipient.length < 32) {
        throw this.createError("INVALID_RECIPIENT", "Invalid recipient address");
      }

      // Parse amount
      const amountRaw = parseAmount(params.amount, params.token);

      if (amountRaw <= 0n) {
        throw this.createError("INVALID_AMOUNT", "Amount must be greater than 0");
      }

      // Update proof status
      this.updateProofStatus("setup", 10);

      // TODO: Implement actual withdraw logic with SDK
      await this.simulateProofGeneration();

      this.updateProofStatus("complete", 100);

      return {
        success: true,
        signature: "simulated_signature_" + Date.now(),
        confirmationStatus: "confirmed",
      };
    } catch (error) {
      this.updateProofStatus("error", 0);
      const pcError = error as PRVCSHError;
      this._state.error = pcError;
      return {
        success: false,
        signature: null,
        error: pcError.message,
      };
    } finally {
      this._state.isLoading = false;
    }
  }

  // ============================================
  // Balance Operations
  // ============================================

  /**
   * Get private balance for SOL
   */
  async getPrivateBalanceSOL(): Promise<PrivateBalance> {
    return this.getPrivateBalance("SOL");
  }

  /**
   * Get private balance for SPL token
   */
  async getPrivateBalanceSPL(token: SupportedToken): Promise<PrivateBalance> {
    if (token === "SOL") {
      return this.getPrivateBalanceSOL();
    }
    return this.getPrivateBalance(token);
  }

  /**
   * Get private balance for a specific token
   */
  async getPrivateBalance(token: SupportedToken): Promise<PrivateBalance> {
    this.ensureReady();

    // TODO: Implement actual balance fetching with SDK
    // This is a placeholder returning mock data
    const mockBalance = 0n;

    return {
      token,
      amount: formatAmount(mockBalance, token),
      amountRaw: mockBalance,
    };
  }

  /**
   * Get all private balances
   */
  async getAllPrivateBalances(): Promise<PrivateBalance[]> {
    const tokens = Object.keys(SUPPORTED_TOKENS) as SupportedToken[];
    return Promise.all(tokens.map((token) => this.getPrivateBalance(token)));
  }

  /**
   * Get list of supported tokens
   */
  getSupportedTokens(): SupportedToken[] {
    return Object.keys(SUPPORTED_TOKENS) as SupportedToken[];
  }

  // ============================================
  // Cache Management
  // ============================================

  /**
   * Clear cached data from localStorage
   */
  clearCache(): void {
    if (typeof window !== "undefined") {
      const keysToRemove = Object.keys(localStorage).filter((key) =>
        key.startsWith("prvcsh-")
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private ensureReady(): void {
    if (!this._state.walletAddress) {
      throw this.createError("WALLET_NOT_CONNECTED", "Wallet not connected");
    }
    if (!this._state.isEncryptionReady) {
      throw this.createError("ENCRYPTION_NOT_INITIALIZED", "Encryption not initialized");
    }
  }

  private createError(code: PRVCSHError["code"], message: string): PRVCSHError {
    return { code, message };
  }

  private updateProofStatus(step: ZKProofStatus["step"], progress: number): void {
    this._proofStatus = {
      step,
      progress,
      message: ZK_PROOF_MESSAGES[step] ?? "",
    };
  }

  private async simulateProofGeneration(): Promise<void> {
    // Simulate proof generation steps
    this.updateProofStatus("generating", 30);
    await this.delay(1000);

    this.updateProofStatus("generating", 60);
    await this.delay(1000);

    this.updateProofStatus("verifying", 80);
    await this.delay(500);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
