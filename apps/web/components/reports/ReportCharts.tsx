'use client';

// ======================================================================
// REPORT CHARTS
// Komponen chart untuk visualisasi data laporan
// ======================================================================

import React from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Caption1,
  Badge,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  ChartMultipleRegular,
  ArrowTrendingRegular,
  DataBarVerticalRegular,
  ChartMultiple24Regular
} from '@fluentui/react-icons';

// ======================================================================
// STYLES
// ======================================================================

const useStyles = makeStyles({
  chartContainer: {
    width: '100%',
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  chartCard: {
    height: '400px'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: tokens.spacingHorizontalL
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px'
  },
  mockChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2
  },
  mockChartIcon: {
    fontSize: '48px'
  },
  barChart: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'space-around',
    height: '200px',
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalS
  },
  bar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS
  },
  barElement: {
    width: '40px',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: `${tokens.borderRadiusSmall} ${tokens.borderRadiusSmall} 0 0`,
    minHeight: '10px'
  },
  barLabel: {
    fontSize: '10px',
    textAlign: 'center'
  },
  pieChart: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    position: 'relative'
  },
  pieSlice: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: `conic-gradient(
      ${tokens.colorPaletteBlueForeground1} 0deg 120deg,
      ${tokens.colorPaletteGreenForeground1} 120deg 240deg,
      ${tokens.colorPaletteYellowForeground1} 240deg 300deg,
      ${tokens.colorPaletteRedForeground1} 300deg 360deg
    )`
  },
  lineChart: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'space-around',
    height: '200px',
    padding: tokens.spacingVerticalM,
    position: 'relative'
  },
  linePoint: {
    width: '8px',
    height: '8px',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: '50%',
    position: 'relative'
  },
  trendChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    gap: tokens.spacingVerticalM
  },
  trendValue: {
    fontSize: '32px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1
  },
  trendIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  }
});

// ======================================================================
// TYPES
// ======================================================================

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface SalesChartProps {
  data: TimeSeriesData[];
  title?: string;
}

interface PaymentMethodChartProps {
  data: ChartData[];
  title?: string;
}

interface ProductCategoryChartProps {
  data: ChartData[];
  title?: string;
}

interface TrendChartProps {
  current: number;
  previous: number;
  label: string;
  format?: 'currency' | 'number' | 'percentage';
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const getColorPalette = (): string[] => [
  tokens.colorPaletteBlueForeground1,
  tokens.colorPaletteGreenForeground1,
  tokens.colorPaletteYellowForeground1,
  tokens.colorPaletteRedForeground1,
  tokens.colorPalettePurpleForeground1,
  tokens.colorPaletteTealForeground1,
  tokens.colorPaletteOrangeForeground1,
  tokens.colorPalettePinkForeground1
];

// ======================================================================
// MOCK CHART COMPONENT
// ======================================================================

function MockChart({ icon, title }: { icon: React.ReactNode; title: string }) {
  const styles = useStyles();
  
  return (
    <div className={styles.mockChart}>
      <div className={styles.mockChartIcon}>{icon}</div>
      <Text>{title}</Text>
      <Caption1>Chart akan ditampilkan di sini</Caption1>
    </div>
  );
}

// ======================================================================
// SALES TREND CHART
// ======================================================================

function SalesTrendChart({ data, title = "Tren Penjualan" }: SalesChartProps) {
  const styles = useStyles();
  
  if (!data || data.length === 0) {
    return (
      <Card className={styles.chartCard}>
        <CardHeader>
          <div className={styles.chartHeader}>
            <Title3>{title}</Title3>
            <ArrowTrendingRegular />
          </div>
        </CardHeader>
        <CardPreview>
          <div className={styles.chartContainer}>
            <MockChart 
              icon={<ArrowTrendingRegular />} 
              title="Tren Penjualan Harian"
            />
          </div>
        </CardPreview>
      </Card>
    );
  }

  // Simple line chart simulation
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className={styles.chartCard}>
      <CardHeader>
        <div className={styles.chartHeader}>
          <Title3>{title}</Title3>
          <Badge appearance="outline">{data.length} hari</Badge>
        </div>
      </CardHeader>
      <CardPreview>
        <div className={styles.lineChart}>
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 150;
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  className={styles.linePoint}
                  style={{ marginBottom: `${150 - height}px` }}
                  title={`${item.date}: ${formatCurrency(item.value)}`}
                />
                <Caption1 className={styles.barLabel}>
                  {new Date(item.date).getDate()}
                </Caption1>
              </div>
            );
          })}
        </div>
      </CardPreview>
    </Card>
  );
}

// ======================================================================
// PAYMENT METHOD CHART
// ======================================================================

