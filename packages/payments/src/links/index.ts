/**
 * @fileoverview Payment Link Generator
 * @description Create shareable payment links for merchants.
 * 
 * @module @prvcsh/payments/links
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * const linkManager = createPaymentLinkManager({
 *   baseUrl: 'https://pay.privacycash.app',
 * });
 * 
 * const link = await linkManager.createLink('merchant_123', {
 *   name: 'Coffee Purchase',
 *   amount: 5_000_000n, // 5 USDC
 *   currency: 'USDC',
 * });
 * 
 * console.log(link.url); // https://pay.privacycash.app/p/abc123xyz
 * ```
 */

import type {
  PaymentLink,
  CreatePaymentLinkInput,
  Currency,
  PaginatedResponse,
} from '../types';

// =============================================================================
// PAYMENT LINK MANAGER INTERFACE
// =============================================================================

/**
 * Payment link manager interface
 */
export interface IPaymentLinkManager {
  // Link CRUD
  createLink(merchantId: string, input: CreatePaymentLinkInput): Promise<PaymentLink>;
  getLink(linkId: string): Promise<PaymentLink | undefined>;
  getLinkByShortCode(shortCode: string): Promise<PaymentLink | undefined>;
  listLinks(merchantId: string, options?: LinkQueryOptions): Promise<PaginatedResponse<PaymentLink>>;
  updateLink(linkId: string, input: UpdatePaymentLinkInput): Promise<PaymentLink>;
  deactivateLink(linkId: string): Promise<PaymentLink>;
  deleteLink(linkId: string): Promise<void>;
  
  // Link usage
  recordUsage(linkId: string, paymentId: string): Promise<PaymentLink>;
  
  // URL utilities
  getLinkUrl(shortCode: string): string;
  parseShortCode(url: string): string | null;
}

/**
 * Link query options
 */
export interface LinkQueryOptions {
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by currency */
  currency?: Currency;
  
  /** Search by name */
  search?: string;
  
  /** Pagination */
  limit?: number;
  offset?: number;
  
  /** Sort */
  sortBy?: 'createdAt' | 'name' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Update payment link input
 */
export interface UpdatePaymentLinkInput {
  /** Link name */
  name?: string;
  
  /** Description */
  description?: string;
  
  /** Fixed amount */
  amount?: bigint;
  
  /** Active status */
  isActive?: boolean;
  
  /** Max uses */
  maxUses?: number;
  
  /** Expiry date */
  expiresAt?: Date;
  
  /** Redirect URL */
  redirectUrl?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Payment link manager configuration
 */
export interface PaymentLinkManagerConfig {
  /** Base URL for payment links */
  baseUrl: string;
  
  /** Short code length */
  shortCodeLength: number;
  
  /** Short code alphabet */
  shortCodeAlphabet: string;
  
  /** Default expiry days (null for no expiry) */
  defaultExpiryDays: number | null;
  
  /** Enable QR code generation */
  enableQRCode: boolean;
}

/**
 * Default payment link manager configuration
 */
export const DEFAULT_LINK_CONFIG: PaymentLinkManagerConfig = {
  baseUrl: 'https://pay.privacycash.app',
  shortCodeLength: 10,
  shortCodeAlphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  defaultExpiryDays: null,
  enableQRCode: true,
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Generate short code
 */
function generateShortCode(length: number, alphabet: string): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += alphabet[array[i]! % alphabet.length];
  }
  
