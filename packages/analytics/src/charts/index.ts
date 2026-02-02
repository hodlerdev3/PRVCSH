/**
 * @fileoverview Chart Data Generators
 * @description Volume, TVL, and metrics chart data generation.
 * 
 * @module @prvcsh/analytics/charts
 * @version 0.1.0
 */

import type { TimeRange, AggregationInterval, PoolId } from './index';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Chart data point
 */
export interface ChartDataPoint {
  /** X-axis value (timestamp) */
  x: Date | number;
  
  /** Y-axis value */
  y: number;
  
  /** Optional label */
  label?: string;
}

/**
 * Chart series
 */
export interface ChartSeries {
  /** Series name */
  name: string;
  
  /** Data points */
  data: ChartDataPoint[];
  
  /** Series color */
  color?: string;
  
  /** Fill color for area charts */
  fillColor?: string;
}

/**
 * Volume chart data
 */
export interface VolumeChartData {
  /** Deposit volume series */
  deposits: ChartSeries;
  
  /** Withdrawal volume series */
  withdrawals: ChartSeries;
  
  /** Net flow series */
  netFlow: ChartSeries;
  
  /** Total volume */
  totalVolume: number;
  
  /** Volume change percentage */
  volumeChange: number;
}

/**
 * TVL chart data
 */
export interface TVLChartData {
  /** TVL over time */
  tvl: ChartSeries;
  
  /** Per-pool TVL breakdown */
  byPool: ChartSeries[];
  
  /** Current TVL */
  currentTVL: number;
  
  /** TVL change percentage */
  tvlChange: number;
  
  /** All-time high TVL */
  athTVL: number;
  
  /** ATH date */
  athDate: Date;
}

/**
 * User metrics chart data
 */
export interface UserChartData {
  /** Unique users over time */
  users: ChartSeries;
  
  /** New users */
  newUsers: ChartSeries;
  
  /** Active users (made tx in period) */
  activeUsers: ChartSeries;
  
  /** Current total users */
  totalUsers: number;
  
  /** User growth percentage */
  userGrowth: number;
}

/**
 * Network health chart data
 */
export interface NetworkHealthChartData {
  /** Proof success rate over time */
  proofSuccessRate: ChartSeries;
  
  /** Transaction success rate */
  txSuccessRate: ChartSeries;
  
  /** Average proof time */
  avgProofTime: ChartSeries;
  
  /** TPS over time */
  tps: ChartSeries;
}

/**
 * Pool distribution data
 */
export interface PoolDistributionData {
  /** Pool ID */
  pool: PoolId;
  
  /** Pool label */
  label: string;
  
  /** TVL value */
  value: number;
  
  /** Percentage of total */
  percentage: number;
  
  /** Color */
  color: string;
}

// =============================================================================
// CHART DATA GENERATOR
// =============================================================================

/**
 * Chart data generator configuration
 */
export interface ChartGeneratorConfig {
  /** Default time range */
  defaultRange?: TimeRange;
  
  /** Default interval */
  defaultInterval?: AggregationInterval;
  
  /** Color palette */
  colors?: {
    deposit: string;
    withdrawal: string;
    netPositive: string;
    netNegative: string;
    tvl: string;
    users: string;
    health: string;
  };
}

/**
 * Default color palette
 */
export const DEFAULT_COLORS = {
  deposit: '#4CAF50',
  withdrawal: '#F44336',
  netPositive: '#2196F3',
  netNegative: '#FF9800',
  tvl: '#9C27B0',
  users: '#00BCD4',
  health: '#8BC34A',
};

/**
 * Pool colors
 */
export const POOL_COLORS: Record<PoolId, string> = {
  'sol-0.1': '#E8F5E9',
  'sol-1': '#C8E6C9',
  'sol-10': '#A5D6A7',
  'sol-100': '#81C784',
  'usdc-100': '#BBDEFB',
  'usdc-1000': '#90CAF9',
};

/**
 * Chart data generator
 */
export class ChartDataGenerator {
  private config: Required<ChartGeneratorConfig>;
  
  constructor(config: ChartGeneratorConfig = {}) {
    this.config = {
      defaultRange: '7d',
      defaultInterval: 'day',
      colors: { ...DEFAULT_COLORS, ...config.colors },
      ...config,
    };
  }
  
  // =============================================================================
  // VOLUME CHARTS
  // =============================================================================
  