function PaymentMethodChart({ data, title = "Metode Pembayaran" }: PaymentMethodChartProps) {
  const styles = useStyles();
  const colors = getColorPalette();
  
  if (!data || data.length === 0) {
    return (
      <Card className={styles.chartCard}>
        <CardHeader>
          <div className={styles.chartHeader}>
            <Title3>{title}</Title3>
            <ChartMultiple24Regular />
          </div>
        </CardHeader>
        <CardPreview>
          <div className={styles.chartContainer}>
            <MockChart 
              icon={<ChartMultiple24Regular />} 
              title="Distribusi Metode Pembayaran"
            />
          </div>
        </CardPreview>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className={styles.chartCard}>
      <CardHeader>
        <div className={styles.chartHeader}>
          <Title3>{title}</Title3>
          <Badge appearance="outline">Total: {formatCurrency(total)}</Badge>
        </div>
      </CardHeader>
      <CardPreview>
        <div className={styles.pieChart}>
          <div className={styles.pieSlice} />
        </div>
        <div className={styles.legendContainer}>
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className={styles.legendItem}>
                <div 
                  className={styles.legendColor}
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <Caption1>
                  {item.label}: {percentage}%
                </Caption1>
              </div>
            );
          })}
        </div>
      </CardPreview>
    </Card>
  );
}

// ======================================================================
// PRODUCT CATEGORY CHART
// ======================================================================

function ProductCategoryChart({ data, title = "Penjualan per Kategori" }: ProductCategoryChartProps) {
  const styles = useStyles();
  
  if (!data || data.length === 0) {
    return (
      <Card className={styles.chartCard}>
        <CardHeader>
          <div className={styles.chartHeader}>
            <Title3>{title}</Title3>
            <DataBarVerticalRegular />
          </div>
        </CardHeader>
        <CardPreview>
          <div className={styles.chartContainer}>
            <MockChart 
              icon={<DataBarVerticalRegular />} 
              title="Penjualan per Kategori Produk"
            />
          </div>
        </CardPreview>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className={styles.chartCard}>
      <CardHeader>
        <div className={styles.chartHeader}>
          <Title3>{title}</Title3>
          <Badge appearance="outline">{data.length} kategori</Badge>
        </div>
      </CardHeader>
      <CardPreview>
        <div className={styles.barChart}>
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 150;
            return (
              <div key={index} className={styles.bar}>
                <div 
                  className={styles.barElement}
                  style={{ height: `${height}px` }}
                  title={`${item.label}: ${formatCurrency(item.value)}`}
                />
                <Caption1 className={styles.barLabel}>
                  {item.label}
                </Caption1>
              </div>
            );
          })}
        </div>
      </CardPreview>
    </Card>
  );
}

// ======================================================================
// TREND INDICATOR CHART
// ======================================================================

function TrendIndicatorChart({ 
  current, 
  previous, 
  label, 
  format = 'currency' 
}: TrendChartProps) {
  const styles = useStyles();
  const percentageChange = calculatePercentageChange(current, previous);
  const isPositive = percentageChange >= 0;
  
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
      default:
        return formatNumber(value);
    }
  };
  
  return (
    <Card className={styles.chartCard}>
      <CardHeader>
        <div className={styles.chartHeader}>
          <Title3>{label}</Title3>
          <ChartMultipleRegular />
        </div>
      </CardHeader>
      <CardPreview>
        <div className={styles.trendChart}>
          <div className={styles.trendValue}>
            {formatValue(current)}
          </div>
          <div className={styles.trendIndicator}>
            <ArrowTrendingRegular 
              style={{ 
                color: isPositive ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1,
                transform: isPositive ? 'none' : 'rotate(180deg)'
              }}
            />
            <Badge 
              appearance="filled"
              color={isPositive ? "success" : "danger"}
            >
              {isPositive ? '+' : ''}{formatPercentage(percentageChange)}
            </Badge>
          </div>
          <Caption1>vs periode sebelumnya</Caption1>
        </div>
      </CardPreview>
    </Card>
  );
}

// ======================================================================
// CHART GRID CONTAINER
// ======================================================================

interface ChartGridProps {
  children: React.ReactNode;
}

function ChartGrid({ children }: ChartGridProps) {
  const styles = useStyles();
  
  return (
    <div className={styles.chartGrid}>
      {children}
    </div>
  );
}

// ======================================================================
// MOCK DATA FOR TESTING
// ======================================================================

export const mockChartData = {
  salesTrend: [
    { date: '2024-01-10', value: 5000000 },
    { date: '2024-01-11', value: 7500000 },
    { date: '2024-01-12', value: 6200000 },
    { date: '2024-01-13', value: 8800000 },
    { date: '2024-01-14', value: 9500000 },
    { date: '2024-01-15', value: 11200000 },
    { date: '2024-01-16', value: 8900000 }
  ],
  paymentMethods: [
    { label: 'Tunai', value: 8800000 },
    { label: 'Kartu Debit', value: 5500000 },
    { label: 'QRIS', value: 2090000 },
    { label: 'Transfer', value: 1500000 }
  ],
  productCategories: [
    { label: 'Elektronik', value: 13800000 },
    { label: 'Aksesoris', value: 4090000 },
    { label: 'Fashion', value: 2500000 },
    { label: 'Makanan', value: 1800000 }
  ]
};

// ======================================================================
// EXPORT ALL COMPONENTS
// ======================================================================

export {
  SalesTrendChart,
  PaymentMethodChart,
  ProductCategoryChart,
  TrendIndicatorChart,
  ChartGrid
};

export type {
  ChartData,
  TimeSeriesData,
  SalesChartProps,
  PaymentMethodChartProps,
  ProductCategoryChartProps,
  TrendChartProps
};