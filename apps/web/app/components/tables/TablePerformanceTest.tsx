// ======================================================================
// TABLE PERFORMANCE TEST
// Komponen untuk testing performa tabel dengan data besar
// ======================================================================

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  Button,
  Text,
  Title1,
  Title2,
  Title3,
  Input,
  Dropdown,
  Option,
  Field,
  Switch,
  Badge,
  ProgressBar,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Divider,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent
} from '@fluentui/react-components';
import {
  Play24Regular,
  Stop24Regular,
  ArrowClockwise24Regular,
  Database24Regular,
  Timer24Regular,
  ChartMultiple24Regular,
  Settings24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Info24Regular
} from '@fluentui/react-icons';
import { OptimizedDataTable } from './OptimizedDataTable';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface TestData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  amount: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  category: string;
  description: string;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataSize: number;
  virtualizedRows: number;
  totalRows: number;
  fps: number;
  timestamp: number;
}

interface TestConfig {
  dataSize: number;
  enableVirtualization: boolean;
  enablePagination: boolean;
  pageSize: number;
  enableSorting: boolean;
  enableFiltering: boolean;
  enableRowSelection: boolean;
  maxHeight: number;
}

// ======================================================================
// MOCK DATA GENERATOR
// ======================================================================

const generateMockData = (count: number): TestData[] => {
  const statuses: TestData['status'][] = ['active', 'inactive', 'pending'];
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Beauty', 'Automotive'];
  const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang'];
  const countries = ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Philippines'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `id-${index + 1}`,
    name: `User ${index + 1}`,
    email: `user${index + 1}@example.com`,
    phone: `+62${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
    address: `Jl. Test No. ${index + 1}`,
    city: cities[Math.floor(Math.random() * cities.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    amount: Math.floor(Math.random() * 10000000) + 10000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    category: categories[Math.floor(Math.random() * categories.length)],
    description: `Description for item ${index + 1} with some random text to test rendering performance.`
  }));
};

// ======================================================================
// PERFORMANCE MONITOR
// ======================================================================

const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setMetrics([]);
    
    const interval = setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const newMetrics: PerformanceMetrics = {
          renderTime: performance.now(),
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
          dataSize: 0,
          virtualizedRows: 0,
          totalRows: 0,
          fps: 0,
          timestamp: Date.now()
        };
        
        setCurrentMetrics(newMetrics);
        setMetrics(prev => [...prev.slice(-50), newMetrics]); // Keep last 50 measurements
      }
    }, 100);

    return interval;
  }, []);

  const stopMonitoring = useCallback((interval: NodeJS.Timeout) => {
    setIsMonitoring(false);
    clearInterval(interval);
  }, []);

  return {
    metrics,
    currentMetrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

// ======================================================================
// TABLE COLUMNS
// ======================================================================

const createTestColumns = (): ColumnDef<TestData>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 100,
    cell: ({ getValue }) => (
      <Text size={200} className="font-mono">{getValue<string>()}</Text>
    )
  },
  {
    accessorKey: 'name',
    header: 'Nama',
    size: 150,
    cell: ({ getValue }) => (
      <Text weight="semibold">{getValue<string>()}</Text>
    )
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 200,
    cell: ({ getValue }) => (
      <Text className="text-blue-600">{getValue<string>()}</Text>
    )
  },
  {
    accessorKey: 'phone',
    header: 'Telepon',
    size: 150,
    cell: ({ getValue }) => (
      <Text className="font-mono">{getValue<string>()}</Text>
    )
  },
  {
    accessorKey: 'city',
    header: 'Kota',
    size: 120,
    cell: ({ getValue }) => getValue<string>()
  },
  {
    accessorKey: 'amount',
    header: 'Jumlah',
    size: 120,
    cell: ({ getValue }) => (
      <Text weight="semibold">{formatCurrency(getValue<number>())}</Text>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ getValue }) => {
      const status = getValue<TestData['status']>();
      const statusConfig = {
        active: { color: 'success' as const, text: 'Aktif' },
        inactive: { color: 'danger' as const, text: 'Nonaktif' },
        pending: { color: 'warning' as const, text: 'Pending' }
      };
      const config = statusConfig[status];
      return <Badge color={config.color}>{config.text}</Badge>;
    }
  },
  {
    accessorKey: 'category',
    header: 'Kategori',
    size: 120,
    cell: ({ getValue }) => getValue<string>()
  },
  {
    accessorKey: 'created_at',
    header: 'Dibuat',
    size: 150,
    cell: ({ getValue }) => (
      <Text size={200}>
        {new Date(getValue<string>()).toLocaleDateString('id-ID')}
      </Text>
    )
  }
];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export function TablePerformanceTest() {
  const [activeTab, setActiveTab] = useState<string>('test');
  const [testData, setTestData] = useState<TestData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    dataSize: 1000,
    enableVirtualization: false,
    enablePagination: true,
    pageSize: 50,
    enableSorting: true,
    enableFiltering: true,
    enableRowSelection: false,
    maxHeight: 600
  });
  
  const {
    metrics,
    currentMetrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  } = usePerformanceMonitor();
  
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // ======================================================================
  // MEMOIZED VALUES
  // ======================================================================

  const columns = useMemo(() => createTestColumns(), []);
  
  const averageMetrics = useMemo(() => {
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((acc, metric) => ({
      renderTime: acc.renderTime + metric.renderTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      fps: acc.fps + metric.fps
    }), { renderTime: 0, memoryUsage: 0, fps: 0 });
    
    return {
      renderTime: sum.renderTime / metrics.length,
      memoryUsage: sum.memoryUsage / metrics.length,
      fps: sum.fps / metrics.length
    };
  }, [metrics]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleGenerateData = useCallback(async () => {
    setIsGenerating(true);
    
    // Simulate data generation delay for large datasets
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const startTime = performance.now();
    const newData = generateMockData(testConfig.dataSize);
    const endTime = performance.now();
    
    console.log(`Generated ${testConfig.dataSize} records in ${(endTime - startTime).toFixed(2)}ms`);
    
    setTestData(newData);
    setIsGenerating(false);
  }, [testConfig.dataSize]);

  const handleStartMonitoring = useCallback(() => {
    const interval = startMonitoring();
    setMonitoringInterval(interval);
  }, [startMonitoring]);

  const handleStopMonitoring = useCallback(() => {
    if (monitoringInterval) {
      stopMonitoring(monitoringInterval);
      setMonitoringInterval(null);
    }
  }, [monitoringInterval, stopMonitoring]);

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

  const handleConfigChange = <K extends keyof TestConfig>(
    key: K,
    value: TestConfig[K]
  ) => {
    setTestConfig(prev => ({ ...prev, [key]: value }));
  };

  // ======================================================================
  // EFFECTS
  // ======================================================================

  useEffect(() => {
    // Generate initial data
    handleGenerateData();
  }, []);

  useEffect(() => {
    // Cleanup monitoring on unmount
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderTestConfiguration = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <Title3 className="mb-4 flex items-center gap-2">
          <Settings24Regular />
          Konfigurasi Test
        </Title3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Jumlah Data">
            <Dropdown
              value={testConfig.dataSize.toString()}
              onOptionSelect={(e, data) => handleConfigChange('dataSize', parseInt(data.optionValue || '1000'))}
            >
              <Option value="100">100 records</Option>
              <Option value="500">500 records</Option>
              <Option value="1000">1,000 records</Option>
              <Option value="5000">5,000 records</Option>
              <Option value="10000">10,000 records</Option>
              <Option value="25000">25,000 records</Option>
              <Option value="50000">50,000 records</Option>
              <Option value="100000">100,000 records</Option>
            </Dropdown>
          </Field>
          
          <Field label="Page Size">
            <Dropdown
              value={testConfig.pageSize.toString()}
              onOptionSelect={(e, data) => handleConfigChange('pageSize', parseInt(data.optionValue || '50'))}
              disabled={!testConfig.enablePagination}
            >
              <Option value="10">10</Option>
              <Option value="25">25</Option>
              <Option value="50">50</Option>
              <Option value="100">100</Option>
              <Option value="200">200</Option>
            </Dropdown>
          </Field>
          
          <Field label="Max Height (px)">
            <Input
              type="number"
              value={testConfig.maxHeight.toString()}
              onChange={(e) => handleConfigChange('maxHeight', parseInt(e.target.value) || 600)}
            />
          </Field>
        </div>
        
        <Divider className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field>
            <Switch
              checked={testConfig.enableVirtualization}
              onChange={(e, data) => handleConfigChange('enableVirtualization', data.checked)}
              label="Virtualization"
            />
          </Field>
          
          <Field>
            <Switch
              checked={testConfig.enablePagination}
              onChange={(e, data) => handleConfigChange('enablePagination', data.checked)}
              label="Pagination"
            />
          </Field>
          
          <Field>
            <Switch
              checked={testConfig.enableSorting}
              onChange={(e, data) => handleConfigChange('enableSorting', data.checked)}
              label="Sorting"
            />
          </Field>
          
          <Field>
            <Switch
              checked={testConfig.enableFiltering}
              onChange={(e, data) => handleConfigChange('enableFiltering', data.checked)}
              label="Filtering"
            />
          </Field>
          
          <Field>
            <Switch
              checked={testConfig.enableRowSelection}
              onChange={(e, data) => handleConfigChange('enableRowSelection', data.checked)}
              label="Row Selection"
            />
          </Field>
        </div>
        
        <Divider className="my-4" />
        
        <div className="flex items-center gap-4">
          <Button
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={handleGenerateData}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Data'}
          </Button>
          
          {!isMonitoring ? (
            <Button
              appearance="outline"
              icon={<Play24Regular />}
              onClick={handleStartMonitoring}
            >
              Start Monitoring
            </Button>
          ) : (
            <Button
              appearance="outline"
              icon={<Stop24Regular />}
              onClick={handleStopMonitoring}
            >
              Stop Monitoring
            </Button>
          )}
        </div>
      </Card>
      
      {/* Performance Metrics */}
      {currentMetrics && (
        <Card className="p-6">
          <Title3 className="mb-4 flex items-center gap-2">
            <ChartMultiple24Regular />
            Performance Metrics
          </Title3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Text size={200} className="text-gray-600">Memory Usage</Text>
              <Text size={400} weight="semibold" className="block">
                {currentMetrics.memoryUsage.toFixed(2)} MB
              </Text>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <Text size={200} className="text-gray-600">Data Size</Text>
              <Text size={400} weight="semibold" className="block">
                {testData.length.toLocaleString('id-ID')} records
              </Text>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <Text size={200} className="text-gray-600">Configuration</Text>
              <Text size={400} weight="semibold" className="block">
                {testConfig.enableVirtualization ? 'Virtualized' : 'Standard'}
                {testConfig.enablePagination ? ' + Paginated' : ''}
              </Text>
            </div>
          </div>
          
          {averageMetrics && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Text size={300} weight="semibold" className="mb-2 block">Average Performance</Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Text size={200} className="text-gray-600">Avg Memory</Text>
                  <Text size={300} weight="semibold">
                    {averageMetrics.memoryUsage.toFixed(2)} MB
                  </Text>
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Measurements</Text>
                  <Text size={300} weight="semibold">
                    {metrics.length} samples
                  </Text>
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Status</Text>
                  <Badge color={isMonitoring ? 'success' : 'warning'}>
                    {isMonitoring ? 'Monitoring' : 'Stopped'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );

  const renderPerformanceAnalysis = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <Title3 className="mb-4">Performance Analysis</Title3>
        
        {metrics.length === 0 ? (
          <div className="text-center py-8">
            <Timer24Regular className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-600">No performance data available. Start monitoring to collect metrics.</Text>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <Text size={200} className="text-gray-600">Total Samples</Text>
                <Text size={400} weight="semibold" className="block">
                  {metrics.length}
                </Text>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <Text size={200} className="text-gray-600">Data Size</Text>
                <Text size={400} weight="semibold" className="block">
                  {testData.length.toLocaleString('id-ID')}
                </Text>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <Text size={200} className="text-gray-600">Virtualization</Text>
                <Badge color={testConfig.enableVirtualization ? 'success' : 'warning'}>
                  {testConfig.enableVirtualization ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <Text size={200} className="text-gray-600">Pagination</Text>
                <Badge color={testConfig.enablePagination ? 'success' : 'warning'}>
                  {testConfig.enablePagination ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            
            {averageMetrics && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <Text size={300} weight="semibold" className="mb-3 block">Performance Summary</Text>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Text size={200} className="text-gray-600">Average Memory Usage</Text>
                    <Text size={400} weight="semibold">
                      {averageMetrics.memoryUsage.toFixed(2)} MB
                    </Text>
                  </div>
                  <div>
                    <Text size={200} className="text-gray-600">Peak Memory</Text>
                    <Text size={400} weight="semibold">
                      {Math.max(...metrics.map(m => m.memoryUsage)).toFixed(2)} MB
                    </Text>
                  </div>
                  <div>
                    <Text size={200} className="text-gray-600">Memory Efficiency</Text>
                    <Text size={400} weight="semibold">
                      {(testData.length / averageMetrics.memoryUsage).toFixed(0)} records/MB
                    </Text>
                  </div>
                </div>
              </div>
            )}
            
            {/* Performance Recommendations */}
            <div className="space-y-3">
              <Text size={300} weight="semibold">Recommendations</Text>
              
              {testData.length > 1000 && !testConfig.enableVirtualization && !testConfig.enablePagination && (
                <MessageBar intent="warning">
                  <MessageBarBody>
                    <MessageBarTitle>Performance Warning</MessageBarTitle>
                    Consider enabling virtualization or pagination for datasets larger than 1,000 records.
                  </MessageBarBody>
                </MessageBar>
              )}
              
              {testData.length > 10000 && !testConfig.enableVirtualization && (
                <MessageBar intent="error">
                  <MessageBarBody>
                    <MessageBarTitle>Performance Critical</MessageBarTitle>
                    Virtualization is highly recommended for datasets larger than 10,000 records.
                  </MessageBarBody>
                </MessageBar>
              )}
              
              {testConfig.enableVirtualization && testConfig.enablePagination && (
                <MessageBar intent="info">
                  <MessageBarBody>
                    <MessageBarTitle>Configuration Note</MessageBarTitle>
                    Virtualization and pagination are both enabled. Consider using only one for optimal performance.
                  </MessageBarBody>
                </MessageBar>
              )}
              
              {averageMetrics && averageMetrics.memoryUsage < 50 && (
                <MessageBar intent="success">
                  <MessageBarBody>
                    <MessageBarTitle>Good Performance</MessageBarTitle>
                    Memory usage is within acceptable limits. Current configuration is optimal.
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderDataTable = () => (
    <div className="space-y-4">
      {isGenerating && (
        <MessageBar intent="info">
          <MessageBarBody>
            <MessageBarTitle>Generating Data</MessageBarTitle>
            Generating {testConfig.dataSize.toLocaleString('id-ID')} test records...
          </MessageBarBody>
        </MessageBar>
      )}
      
      <OptimizedDataTable
        data={testData}
        columns={columns}
        isLoading={isGenerating}
        enableSorting={testConfig.enableSorting}
        enableFiltering={testConfig.enableFiltering}
        enablePagination={testConfig.enablePagination}
        enableVirtualization={testConfig.enableVirtualization}
        enableRowSelection={testConfig.enableRowSelection}
        enableColumnVisibility={true}
        pageSize={testConfig.pageSize}
        maxHeight={testConfig.maxHeight}
        searchPlaceholder="Cari nama, email, atau kota..."
        onRowClick={(row) => console.log('Row clicked:', row)}
        onRowSelect={(rows) => console.log('Rows selected:', rows.length)}
        onExport={() => console.log('Export clicked')}
        onRefresh={handleGenerateData}
      />
    </div>
  );

  // ======================================================================
  // MAIN RENDER
  // ======================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Title1>Table Performance Test</Title1>
        <Text className="text-gray-600 mt-1">
          Test performa tabel dengan berbagai konfigurasi dan ukuran data
        </Text>
      </div>

      {/* Tabs */}
      <Card>
        <div className="p-4">
          <TabList
            selectedValue={activeTab}
            onTabSelect={handleTabSelect}
            size="large"
          >
            <Tab value="test" icon={<Settings24Regular />}>
              Configuration
            </Tab>
            <Tab value="table" icon={<Database24Regular />}>
              Data Table
            </Tab>
            <Tab value="analysis" icon={<ChartMultiple24Regular />}>
              Performance Analysis
            </Tab>
          </TabList>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'test' && renderTestConfiguration()}
      {activeTab === 'table' && renderDataTable()}
      {activeTab === 'analysis' && renderPerformanceAnalysis()}
    </div>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default TablePerformanceTest;