  /**
   * Generate volume chart data
   */
  generateVolumeChart(
    range: TimeRange = this.config.defaultRange,
    interval: AggregationInterval = this.config.defaultInterval
  ): VolumeChartData {
    const { colors } = this.config;
    const intervals = this.generateTimeIntervals(range, interval);
    
    // Generate mock data
    const deposits: ChartDataPoint[] = [];
    const withdrawals: ChartDataPoint[] = [];
    const netFlow: ChartDataPoint[] = [];
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    for (const timestamp of intervals) {
      const depositValue = Math.random() * 100 + 20;
      const withdrawalValue = Math.random() * 80 + 10;
      
      deposits.push({ x: timestamp, y: depositValue });
      withdrawals.push({ x: timestamp, y: withdrawalValue });
      netFlow.push({ x: timestamp, y: depositValue - withdrawalValue });
      
      totalDeposits += depositValue;
      totalWithdrawals += withdrawalValue;
    }
    
    const totalVolume = totalDeposits + totalWithdrawals;
    const previousTotal = totalVolume * (0.8 + Math.random() * 0.4);
    const volumeChange = ((totalVolume - previousTotal) / previousTotal) * 100;
    
    return {
      deposits: {
        name: 'Deposits',
        data: deposits,
        color: colors.deposit,
        fillColor: `${colors.deposit}40`,
      },
      withdrawals: {
        name: 'Withdrawals',
        data: withdrawals,
        color: colors.withdrawal,
        fillColor: `${colors.withdrawal}40`,
      },
      netFlow: {
        name: 'Net Flow',
        data: netFlow,
        color: colors.netPositive,
      },
      totalVolume,
      volumeChange,
    };
  }
  
  // =============================================================================
  // TVL CHARTS
  // =============================================================================
  
  /**
   * Generate TVL chart data
   */
  generateTVLChart(
    range: TimeRange = this.config.defaultRange,
    interval: AggregationInterval = this.config.defaultInterval
  ): TVLChartData {
    const { colors } = this.config;
    const intervals = this.generateTimeIntervals(range, interval);
    
    const tvlData: ChartDataPoint[] = [];
    let runningTVL = 500 + Math.random() * 200;
    let athTVL = 0;
    let athDate = new Date();
    
    for (const timestamp of intervals) {
      // Random walk
      runningTVL += (Math.random() - 0.45) * 20;
      runningTVL = Math.max(100, runningTVL);
      
      if (runningTVL > athTVL) {
        athTVL = runningTVL;
        athDate = timestamp;
      }
      
      tvlData.push({ x: timestamp, y: runningTVL });
    }
    
    const currentTVL = tvlData[tvlData.length - 1]?.y ?? 0;
    const startTVL = tvlData[0]?.y ?? currentTVL;
    const tvlChange = ((currentTVL - startTVL) / startTVL) * 100;
    
    // Generate per-pool breakdown
    const pools: PoolId[] = ['sol-0.1', 'sol-1', 'sol-10', 'sol-100', 'usdc-100', 'usdc-1000'];
    const byPool = pools.map(pool => ({
      name: pool,
      data: intervals.map(timestamp => ({
        x: timestamp,
        y: Math.random() * (currentTVL / pools.length),
      })),
      color: POOL_COLORS[pool],
    }));
    
    return {
      tvl: {
        name: 'Total Value Locked',
        data: tvlData,
        color: colors.tvl,
        fillColor: `${colors.tvl}40`,
      },
      byPool,
      currentTVL,
      tvlChange,
      athTVL,
      athDate,
    };
  }
  
  // =============================================================================
  // USER CHARTS
  // =============================================================================
  
  /**
   * Generate user metrics chart data
   */
  generateUserChart(
    range: TimeRange = this.config.defaultRange,
    interval: AggregationInterval = this.config.defaultInterval
  ): UserChartData {
    const { colors } = this.config;
    const intervals = this.generateTimeIntervals(range, interval);
    
    const users: ChartDataPoint[] = [];
    const newUsers: ChartDataPoint[] = [];
    const activeUsers: ChartDataPoint[] = [];
    
    let cumulativeUsers = 1000 + Math.floor(Math.random() * 500);
    
    for (const timestamp of intervals) {
      const newCount = Math.floor(Math.random() * 50 + 10);
      cumulativeUsers += newCount;
      
      users.push({ x: timestamp, y: cumulativeUsers });
      newUsers.push({ x: timestamp, y: newCount });
      activeUsers.push({ x: timestamp, y: Math.floor(cumulativeUsers * (0.1 + Math.random() * 0.2)) });
    }
    
    const totalUsers = users[users.length - 1]?.y ?? 0;
    const startUsers = users[0]?.y ?? totalUsers;
    const userGrowth = ((totalUsers - startUsers) / startUsers) * 100;
    
    return {
      users: {
        name: 'Total Users',
        data: users,
        color: colors.users,
        fillColor: `${colors.users}40`,
      },
      newUsers: {
        name: 'New Users',
        data: newUsers,
        color: '#66BB6A',
      },
      activeUsers: {
        name: 'Active Users',
        data: activeUsers,
        color: '#42A5F5',
      },
      totalUsers,
      userGrowth,
    };
  }
  
