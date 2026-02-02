/**
 * @fileoverview PRVCSH Analytics Package
 * @description Analytics dashboard and data aggregation for PRVCSH.
 * 
 * @module @prvcsh/analytics
 * @version 0.1.0
 * 
 * @example
 * ```tsx
 * import { 
 *   DataAggregator, 
 *   ChartDataGenerator,
 *   AnalyticsDashboard 
 * } from '@prvcsh/analytics';
 * 
 * // Create aggregator
 * const aggregator = new DataAggregator({
 *   rpcUrl: 'https://api.mainnet-beta.solana.com',
 *   programId: 'PRVCSH...',
 * });
 * 
 * // Start syncing
 * await aggregator.start();
 * 
 * // Get metrics
 * const metrics = aggregator.getMetrics('7d');
 * console.log('TVL:', aggregator.getTotalTVL());
 * 
 * // Use in React
 * function App() {
 *   return <AnalyticsDashboard />;
 * }
 * ```
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Aggregator
export {
  DataAggregator,
  createDataAggregator,
  type TimeRange,
  type AggregationInterval,
  type TransactionType,
  type PoolId,
  type IndexedTransaction,
  type AggregatedMetrics,
  type PoolMetrics,
  type NetworkHealth,
  type AggregatorConfig,
} from './aggregator';

// Charts
export {
  ChartDataGenerator,
  createChartGenerator,
  formatCompact,
  formatPercent,
  formatSOL,
  formatCurrency,
  DEFAULT_COLORS,
  POOL_COLORS,
  type ChartDataPoint,
  type ChartSeries,
  type VolumeChartData,
  type TVLChartData,
  type UserChartData,
  type NetworkHealthChartData,
  type PoolDistributionData,
  type ChartGeneratorConfig,
} from './charts';

// UI Components
export {
  // Theme
  DashboardThemeProvider,
  useDashboardTheme,
  defaultDashboardTheme,
  type DashboardTheme,
  
  // Components
  MetricCard,
  TimeRangeSelector,
  SimpleLineChart,
  VolumeChart,
  TVLChart,
  PoolDistribution,
  NetworkHealth,
  AnalyticsDashboard,
  
  // Types
  type MetricCardProps,
  type TimeRangeSelectorProps,
  type VolumeChartProps,
  type TVLChartProps,
  type PoolDistributionProps,
  type NetworkHealthProps,
  type AnalyticsDashboardProps,
} from './ui';
