'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Body1,
  Caption1,
  Badge,
  Spinner,
  Input,
  Label,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  PlayRegular,
  StopRegular,
  ArrowClockwise24Regular,
  DatabaseRegular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
    flexWrap: 'wrap',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: '120px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS
  },
  dataGrid: {
    height: '500px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  }
});

interface TestData {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  stok: number;
  status: string;
  tanggalDibuat: string;
  supplier: string;
  barcode: string;
  deskripsi: string;
}

interface PerformanceStats {
  totalRows: number;
  renderTime: number;
  memoryUsage: number;
  scrollPerformance: number;
  filterTime: number;
}

const generateTestData = (count: number): TestData[] => {
  const categories = ['Elektronik', 'Fashion', 'Makanan', 'Minuman', 'Aksesoris', 'Olahraga', 'Kesehatan', 'Kecantikan'];
  const suppliers = ['PT Supplier A', 'CV Supplier B', 'UD Supplier C', 'PT Supplier D', 'CV Supplier E'];
  const statuses = ['Aktif', 'Tidak Aktif', 'Habis'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `PROD${String(index + 1).padStart(6, '0')}`,
    nama: `Produk Test ${index + 1}`,
    kategori: categories[Math.floor(Math.random() * categories.length)],
    harga: Math.floor(Math.random() * 1000000) + 10000,
    stok: Math.floor(Math.random() * 100),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    tanggalDibuat: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
    barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
    deskripsi: `Deskripsi produk test ${index + 1} dengan berbagai fitur dan spesifikasi lengkap`
  }));
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusBadge = (status: string) => {
  const appearance = status === 'Aktif' ? 'filled' : status === 'Tidak Aktif' ? 'outline' : 'tint';
  const color = status === 'Aktif' ? 'success' : status === 'Tidak Aktif' ? 'danger' : 'warning';
  return <Badge appearance={appearance} color={color}>{status}</Badge>;
};