  // =============================================================================
  // NETWORK HEALTH CHARTS
  // =============================================================================
  
  /**
   * Generate network health chart data
   */
  generateHealthChart(
    range: TimeRange = '24h',
    interval: AggregationInterval = 'hour'
  ): NetworkHealthChartData {
    const { colors } = this.config;
    const intervals = this.generateTimeIntervals(range, interval);
    
    const proofSuccessRate: ChartDataPoint[] = [];
    const txSuccessRate: ChartDataPoint[] = [];
    const avgProofTime: ChartDataPoint[] = [];
    const tps: ChartDataPoint[] = [];
    
    for (const timestamp of intervals) {
      proofSuccessRate.push({ x: timestamp, y: 95 + Math.random() * 5 });
      txSuccessRate.push({ x: timestamp, y: 97 + Math.random() * 3 });
      avgProofTime.push({ x: timestamp, y: 1000 + Math.random() * 500 });
      tps.push({ x: timestamp, y: Math.random() * 10 + 1 });
    }
    
    return {
      proofSuccessRate: {
        name: 'Proof Success Rate (%)',
        data: proofSuccessRate,
        color: colors.health,
      },
      txSuccessRate: {
        name: 'Transaction Success Rate (%)',
        data: txSuccessRate,
        color: '#4CAF50',
      },
      avgProofTime: {
        name: 'Avg Proof Time (ms)',
        data: avgProofTime,
        color: '#FF9800',
      },
      tps: {
        name: 'TPS',
        data: tps,
        color: '#2196F3',
      },
    };
  }
  
  // =============================================================================
  // DISTRIBUTION CHARTS
  // =============================================================================
  
  /**
   * Generate pool distribution data (for pie/donut charts)
   */
  generatePoolDistribution(): PoolDistributionData[] {
    const pools: PoolId[] = ['sol-0.1', 'sol-1', 'sol-10', 'sol-100', 'usdc-100', 'usdc-1000'];
    const labels: Record<PoolId, string> = {
      'sol-0.1': '0.1 SOL Pool',
      'sol-1': '1 SOL Pool',
      'sol-10': '10 SOL Pool',
      'sol-100': '100 SOL Pool',
      'usdc-100': '100 USDC Pool',
      'usdc-1000': '1000 USDC Pool',
    };
    
    // Generate random values
    const values = pools.map(() => Math.random() * 100 + 10);
    const total = values.reduce((sum, v) => sum + v, 0);
    
    return pools.map((pool, index) => ({
      pool,
      label: labels[pool],
      value: values[index],
      percentage: (values[index] / total) * 100,
      color: POOL_COLORS[pool],
    }));
  }
  
  // =============================================================================
  // HELPERS
  // =============================================================================
  
  /**
   * Generate time intervals for a range
   */
  private generateTimeIntervals(range: TimeRange, interval: AggregationInterval): Date[] {
    const now = new Date();
    const start = this.getRangeStart(range, now);
    const intervals: Date[] = [];
    
    let current = new Date(start);
    while (current <= now) {
      intervals.push(new Date(current));
      
      switch (interval) {
        case 'minute':
          current.setMinutes(current.getMinutes() + 1);
          break;
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return intervals;
  }
  
  private getRangeStart(range: TimeRange, now: Date): Date {
    const ms: Record<TimeRange, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': now.getTime(),
    };
    
    if (range === 'all') {
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
    
    return new Date(now.getTime() - ms[range]);
  }
}

// =============================================================================
// FORMATTERS
// =============================================================================

/**
 * Format large numbers (1000 -> 1K, 1000000 -> 1M)
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format SOL value
 */
export function formatSOL(lamports: bigint | number): string {
  const value = typeof lamports === 'bigint' ? Number(lamports) / 1e9 : lamports;
  return `${value.toFixed(4)} SOL`;
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create chart data generator
 */
export function createChartGenerator(config?: ChartGeneratorConfig): ChartDataGenerator {
  return new ChartDataGenerator(config);
}
