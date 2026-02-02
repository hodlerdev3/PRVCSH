/**
 * @fileoverview Analytics Dashboard UI Components
 * @description React components for analytics visualization.
 * 
 * @module @prvcsh/analytics/ui
 * @version 0.1.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  TimeRange,
  VolumeChartData,
  TVLChartData,
  UserChartData,
  NetworkHealthChartData,
  PoolDistributionData,
  ChartSeries,
} from '../charts';
import { createChartGenerator, formatCompact, formatPercent, formatSOL } from '../charts';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Common chart props
 */
interface ChartProps {
  /** Height in pixels */
  height?: number;
  
  /** Show legend */
  showLegend?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Dashboard theme
 */
export interface DashboardTheme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  positive: string;
  negative: string;
  accent: string;
}

/**
 * Default dashboard theme
 */
export const defaultDashboardTheme: DashboardTheme = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#888888',
  border: '#333333',
  positive: '#4CAF50',
  negative: '#F44336',
  accent: '#9945FF',
};

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = React.createContext<DashboardTheme>(defaultDashboardTheme);

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  theme?: Partial<DashboardTheme>;
  children: React.ReactNode;
}

/**
 * Dashboard theme provider
 */
export function DashboardThemeProvider({ theme, children }: ThemeProviderProps): React.ReactElement {
  const mergedTheme = useMemo(() => ({
    ...defaultDashboardTheme,
    ...theme,
  }), [theme]);
  
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Use dashboard theme
 */
export function useDashboardTheme(): DashboardTheme {
  return React.useContext(ThemeContext);
}

// =============================================================================
// METRIC CARD
// =============================================================================

/**
 * Metric card props
 */
export interface MetricCardProps {
  /** Card title */
  title: string;
  
  /** Main value */
  value: string | number;
  
  /** Change percentage */
  change?: number;
  
  /** Subtitle or additional info */
  subtitle?: string;
  
  /** Icon */
  icon?: React.ReactNode;
  
  /** Loading state */
  loading?: boolean;
  
  /** Custom class */
  className?: string;
}

/**
 * Metric card component
 */
export function MetricCard({
  title,
  value,
  change,
  subtitle,
  icon,
  loading = false,
  className = '',
}: MetricCardProps): React.ReactElement {
  const theme = useDashboardTheme();
  
  const changeColor = change !== undefined
    ? change >= 0 ? theme.positive : theme.negative
    : theme.textSecondary;
  
  return (
    <div
      className={`metric-card ${className}`}
      style={{
        backgroundColor: theme.surface,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: theme.textSecondary, fontSize: '14px' }}>{title}</span>
        {icon && <span style={{ color: theme.textSecondary }}>{icon}</span>}
      </div>
      
      {loading ? (
        <div style={{ height: '40px', marginTop: '8px' }}>
          <div
            style={{
              width: '120px',
              height: '28px',
              backgroundColor: theme.border,
              borderRadius: '4px',
              animation: 'pulse 2s infinite',
            }}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: theme.text,
              marginTop: '8px',
            }}
          >
            {typeof value === 'number' ? formatCompact(value) : value}
          </div>
          
          {change !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ color: changeColor, fontSize: '14px' }}>
                {formatPercent(change)}
              </span>
              {subtitle && (
                <span style={{ color: theme.textSecondary, fontSize: '12px' }}>
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// TIME RANGE SELECTOR
// =============================================================================

/**
 * Time range selector props
 */
export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  options?: TimeRange[];
  className?: string;
}

/**
 * Time range selector
 */
export function TimeRangeSelector({
  value,
  onChange,
  options = ['24h', '7d', '30d', '90d', '1y', 'all'],
  className = '',
}: TimeRangeSelectorProps): React.ReactElement {
  const theme = useDashboardTheme();
  
  const labels: Record<TimeRange, string> = {
    '1h': '1H',
    '24h': '24H',
    '7d': '7D',
    '30d': '30D',
    '90d': '90D',
    '1y': '1Y',
    'all': 'All',
  };
  
  return (
    <div
      className={`time-range-selector ${className}`}
      style={{
        display: 'flex',
        gap: '4px',
        backgroundColor: theme.surface,
        borderRadius: '8px',
        padding: '4px',
      }}
    >
      {options.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: value === range ? theme.accent : 'transparent',
            color: value === range ? '#ffffff' : theme.textSecondary,
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {labels[range]}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// SIMPLE LINE CHART (SVG-based, no dependencies)
// =============================================================================

/**
 * Simple line chart props
 */
interface SimpleLineChartProps extends ChartProps {
  series: ChartSeries[];
  showGrid?: boolean;
  showTooltip?: boolean;
}

/**
 * Simple SVG line chart
 */
export function SimpleLineChart({
  series,
  height = 200,
  showGrid = true,
  showLegend = true,
  className = '',
}: SimpleLineChartProps): React.ReactElement {
  const theme = useDashboardTheme();
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number } | null>(null);
  
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const { minY, maxY, xScale, yScale } = useMemo(() => {
    const allValues = series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allValues) * 0.9;
    const maxY = Math.max(...allValues) * 1.1;
    
    const xScale = (index: number, total: number) =>
      padding.left + (index / (total - 1)) * chartWidth;
    
    const yScale = (value: number) =>
      padding.top + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
    
    return { minY, maxY, xScale, yScale };
  }, [series, chartWidth, chartHeight, padding.left, padding.top]);
  
  // Generate path for each series
  const paths = useMemo(() => {
    return series.map(s => {
      const points = s.data.map((d, i) => ({
        x: xScale(i, s.data.length),
        y: yScale(d.y),
      }));
      
      const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');
      
      // Area path
      const areaPath = s.fillColor
        ? `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
        : undefined;
      
      return { series: s, pathData, areaPath, points };
    });
  }, [series, xScale, yScale, chartHeight, padding.top]);
  
  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines: Array<{ y: number; label: string }> = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = minY + (maxY - minY) * (i / steps);
      lines.push({
        y: yScale(value),
        label: formatCompact(value),
      });
    }
    return lines;
  }, [minY, maxY, yScale]);
  
  return (
    <div className={`simple-line-chart ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {showGrid && gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke={theme.border}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={line.y + 4}
              textAnchor="end"
              fill={theme.textSecondary}
              fontSize="10"
            >
              {line.label}
            </text>
          </g>
        ))}
        
        {/* Series */}
        {paths.map(({ series: s, pathData, areaPath, points }, i) => (
          <g key={i}>
            {/* Area fill */}
            {areaPath && (
              <path d={areaPath} fill={s.fillColor} />
            )}
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
            />
            
            {/* Points (for hover) */}
            {points.map((p, j) => (
              <circle
                key={j}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={s.color}
                opacity={hoveredPoint?.x === p.x ? 1 : 0}
                onMouseEnter={() => setHoveredPoint({ ...p, value: s.data[j].y })}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </g>
        ))}
        
        {/* Tooltip */}
        {hoveredPoint && (
          <g>
            <rect
              x={hoveredPoint.x - 40}
              y={hoveredPoint.y - 35}
              width="80"
              height="25"
              rx="4"
              fill={theme.surface}
              stroke={theme.border}
            />
            <text
              x={hoveredPoint.x}
              y={hoveredPoint.y - 18}
              textAnchor="middle"
              fill={theme.text}
              fontSize="12"
            >
              {formatCompact(hoveredPoint.value)}
            </text>
          </g>
        )}
      </svg>
      
      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center' }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: s.color,
                }}
              />
              <span style={{ color: theme.textSecondary, fontSize: '12px' }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VOLUME CHART
// =============================================================================

/**
 * Volume chart props
 */
export interface VolumeChartProps extends ChartProps {
  range?: TimeRange;
  data?: VolumeChartData;
}

/**
 * Volume chart component
 */
export function VolumeChart({
  range = '7d',
  data,
  height = 300,
  showLegend = true,
  className = '',
}: VolumeChartProps): React.ReactElement {
  const theme = useDashboardTheme();
  const generator = useMemo(() => createChartGenerator(), []);
  
  const chartData = useMemo(() => {
    return data ?? generator.generateVolumeChart(range);
  }, [data, generator, range]);
  
  return (
    <div className={`volume-chart ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ color: theme.text, margin: 0 }}>Volume</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: '600', color: theme.text }}>
              {formatCompact(chartData.totalVolume)} SOL
            </span>
            <span style={{ color: chartData.volumeChange >= 0 ? theme.positive : theme.negative }}>
              {formatPercent(chartData.volumeChange)}
            </span>
          </div>
        </div>
      </div>
      
      <SimpleLineChart
        series={[chartData.deposits, chartData.withdrawals]}
        height={height}
        showLegend={showLegend}
      />
    </div>
  );
}

// =============================================================================
// TVL CHART
// =============================================================================

/**
 * TVL chart props
 */
export interface TVLChartProps extends ChartProps {
  range?: TimeRange;
  data?: TVLChartData;
}

/**
 * TVL chart component
 */
export function TVLChart({
  range = '7d',
  data,
  height = 300,
  showLegend = true,
  className = '',
}: TVLChartProps): React.ReactElement {
  const theme = useDashboardTheme();
  const generator = useMemo(() => createChartGenerator(), []);
  
  const chartData = useMemo(() => {
    return data ?? generator.generateTVLChart(range);
  }, [data, generator, range]);
  
  return (
    <div className={`tvl-chart ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ color: theme.text, margin: 0 }}>Total Value Locked</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: '600', color: theme.text }}>
              {formatCompact(chartData.currentTVL)} SOL
            </span>
            <span style={{ color: chartData.tvlChange >= 0 ? theme.positive : theme.negative }}>
              {formatPercent(chartData.tvlChange)}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: theme.textSecondary, fontSize: '12px' }}>ATH</span>
          <div style={{ color: theme.accent, fontWeight: '500' }}>
            {formatCompact(chartData.athTVL)} SOL
          </div>
        </div>
      </div>
      
      <SimpleLineChart
        series={[chartData.tvl]}
        height={height}
        showLegend={showLegend}
      />
    </div>
  );
}

// =============================================================================
// POOL DISTRIBUTION
// =============================================================================

/**
 * Pool distribution props
 */
export interface PoolDistributionProps {
  data?: PoolDistributionData[];
  className?: string;
}

/**
 * Pool distribution (simple bar representation)
 */
export function PoolDistribution({
  data,
  className = '',
}: PoolDistributionProps): React.ReactElement {
  const theme = useDashboardTheme();
  const generator = useMemo(() => createChartGenerator(), []);
  
  const pools = useMemo(() => {
    return data ?? generator.generatePoolDistribution();
  }, [data, generator]);
  
  return (
    <div className={`pool-distribution ${className}`}>
      <h3 style={{ color: theme.text, margin: '0 0 16px 0' }}>Pool Distribution</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pools.map((pool) => (
          <div key={pool.pool}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: theme.text, fontSize: '14px' }}>{pool.label}</span>
              <span style={{ color: theme.textSecondary, fontSize: '14px' }}>
                {formatCompact(pool.value)} SOL ({pool.percentage.toFixed(1)}%)
              </span>
            </div>
            <div
              style={{
                height: '8px',
                backgroundColor: theme.border,
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pool.percentage}%`,
                  height: '100%',
                  backgroundColor: pool.color,
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// NETWORK HEALTH
// =============================================================================

/**
 * Network health props
 */
export interface NetworkHealthProps {
  className?: string;
}

/**
 * Network health indicator
 */
export function NetworkHealth({ className = '' }: NetworkHealthProps): React.ReactElement {
  const theme = useDashboardTheme();
  
  const healthMetrics = [
    { label: 'Proof Success', value: 98.5, unit: '%', status: 'healthy' },
    { label: 'Tx Success', value: 99.2, unit: '%', status: 'healthy' },
    { label: 'Avg Proof Time', value: 1.2, unit: 's', status: 'healthy' },
    { label: 'Relayer Status', value: 'Online', unit: '', status: 'healthy' },
  ];
  
  const statusColors: Record<string, string> = {
    healthy: theme.positive,
    degraded: '#FF9800',
    down: theme.negative,
  };
  
  return (
    <div className={`network-health ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: theme.positive,
            boxShadow: `0 0 8px ${theme.positive}`,
          }}
        />
        <h3 style={{ color: theme.text, margin: 0 }}>Network Health</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {healthMetrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              padding: '12px',
              backgroundColor: theme.background,
              borderRadius: '8px',
            }}
          >
            <div style={{ color: theme.textSecondary, fontSize: '12px' }}>{metric.label}</div>
            <div style={{ color: statusColors[metric.status], fontSize: '18px', fontWeight: '600' }}>
              {metric.value}{metric.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// DASHBOARD
// =============================================================================

/**
 * Dashboard props
 */
export interface AnalyticsDashboardProps {
  theme?: Partial<DashboardTheme>;
  className?: string;
}

/**
 * Full analytics dashboard
 */
export function AnalyticsDashboard({
  theme,
  className = '',
}: AnalyticsDashboardProps): React.ReactElement {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const defaultTheme = useDashboardTheme();
  const mergedTheme = { ...defaultTheme, ...theme };
  
  return (
    <DashboardThemeProvider theme={mergedTheme}>
      <div
        className={`analytics-dashboard ${className}`}
        style={{
          backgroundColor: mergedTheme.background,
          padding: '24px',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: mergedTheme.text, margin: 0 }}>Analytics Dashboard</h1>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
        
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <MetricCard title="Total Value Locked" value={1234567} change={12.5} subtitle="vs last period" />
          <MetricCard title="24h Volume" value={98765} change={-3.2} subtitle="vs yesterday" />
          <MetricCard title="Total Users" value={5678} change={8.7} subtitle="unique addresses" />
          <MetricCard title="Transactions" value={12345} change={5.1} subtitle="all time" />
        </div>
        
        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: mergedTheme.surface, borderRadius: '12px', padding: '20px' }}>
            <TVLChart range={timeRange} />
          </div>
          <div style={{ backgroundColor: mergedTheme.surface, borderRadius: '12px', padding: '20px' }}>
            <VolumeChart range={timeRange} />
          </div>
        </div>
        
        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: mergedTheme.surface, borderRadius: '12px', padding: '20px' }}>
            <PoolDistribution />
          </div>
          <div style={{ backgroundColor: mergedTheme.surface, borderRadius: '12px', padding: '20px' }}>
            <NetworkHealth />
          </div>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}