  return result;
}

/**
 * Generate QR code data URL (SVG)
 */
function generateQRCodeSVG(url: string, size: number = 200): string {
  // Simple QR code placeholder - in production use a proper QR library
  // This returns a simple SVG that can be replaced with actual QR code
  const encodedUrl = encodeURIComponent(url);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    <text x="50%" y="45%" text-anchor="middle" font-size="12" fill="#333">QR Code</text>
    <text x="50%" y="55%" text-anchor="middle" font-size="8" fill="#666">${encodedUrl.slice(0, 30)}...</text>
  </svg>`;
}

// =============================================================================
// PAYMENT LINK MANAGER IMPLEMENTATION
// =============================================================================

/**
 * Payment link manager implementation
 */
export class PaymentLinkManager implements IPaymentLinkManager {
  private links: Map<string, PaymentLink> = new Map();
  private linksByShortCode: Map<string, string> = new Map(); // shortCode -> id
  private linkUsage: Map<string, string[]> = new Map(); // linkId -> paymentIds
  private readonly config: PaymentLinkManagerConfig;
  
  constructor(config: Partial<PaymentLinkManagerConfig> = {}) {
    this.config = { ...DEFAULT_LINK_CONFIG, ...config };
  }
  
  /**
   * Create a new payment link
   */
  async createLink(
    merchantId: string,
    input: CreatePaymentLinkInput
  ): Promise<PaymentLink> {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Link name is required');
    }
    
    if (input.name.length > 100) {
      throw new Error('Link name must be 100 characters or less');
    }
    
    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      shortCode = generateShortCode(
        this.config.shortCodeLength,
        this.config.shortCodeAlphabet
      );
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique short code');
      }
    } while (this.linksByShortCode.has(shortCode));
    
    // Generate ID
    const id = generateId('plink');
    
    // Calculate expiry
    let expiresAt = input.expiresAt;
    if (!expiresAt && this.config.defaultExpiryDays !== null) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.config.defaultExpiryDays);
    }
    
    const link: PaymentLink = {
      id,
      merchantId,
      shortCode,
      url: this.getLinkUrl(shortCode),
      name: input.name.trim(),
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      isActive: true,
      isSingleUse: input.isSingleUse ?? false,
      usageCount: 0,
      maxUses: input.maxUses,
      expiresAt,
      redirectUrl: input.redirectUrl,
      createdAt: new Date(),
      metadata: input.metadata,
    };
    
    this.links.set(id, link);
    this.linksByShortCode.set(shortCode, id);
    this.linkUsage.set(id, []);
    
    return link;
  }
  
  /**
   * Get link by ID
   */
  async getLink(linkId: string): Promise<PaymentLink | undefined> {
    return this.links.get(linkId);
  }
  
  /**
   * Get link by short code
   */
  async getLinkByShortCode(shortCode: string): Promise<PaymentLink | undefined> {
    const id = this.linksByShortCode.get(shortCode);
    return id ? this.links.get(id) : undefined;
  }
  
  /**
   * List links for merchant
   */
  async listLinks(
    merchantId: string,
    options: LinkQueryOptions = {}
  ): Promise<PaginatedResponse<PaymentLink>> {
    let links = Array.from(this.links.values())
      .filter((link) => link.merchantId === merchantId);
    
    // Apply filters
    if (options.active !== undefined) {
      links = links.filter((link) => link.isActive === options.active);
    }
    
    if (options.currency) {
      links = links.filter((link) => link.currency === options.currency);
    }
    
    if (options.search) {
      const search = options.search.toLowerCase();
      links = links.filter(
        (link) =>
          link.name.toLowerCase().includes(search) ||
          link.description?.toLowerCase().includes(search)
      );
    }
    
    // Sort
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    
    links.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usageCount':
          comparison = a.usageCount - b.usageCount;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Paginate
    const total = links.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    
    const data = links.slice(offset, offset + limit);
    
    return {
      data,
      total,
      hasMore: offset + limit < total,
      nextCursor: offset + limit < total ? String(offset + limit) : undefined,
    };
  }
  
  /**
   * Update link
   */
  async updateLink(
    linkId: string,
    input: UpdatePaymentLinkInput
  ): Promise<PaymentLink> {
    const link = this.links.get(linkId);
    
    if (!link) {
      throw new Error(`Link not found: ${linkId}`);
    }
    
    // Create updated link (since properties are readonly, we need to create new object)
    const updated: PaymentLink = {
      ...link,
      name: input.name !== undefined ? input.name.trim() : link.name,
      description: input.description !== undefined ? input.description : link.description,
      amount: input.amount !== undefined ? input.amount : link.amount,
      isActive: input.isActive !== undefined ? input.isActive : link.isActive,
      maxUses: input.maxUses !== undefined ? input.maxUses : link.maxUses,
      expiresAt: input.expiresAt !== undefined ? input.expiresAt : link.expiresAt,
      redirectUrl: input.redirectUrl !== undefined ? input.redirectUrl : link.redirectUrl,
      metadata: input.metadata !== undefined ? input.metadata : link.metadata,
    };
    
    this.links.set(linkId, updated);
    
    return updated;
  }
  
  /**
   * Deactivate link
   */
  async deactivateLink(linkId: string): Promise<PaymentLink> {
    const link = this.links.get(linkId);
    
    if (!link) {
      throw new Error(`Link not found: ${linkId}`);
    }
    
    const updated: PaymentLink = {
      ...link,
      isActive: false,
    };
    
    this.links.set(linkId, updated);
    
    return updated;
  }
  
  /**
   * Delete link
   */
  async deleteLink(linkId: string): Promise<void> {
    const link = this.links.get(linkId);
    
    if (!link) {
      throw new Error(`Link not found: ${linkId}`);
    }
    
    this.links.delete(linkId);
    this.linksByShortCode.delete(link.shortCode);
    this.linkUsage.delete(linkId);
  }
  
  /**
   * Record link usage
   */
  async recordUsage(linkId: string, paymentId: string): Promise<PaymentLink> {
    const link = this.links.get(linkId);
    
    if (!link) {
      throw new Error(`Link not found: ${linkId}`);
    }
    
    // Check if link is still usable
    if (!link.isActive) {
      throw new Error('Link is inactive');
    }
    
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new Error('Link has expired');
    }
    
    if (link.maxUses && link.usageCount >= link.maxUses) {
      throw new Error('Link has reached maximum uses');
    }
    
    // Record usage
    const usage = this.linkUsage.get(linkId) || [];
    usage.push(paymentId);
    this.linkUsage.set(linkId, usage);
    
    // Update link
    const updated: PaymentLink = {
      ...link,
      usageCount: link.usageCount + 1,
    };
    
    // Check if single use
    if (link.isSingleUse) {
      updated.isActive = false;
    }
    
    // Check if max uses reached
    if (link.maxUses && updated.usageCount >= link.maxUses) {
      updated.isActive = false;
    }
    
    this.links.set(linkId, updated);
    
    return updated;
  }
  
  /**
   * Get link URL
   */
  getLinkUrl(shortCode: string): string {
    return `${this.config.baseUrl}/p/${shortCode}`;
  }
  
  /**
   * Parse short code from URL
   */
  parseShortCode(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/^\/p\/([a-zA-Z0-9]+)$/);
      return match ? match[1]! : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Get link statistics
   */
  getLinkStats(linkId: string): {
    usageCount: number;
    paymentIds: string[];
    isActive: boolean;
    isExpired: boolean;
    remainingUses: number | null;
  } | null {
    const link = this.links.get(linkId);
    
    if (!link) {
      return null;
    }
    
    const paymentIds = this.linkUsage.get(linkId) || [];
    const isExpired = link.expiresAt ? link.expiresAt < new Date() : false;
    const remainingUses = link.maxUses ? link.maxUses - link.usageCount : null;
    
    return {
      usageCount: link.usageCount,
      paymentIds,
      isActive: link.isActive && !isExpired,
      isExpired,
      remainingUses,
    };
  }
  
  /**
   * Generate QR code for link
   */
  generateQRCode(linkId: string, size: number = 200): string | null {
    const link = this.links.get(linkId);
    
    if (!link || !this.config.enableQRCode) {
      return null;
    }
    
    return generateQRCodeSVG(link.url, size);
  }
  
  /**
   * Get merchant stats
   */
  getMerchantStats(merchantId: string): {
    totalLinks: number;
    activeLinks: number;
    totalUsage: number;
    byStatus: {
      active: number;
      inactive: number;
      expired: number;
    };
  } {
    const links = Array.from(this.links.values())
      .filter((link) => link.merchantId === merchantId);
    
    const now = new Date();
    let active = 0;
    let inactive = 0;
    let expired = 0;
    let totalUsage = 0;
    
    for (const link of links) {
      totalUsage += link.usageCount;
      
      if (link.expiresAt && link.expiresAt < now) {
        expired++;
      } else if (link.isActive) {
        active++;
      } else {
        inactive++;
      }
    }
    
    return {
      totalLinks: links.length,
      activeLinks: active,
      totalUsage,
      byStatus: { active, inactive, expired },
    };
  }
  
  /**
   * Clean up expired links
   */
  cleanupExpiredLinks(deactivate: boolean = true): number {
    const now = new Date();
    let count = 0;
    
    for (const link of this.links.values()) {
      if (link.expiresAt && link.expiresAt < now && link.isActive) {
        if (deactivate) {
          const updated: PaymentLink = { ...link, isActive: false };
          this.links.set(link.id, updated);
        }
        count++;
      }
    }
    
    return count;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create payment link manager
 */
export function createPaymentLinkManager(
  config?: Partial<PaymentLinkManagerConfig>
): PaymentLinkManager {
  return new PaymentLinkManager(config);
}

/**
 * Validate payment link URL
 */
export function isValidPaymentLinkUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    
    return (
      urlObj.origin === baseUrlObj.origin &&
      /^\/p\/[a-zA-Z0-9]+$/.test(urlObj.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Format amount for display
 */
export function formatLinkAmount(
  amount: bigint | undefined,
  currency: Currency,
  decimals: number = 6
): string {
  if (amount === undefined) {
    return `Open amount (${currency})`;
  }
  
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  
  return `${whole}.${fractionStr} ${currency}`;
}

/**
 * Link status type
 */
export type LinkStatus = 'active' | 'inactive' | 'expired' | 'exhausted';

/**
 * Get link status
 */
export function getLinkStatus(link: PaymentLink): LinkStatus {
  const now = new Date();
  
  if (link.expiresAt && link.expiresAt < now) {
    return 'expired';
  }
  
  if (link.maxUses && link.usageCount >= link.maxUses) {
    return 'exhausted';
  }
  
  if (!link.isActive) {
    return 'inactive';
  }
  
  return 'active';
}
