/**
 * @fileoverview React Native Components for PRVCSH
 * @description Pre-built UI components for wallet integration.
 * 
 * @module @prvcsh/react-native/components
 * @version 0.1.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { useWallet, useBalance, useTransactions, usePayment } from './hooks';
import { formatSOL, shortenAddress, type SolanaNetwork, type TransactionRecord } from './index';
import { SUPPORTED_WALLETS, type WalletInfo } from './wallet';

// =============================================================================
// THEME
// =============================================================================

/**
 * Theme colors
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}

/**
 * Default theme
 */
export const defaultTheme: ThemeColors = {
  primary: '#512DA8',
  secondary: '#9945FF',
  background: '#0A0A0A',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#888888',
  border: '#333333',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
};

/**
 * Light theme
 */
export const lightTheme: ThemeColors = {
  primary: '#512DA8',
  secondary: '#9945FF',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
};

// =============================================================================
// CONNECT BUTTON
// =============================================================================

/**
 * Connect button props
 */
export interface ConnectButtonProps {
  /** Button label when disconnected */
  label?: string;
  
  /** Show wallet address when connected */
  showAddress?: boolean;
  
  /** Theme colors */
  theme?: Partial<ThemeColors>;
  
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  
  /** Text style */
  textStyle?: StyleProp<TextStyle>;
  
  /** Wallet options */
  walletOptions?: {
    network?: SolanaNetwork;
    autoConnect?: boolean;
  };
  
  /** On connect callback */
  onConnect?: (publicKey: string) => void;
  
  /** On disconnect callback */
  onDisconnect?: () => void;
}

/**
 * Connect button component
 */
export function ConnectButton({
  label = 'Connect Wallet',
  showAddress = true,
  theme: customTheme,
  style,
  textStyle,
  walletOptions,
  onConnect,
  onDisconnect,
}: ConnectButtonProps): React.ReactElement {
  const theme = { ...defaultTheme, ...customTheme };
  const [modalVisible, setModalVisible] = useState(false);
  
  const wallet = useWallet(walletOptions);
  
  const handleConnect = useCallback(async (walletName: string) => {
    try {
      const publicKey = await wallet.connect(walletName);
      setModalVisible(false);
      onConnect?.(publicKey);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [wallet, onConnect]);
  
  const handleDisconnect = useCallback(async () => {
    try {
      await wallet.disconnect();
      onDisconnect?.();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [wallet, onDisconnect]);
  
  const buttonStyle = useMemo(() => [
    styles.connectButton,
    { backgroundColor: theme.primary },
    style,
  ], [theme.primary, style]);
  
  const buttonTextStyle = useMemo(() => [
    styles.connectButtonText,
    { color: theme.text },
    textStyle,
  ], [theme.text, textStyle]);
  
  if (wallet.connected && wallet.publicKey) {
    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={handleDisconnect}
        activeOpacity={0.8}
      >
        <Text style={buttonTextStyle}>
          {showAddress ? shortenAddress(wallet.publicKey) : 'Disconnect'}
        </Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <>
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => setModalVisible(true)}
        disabled={wallet.connecting}
        activeOpacity={0.8}
      >
        {wallet.connecting ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <Text style={buttonTextStyle}>{label}</Text>
        )}
      </TouchableOpacity>
      
      <WalletSelectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleConnect}
        theme={theme}
      />
    </>
  );
}

// =============================================================================
// WALLET SELECT MODAL
// =============================================================================

/**
 * Wallet select modal props
 */
interface WalletSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (walletName: string) => void;
  theme: ThemeColors;
}

/**
 * Wallet select modal
 */