export function TablePerformanceTest() {
  const styles = useStyles();
  const [data, setData] = useState<TestData[]>([]);
  const [rowCount, setRowCount] = useState<string>('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    totalRows: 0,
    renderTime: 0,
    memoryUsage: 0,
    scrollPerformance: 0,
    filterTime: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    const startTime = performance.now();
    const filtered = data.filter(item => 
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filterTime = performance.now() - startTime;
    setStats(prev => ({ ...prev, filterTime }));
    return filtered;
  }, [data, searchTerm]);

  const columns: TableColumnDefinition<TestData>[] = [
    createTableColumn<TestData>({
      columnId: 'id',
      compare: (a, b) => a.id.localeCompare(b.id),
      renderHeaderCell: () => 'ID Produk',
      renderCell: (item) => (
        <Text font="monospace" size={200}>{item.id}</Text>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'nama',
      compare: (a, b) => a.nama.localeCompare(b.nama),
      renderHeaderCell: () => 'Nama Produk',
      renderCell: (item) => (
        <div>
          <Text weight="semibold">{item.nama}</Text>
          <br />
          <Caption1>{item.deskripsi.substring(0, 50)}...</Caption1>
        </div>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'kategori',
      compare: (a, b) => a.kategori.localeCompare(b.kategori),
      renderHeaderCell: () => 'Kategori',
      renderCell: (item) => (
        <Badge appearance="outline">{item.kategori}</Badge>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'harga',
      compare: (a, b) => a.harga - b.harga,
      renderHeaderCell: () => 'Harga',
      renderCell: (item) => (
        <Text weight="semibold">{formatCurrency(item.harga)}</Text>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'stok',
      compare: (a, b) => a.stok - b.stok,
      renderHeaderCell: () => 'Stok',
      renderCell: (item) => (
        <Text>{item.stok.toLocaleString('id-ID')}</Text>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => getStatusBadge(item.status)
    }),
    createTableColumn<TestData>({
      columnId: 'supplier',
      compare: (a, b) => a.supplier.localeCompare(b.supplier),
      renderHeaderCell: () => 'Supplier',
      renderCell: (item) => (
        <Text>{item.supplier}</Text>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'tanggalDibuat',
      compare: (a, b) => new Date(a.tanggalDibuat).getTime() - new Date(b.tanggalDibuat).getTime(),
      renderHeaderCell: () => 'Tanggal Dibuat',
      renderCell: (item) => (
        <Text>{formatDate(item.tanggalDibuat)}</Text>
      )
    }),
    createTableColumn<TestData>({
      columnId: 'barcode',
      compare: (a, b) => a.barcode.localeCompare(b.barcode),
      renderHeaderCell: () => 'Barcode',
      renderCell: (item) => (
        <Text font="monospace" size={200}>{item.barcode}</Text>
      )
    })
  ];

  const generateData = async () => {
    setIsLoading(true);
    setIsRunning(true);
    
    const startTime = performance.now();
    const count = parseInt(rowCount) || 1000;
    
    // Simulate async data generation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newData = generateTestData(count);
    const renderTime = performance.now() - startTime;
    
    setData(newData);
    setStats({
      totalRows: count,
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      scrollPerformance: 0,
      filterTime: 0
    });
    
    setIsLoading(false);
    setIsRunning(false);
  };

  const clearData = () => {
    setData([]);
    setStats({
      totalRows: 0,
      renderTime: 0,
      memoryUsage: 0,
      scrollPerformance: 0,
      filterTime: 0
    });
    setSearchTerm('');
  };

  const measureScrollPerformance = () => {
    const startTime = performance.now();
    // Simulate scroll measurement
    setTimeout(() => {
      const scrollTime = performance.now() - startTime;
      setStats(prev => ({ ...prev, scrollPerformance: scrollTime }));
    }, 100);
  };

  useEffect(() => {
    if (data.length > 0) {
      measureScrollPerformance();
    }
  }, [data]);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={<Title3>Test Performa Tabel</Title3>}
          description="Uji performa rendering dan scroll untuk data dalam jumlah besar"
        />
        
        <CardPreview>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <Label htmlFor="rowCount">Jumlah Baris</Label>
              <Input
                id="rowCount"
                value={rowCount}
                onChange={(e) => setRowCount(e.target.value)}
                placeholder="1000"
                type="number"
              />
            </div>
            
            <div className={styles.controlGroup}>
              <Label htmlFor="search">Pencarian</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari produk..."
              />
            </div>
            
            <div className={styles.controlGroup}>
              <Label>&nbsp;</Label>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Button
                  appearance="primary"
                  icon={<PlayRegular />}
                  onClick={generateData}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Data'}
                </Button>
                
                <Button
                  icon={<ArrowClockwise24Regular />}
                  onClick={clearData}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* Performance Stats */}
      <div className={styles.stats}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalRows.toLocaleString('id-ID')}</div>
          <Caption1>Total Baris</Caption1>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.renderTime.toFixed(2)}ms</div>
          <Caption1>Waktu Render</Caption1>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statValue}>
            {stats.memoryUsage ? (stats.memoryUsage / 1024 / 1024).toFixed(2) : '0'}MB
          </div>
          <Caption1>Penggunaan Memori</Caption1>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats.filterTime.toFixed(2)}ms</div>
          <Caption1>Waktu Filter</Caption1>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{filteredData.length.toLocaleString('id-ID')}</div>
          <Caption1>Hasil Filter</Caption1>
        </Card>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <Body1>Generating {rowCount} rows of test data...</Body1>
        </div>
      ) : data.length > 0 ? (
        <Card>
          <CardHeader
            header={<Title3>Data Test ({filteredData.length.toLocaleString('id-ID')} baris)</Title3>}
            description="Scroll dan filter untuk menguji performa"
          />
          
          <CardPreview>
            <DataGrid
              items={filteredData}
              columns={columns}
              sortable
              className={styles.dataGrid}
              getRowId={(item) => item.id}
            />
          </CardPreview>
        </Card>
      ) : (
        <Card className={styles.statCard}>
          <DatabaseRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
          <Body1>Klik "Generate Data" untuk memulai test performa</Body1>
        </Card>
      )}
    </div>
  );
}

export default TablePerformanceTest;