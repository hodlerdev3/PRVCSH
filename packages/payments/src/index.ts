/**
 * @fileoverview PRVCSH Payments SDK
 * @description Complete payment processing SDK for merchants.
 * 
 * @module @prvcsh/payments
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * import { 
 *   createMerchantManager, 
 *   createInvoiceManager, 
 *   createWebhookManager 
 * } from '@prvcsh/payments';
 * 
 * // Initialize managers
 * const merchants = createMerchantManager({ 
 *   testMode: true 
 * });
 * 
 * const invoices = createInvoiceManager({
 *   baseUrl: 'https://pay.example.com'
 * });
 * 
 * const webhooks = createWebhookManager();
 * 
 * // Create a merchant
 * const merchant = await merchants.createMerchant({
 *   email: 'merchant@example.com',
 *   name: 'Acme Inc',
 *   walletAddress: 'So11111111111111111111111111111111111111112',
 * });
 * 
 * // Create an API key
 * const apiKey = await merchants.createAPIKey(merchant.id, {
 *   name: 'Production API',
 *   permissions: ['payments:read', 'payments:write'],
 * });
 * 
 * // Create an invoice
 * const invoice = await invoices.createInvoice(merchant.id, {
 *   customerEmail: 'customer@example.com',
 *   items: [
 *     { description: 'Service Fee', quantity: 1, unitPrice: 100_000_000n }
 *   ],
 *   currency: 'USDC',
 *   dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
 * });
 * 
 * // Register webhook endpoint
 * const endpoint = await webhooks.registerEndpoint(merchant.id, {
 *   url: 'https://example.com/webhooks',
 *   events: ['payment.completed', 'invoice.paid'],
 * });
 * ```
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Types
export * from './types';

// Merchant management
export {
  MerchantManager,
  createMerchantManager,
  parseAPIKey,
  isTestKey,
  isLiveKey,
  type IMerchantManager,
  type MerchantManagerConfig,
} from './merchant';

// Invoice management
export {
  InvoiceManager,
  createInvoiceManager,
  formatInvoiceAmount,
  calculateDueDate,
  type IInvoiceManager,
  type InvoiceManagerConfig,
  type InvoiceQueryOptions,
} from './invoices';

// Payment link management
export {
  PaymentLinkManager,
  createPaymentLinkManager,
  isValidPaymentLinkUrl,
  formatLinkAmount,
  getLinkStatus,
  type IPaymentLinkManager,
  type PaymentLinkManagerConfig,
  type LinkQueryOptions,
  type UpdatePaymentLinkInput,
  type LinkStatus,
} from './links';

// PDF generation
export {
  PDFGenerator,
  createPDFGenerator,
  type IPDFGenerator,
  type PDFConfig,
} from './pdf';

// Email service
export {
  EmailService,
  createEmailService,
  isValidEmail,
  type IEmailService,
  type EmailServiceConfig,
  type EmailResult,
  type EmailTemplateType,
  type SendInvoiceOptions,
} from './email';

// Webhook management
export {
  WebhookManager,
  createWebhookManager,
  verifyWebhookSignature,
  parseWebhookSignature,
  constructWebhookEvent,
  ALL_WEBHOOK_EVENTS,
  type IWebhookManager,
  type WebhookManagerConfig,
  type CreateWebhookEndpointInput,
  type UpdateWebhookEndpointInput,
  type DeliveryQueryOptions,
  type WebhookEventPayload,
} from './webhooks';

// Event bus
export {
  EventBus,
  WebhookDispatcher,
  createEventBus,
  createWebhookDispatcher,
  PAYMENT_EVENT_TYPES,
  INVOICE_EVENT_TYPES,
  REFUND_EVENT_TYPES,
  type IEventBus,
  type PaymentEvent,
  type EventHandler,
  type EventBusConfig,
  type EventHistoryOptions,
  type WebhookDispatcherConfig,
} from './events';

// Delivery queue
export {
  DeliveryQueue,
  PriorityDeliveryQueue,
  DeadLetterQueue,
  createDeliveryQueue,
  createPriorityDeliveryQueue,
  createDeadLetterQueue,
  type QueueItem,
  type QueueItemStatus,
  type QueueConfig,
  type QueueStats,
  type DeliveryResult,
  type DeliveryHandler,
  type PriorityLevel,
  type PriorityQueueItem,
} from './queue';

// Refund management
export {
  RefundManager,
  RefundPolicyEngine,
  createRefundManager,
  createRefundPolicyEngine,
  createDefaultRefundPolicy,
  REFUND_REASONS,
  REFUND_STATUSES,
  type IRefundManager,
  type RefundManagerConfig,
  type CreateRefundInput,
  type ProcessRefundInput,
  type RefundCalculation,
  type RefundQueryOptions,
  type RefundStats,
  type PaymentForRefund,
  type RefundPolicyRule,
} from './refunds';

// Merchant SDK
export {
  PRVCSHSDK,
  createPRVCSHSDK,
  PRVCSHError,
  SDKError,
  PaymentsResource,
  InvoicesResource,
  RefundsResource,
  PaymentLinksResource,
  WebhooksResource,
  type PRVCSHSDKConfig,
  type APIResponse,
  type PaginatedResponse,
  type ListOptions,
  type CreatePaymentInput as SDKCreatePaymentInput,
  type CreateInvoiceInput as SDKCreateInvoiceInput,
  type CreateRefundInput as SDKCreateRefundInput,
  type CreatePaymentLinkInput as SDKCreatePaymentLinkInput,
  type CreateWebhookEndpointInput as SDKCreateWebhookEndpointInput,
  type WebhookEndpointResponse,
} from './sdk';

// React hooks
export {
  initializeContext,
  getContext,
  createPaymentHook,
  createCheckoutHook,
  formatAmount,
  parseAmount,
  formatCurrency,
  getCurrencySymbol,
  CURRENCY_SYMBOLS,
  type PRVCSHProviderConfig,
  type CreatePaymentOptions,
  type HookState,
  type UsePaymentResult,
  type UsePaymentsResult,
  type UsePaymentStatusResult,
  type CheckoutSession,
  type UseCheckoutResult,
  type PRVCSHContextValue,
} from './react';

// Checkout UI
export {
  CheckoutManager,
  CheckoutRenderer,
  createCheckoutManager,
  createCheckoutRenderer,
  mountCheckout,
  LIGHT_THEME,
  DARK_THEME,
  CHECKOUT_STEPS,
  PAYMENT_METHODS,
  type CheckoutTheme,
  type CheckoutConfig,
  type CheckoutState,
  type CheckoutStep,
  type CheckoutEvent,
  type CheckoutEventType,
  type CheckoutCallbacks,
  type PaymentMethod,
} from './checkout';

// =============================================================================
// CONSTANTS
// =============================================================================

import type { Currency } from './types';

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES: Currency[] = ['SOL', 'USDC', 'USDT', 'PRIVACY'];

/**
 * API version
 */
export const API_VERSION = '2024-01-01';

/**
 * SDK version
 */
export const SDK_VERSION = '0.1.0';