function WalletSelectModal({
  visible,
  onClose,
  onSelect,
  theme,
}: WalletSelectModalProps): React.ReactElement {
  const renderWallet = useCallback(({ item }: { item: WalletInfo }) => (
    <TouchableOpacity
      style={[styles.walletItem, { borderBottomColor: theme.border }]}
      onPress={() => onSelect(item.name)}
      activeOpacity={0.7}
    >
      <View style={styles.walletInfo}>
        <Text style={[styles.walletName, { color: theme.text }]}>
          {item.name}
        </Text>
        {item.installed && (
          <Text style={[styles.installedBadge, { color: theme.success }]}>
            Installed
          </Text>
        )}
      </View>
    </TouchableOpacity>
  ), [theme, onSelect]);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Wallet
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: theme.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={SUPPORTED_WALLETS}
            keyExtractor={(item) => item.name}
            renderItem={renderWallet}
            style={styles.walletList}
          />
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// BALANCE DISPLAY
// =============================================================================

/**
 * Balance display props
 */
export interface BalanceDisplayProps {
  /** Public key */
  publicKey: string | null;
  
  /** Show token balances */
  showTokens?: boolean;
  
  /** Theme */
  theme?: Partial<ThemeColors>;
  
  /** Custom style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Balance display component
 */
export function BalanceDisplay({
  publicKey,
  showTokens = true,
  theme: customTheme,
  style,
}: BalanceDisplayProps): React.ReactElement {
  const theme = { ...defaultTheme, ...customTheme };
  const balance = useBalance({ publicKey });
  
  if (balance.loading) {
    return (
      <View style={[styles.balanceContainer, { backgroundColor: theme.surface }, style]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.balanceContainer, { backgroundColor: theme.surface }, style]}>
      <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
        Balance
      </Text>
      <Text style={[styles.balanceAmount, { color: theme.text }]}>
        {formatSOL(balance.sol)} SOL
      </Text>
      
      {showTokens && Object.keys(balance.tokens).length > 0 && (
        <View style={styles.tokenList}>
          {Object.entries(balance.tokens).map(([symbol, { amount }]) => (
            <View key={symbol} style={styles.tokenItem}>
              <Text style={[styles.tokenSymbol, { color: theme.textSecondary }]}>
                {symbol}
              </Text>
              <Text style={[styles.tokenAmount, { color: theme.text }]}>
                {amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {balance.lastUpdated && (
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>
          Updated: {balance.lastUpdated.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}

// =============================================================================
// TRANSACTION LIST
// =============================================================================

/**
 * Transaction list props
 */
export interface TransactionListProps {
  /** Public key */
  publicKey: string | null;
  
  /** Theme */
  theme?: Partial<ThemeColors>;
  
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  
  /** On transaction press */
  onTransactionPress?: (transaction: TransactionRecord) => void;
}

/**
 * Transaction list component
 */
export function TransactionList({
  publicKey,
  theme: customTheme,
  style,
  onTransactionPress,
}: TransactionListProps): React.ReactElement {
  const theme = { ...defaultTheme, ...customTheme };
  const { transactions, loading, hasMore, loadMore, refresh } = useTransactions({
    publicKey,
  });
  
  const renderTransaction = useCallback(({ item }: { item: TransactionRecord }) => {
    const isOutgoing = item.type === 'payment' || item.type === 'transfer';
    const statusColor = item.status === 'confirmed' ? theme.success :
      item.status === 'pending' ? theme.warning : theme.error;
    
    return (
      <TouchableOpacity
        style={[styles.transactionItem, { borderBottomColor: theme.border }]}
        onPress={() => onTransactionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionType, { color: theme.text }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
            {item.timestamp.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: isOutgoing ? theme.error : theme.success }
          ]}>
            {isOutgoing ? '-' : '+'}{formatSOL(item.amount)} SOL
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [theme, onTransactionPress]);
  
  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.signature}
      renderItem={renderTransaction}
      style={[styles.transactionList, style]}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.5}
      refreshing={loading}
      onRefresh={refresh}
      ListEmptyComponent={
        <View style={styles.emptyList}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No transactions yet
          </Text>
        </View>
      }
      ListFooterComponent={
        loading && transactions.length > 0 ? (
          <ActivityIndicator color={theme.primary} style={styles.loadingMore} />
        ) : null
      }
    />
  );
}

// =============================================================================
// SEND FORM
// =============================================================================

/**
 * Send form props
 */
export interface SendFormProps {
  /** Theme */
  theme?: Partial<ThemeColors>;
  
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  
  /** On success */
  onSuccess?: (signature: string) => void;
  
  /** On error */
  onError?: (error: Error) => void;
}

/**
 * Send form component
 */
export function SendForm({
  theme: customTheme,
  style,
  onSuccess,
  onError,
}: SendFormProps): React.ReactElement {
  const theme = { ...defaultTheme, ...customTheme };
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const { pay, paying, error } = usePayment();
  
  const handleSend = useCallback(async () => {
    try {
      const result = await pay({
        to: recipient,
        amount: parseFloat(amount),
      });
      onSuccess?.(result.signature);
      setRecipient('');
      setAmount('');
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [recipient, amount, pay, onSuccess, onError]);
  
  const isValid = recipient.length > 0 && parseFloat(amount) > 0;
  
  return (
    <View style={[styles.sendForm, { backgroundColor: theme.surface }, style]}>
      <Text style={[styles.sendFormTitle, { color: theme.text }]}>
        Send SOL
      </Text>
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: theme.border,
        }]}
        placeholder="Recipient address"
        placeholderTextColor={theme.textSecondary}
        value={recipient}
        onChangeText={setRecipient}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: theme.border,
        }]}
        placeholder="Amount in SOL"
        placeholderTextColor={theme.textSecondary}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error.message}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: isValid && !paying ? theme.primary : theme.border }
        ]}
        onPress={handleSend}
        disabled={!isValid || paying}
        activeOpacity={0.8}
      >
        {paying ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <Text style={[styles.sendButtonText, { color: theme.text }]}>
            Send
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// PAYMENT QR CODE
// =============================================================================

/**
 * QR code props
 */
export interface PaymentQRCodeProps {
  /** Recipient address */
  recipient: string;
  
  /** Amount */
  amount?: number;
  
  /** Label */
  label?: string;
  
  /** Message */
  message?: string;
  
  /** Size */
  size?: number;
  
  /** Theme */
  theme?: Partial<ThemeColors>;
  
  /** Custom style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Payment QR code component
 * Note: Actual QR rendering requires react-native-qrcode-svg or similar
 */
export function PaymentQRCode({
  recipient,
  amount,
  label,
  message,
  size = 200,
  theme: customTheme,
  style,
}: PaymentQRCodeProps): React.ReactElement {
  const theme = { ...defaultTheme, ...customTheme };
  
  // Build Solana Pay URL
  const url = useMemo(() => {
    const base = `solana:${recipient}`;
    const params = new URLSearchParams();
    
    if (amount !== undefined) {
      params.set('amount', amount.toString());
    }
    if (label) {
      params.set('label', label);
    }
    if (message) {
      params.set('message', message);
    }
    
    const paramString = params.toString();
    return paramString ? `${base}?${paramString}` : base;
  }, [recipient, amount, label, message]);
  
  // Placeholder for QR code
  // In real implementation, use react-native-qrcode-svg
  return (
    <View style={[styles.qrContainer, { backgroundColor: theme.surface }, style]}>
      <View style={[styles.qrPlaceholder, { width: size, height: size }]}>
        <Text style={[styles.qrPlaceholderText, { color: theme.textSecondary }]}>
          QR Code
        </Text>
        <Text style={[styles.qrUrl, { color: theme.textSecondary }]}>
          {shortenAddress(recipient)}
        </Text>
        {amount !== undefined && (
          <Text style={[styles.qrAmount, { color: theme.text }]}>
            {formatSOL(amount)} SOL
          </Text>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Connect Button
  connectButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    padding: 4,
  },
  
  // Wallet List
  walletList: {
    flex: 1,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  walletInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
  },
  installedBadge: {
    fontSize: 12,
  },
  
  // Balance Display
  balanceContainer: {
    padding: 20,
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  tokenList: {
    marginTop: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tokenSymbol: {
    fontSize: 14,
  },
  tokenAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: 12,
  },
  
  // Transaction List
  transactionList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  loadingMore: {
    padding: 16,
  },
  
  // Send Form
  sendForm: {
    padding: 20,
    borderRadius: 12,
  },
  sendFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  sendButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // QR Code
  qrContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
  },
  qrUrl: {
    fontSize: 12,
    marginTop: 8,
  },
  qrAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
});
