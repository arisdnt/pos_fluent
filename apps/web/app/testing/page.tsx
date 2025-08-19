// ======================================================================
// TESTING PAGE
// Halaman utama untuk testing dan debugging aplikasi
// ======================================================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Text,
  Title1,
  Title2,
  Title3,
  Badge,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Divider,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Link,
  Spinner
} from '@fluentui/react-components';
import {
  Database24Regular,
  Settings24Regular,
  Play24Regular,
  ChartMultiple24Regular,
  Bug24Regular,


  Code24Regular,
  Info24Regular,
  Warning24Regular,
  Checkmark24Regular,
  ArrowRight24Regular
} from '@fluentui/react-icons';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TablePerformanceTest } from '@/components/tables/TablePerformanceTest';
import { UIComponentTest } from '@/components/testing/UIComponentTest';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  tests: number;
  passed: number;
  failed: number;
  duration?: number;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const testSuites: TestSuite[] = [
  {
    id: 'ui-components',
    name: 'UI Components',
    description: 'Test semua komponen UI dan interaksi pengguna',
    status: 'pending',
    tests: 25,
    passed: 0,
    failed: 0
  },
  {
    id: 'table-performance',
    name: 'Table Performance',
    description: 'Test performa tabel dengan data besar',
    status: 'pending',
    tests: 8,
    passed: 0,
    failed: 0
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Test integrasi dengan API backend',
    status: 'pending',
    tests: 15,
    passed: 0,
    failed: 0
  },
  {
    id: 'auth-security',
    name: 'Authentication & Security',
    description: 'Test sistem autentikasi dan keamanan',
    status: 'pending',
    tests: 12,
    passed: 0,
    failed: 0
  },
  {
    id: 'pos-workflow',
    name: 'POS Workflow',
    description: 'Test alur kerja sistem POS end-to-end',
    status: 'pending',
    tests: 20,
    passed: 0,
    failed: 0
  }
];

// ======================================================================
// SYSTEM INFO HOOK
// ======================================================================

const useSystemInfo = (): SystemInfo => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    userAgent: '',
    platform: '',
    language: '',
    cookieEnabled: false,
    onLine: false
  });

  useEffect(() => {
    const updateSystemInfo = () => {
      const info: SystemInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      };

      // Memory info (Chrome only)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        info.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }

      // Connection info (experimental)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        info.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        };
      }

      setSystemInfo(info);
    };

    updateSystemInfo();
    
    // Update system info periodically
    const interval = setInterval(updateSystemInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return systemInfo;
};

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function TestingPageContent() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [suites, setSuites] = useState<TestSuite[]>(testSuites);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const systemInfo = useSystemInfo();

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

  const runTestSuite = async (suiteId: string) => {
    setSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running' as const, passed: 0, failed: 0 }
        : suite
    ));

    // Simulate test execution
    const suite = suites.find(s => s.id === suiteId);
    if (!suite) return;

    const startTime = performance.now();
    
    for (let i = 0; i < suite.tests; i++) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      const passed = Math.random() > 0.1; // 90% pass rate
      
      setSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? { 
              ...s, 
              passed: s.passed + (passed ? 1 : 0),
              failed: s.failed + (passed ? 0 : 1)
            }
          : s
      ));
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { 
            ...suite, 
            status: suite.failed === 0 ? 'passed' as const : 'failed' as const,
            duration
          }
        : suite
    ));
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    
    for (const suite of suites) {
      await runTestSuite(suite.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between suites
    }
    
    setIsRunningAll(false);
  };

  const resetAllTests = () => {
    setSuites(testSuites.map(suite => ({ ...suite, status: 'pending' as const, passed: 0, failed: 0, duration: undefined })));
  };

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Information */}
      <Card className="p-6">
        <Title3 className="mb-4 flex items-center gap-2">
          <Info24Regular />
          System Information
        </Title3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Text size={200} className="text-gray-600">Platform</Text>
            <Text weight="semibold">{systemInfo.platform}</Text>
          </div>
          
          <div className="space-y-2">
            <Text size={200} className="text-gray-600">Language</Text>
            <Text weight="semibold">{systemInfo.language}</Text>
          </div>
          
          <div className="space-y-2">
            <Text size={200} className="text-gray-600">Online Status</Text>
            <Badge color={systemInfo.onLine ? 'success' : 'danger'}>
              {systemInfo.onLine ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          {systemInfo.memory && (
            <>
              <div className="space-y-2">
                <Text size={200} className="text-gray-600">Memory Used</Text>
                <Text weight="semibold">
                  {(systemInfo.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                </Text>
              </div>
              
              <div className="space-y-2">
                <Text size={200} className="text-gray-600">Memory Total</Text>
                <Text weight="semibold">
                  {(systemInfo.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                </Text>
              </div>
              
              <div className="space-y-2">
                <Text size={200} className="text-gray-600">Memory Limit</Text>
                <Text weight="semibold">
                  {(systemInfo.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
                </Text>
              </div>
            </>
          )}
          
          {systemInfo.connection && (
            <>
              <div className="space-y-2">
                <Text size={200} className="text-gray-600">Connection Type</Text>
                <Text weight="semibold">{systemInfo.connection.effectiveType}</Text>
              </div>
              
              <div className="space-y-2">
                <Text size={200} className="text-gray-600">Downlink</Text>
                <Text weight="semibold">{systemInfo.connection.downlink} Mbps</Text>
              </div>
              
              <div className="space-y-2">
                <Text size={200} className="text-gray-600">RTT</Text>
                <Text weight="semibold">{systemInfo.connection.rtt} ms</Text>
              </div>
            </>
          )}
        </div>
        
        <Divider className="my-4" />
        
        <div className="space-y-2">
          <Text size={200} className="text-gray-600">User Agent</Text>
          <Text size={200} className="font-mono break-all">{systemInfo.userAgent}</Text>
        </div>
      </Card>
      
      {/* Test Suites Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Title3 className="flex items-center gap-2">
            <Bug24Regular />
            Test Suites
          </Title3>
          
          <div className="flex items-center gap-2">
            <Button
              appearance="primary"
              onClick={runAllTests}
              disabled={isRunningAll || suites.some(s => s.status === 'running')}
            >
              {isRunningAll ? 'Running All Tests...' : 'Run All Tests'}
            </Button>
            
            <Button
              appearance="outline"
              onClick={resetAllTests}
              disabled={isRunningAll || suites.some(s => s.status === 'running')}
            >
              Reset All
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {suites.map((suite) => (
            <Card key={suite.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Text weight="semibold">{suite.name}</Text>
                    <Badge
                      color={
                        suite.status === 'passed' ? 'success' :
                        suite.status === 'failed' ? 'danger' :
                        suite.status === 'running' ? 'warning' : 'subtle'
                      }
                    >
                      {suite.status}
                    </Badge>
                    {suite.status === 'running' && <Spinner size="extra-small" />}
                  </div>
                  
                  <Text size={200} className="text-gray-600 mb-2">
                    {suite.description}
                  </Text>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <Text size={200}>
                      <span className="text-gray-600">Total:</span> {suite.tests}
                    </Text>
                    {suite.passed > 0 && (
                      <Text size={200} className="text-green-600">
                        <span className="text-gray-600">Passed:</span> {suite.passed}
                      </Text>
                    )}
                    {suite.failed > 0 && (
                      <Text size={200} className="text-red-600">
                        <span className="text-gray-600">Failed:</span> {suite.failed}
                      </Text>
                    )}
                    {suite.duration && (
                      <Text size={200} className="text-blue-600">
                        <span className="text-gray-600">Duration:</span> {suite.duration.toFixed(0)}ms
                      </Text>
                    )}
                  </div>
                </div>
                
                <Button
                  appearance="outline"
                  size="small"
                  onClick={() => runTestSuite(suite.id)}
                  disabled={suite.status === 'running' || isRunningAll}
                >
                  {suite.status === 'running' ? 'Running...' : 'Run Tests'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
      
      {/* Quick Actions */}
      <Card className="p-6">
        <Title3 className="mb-4">Quick Actions</Title3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            appearance="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setActiveTab('ui-components')}
          >
            <Settings24Regular className="w-6 h-6" />
            <Text>UI Component Tests</Text>
          </Button>
          
          <Button
            appearance="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setActiveTab('table-performance')}
          >
            <ChartMultiple24Regular className="w-6 h-6" />
            <Text>Table Performance</Text>
          </Button>
          
          <Button
            appearance="outline"
            className="h-20 flex-col gap-2"
            onClick={() => window.open('/api/health', '_blank')}
          >
            <Database24Regular className="w-6 h-6" />
            <Text>API Health Check</Text>
          </Button>
        </div>
      </Card>
    </div>
  );

  // ======================================================================
  // MAIN RENDER
  // ======================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Title1>Testing & Debugging</Title1>
        <Text className="text-gray-600 mt-1">
          Comprehensive testing suite untuk aplikasi POS Suite
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
            <Tab value="overview" icon={<Info24Regular />}>
              Overview
            </Tab>
            <Tab value="ui-components" icon={<Settings24Regular />}>
              UI Components
            </Tab>
            <Tab value="table-performance" icon={<ChartMultiple24Regular />}>
              Table Performance
            </Tab>
          </TabList>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'ui-components' && <UIComponentTest />}
      {activeTab === 'table-performance' && <TablePerformanceTest />}
    </div>
  );
}

// ======================================================================
// MAIN EXPORT
// ======================================================================

export default function TestingPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <TestingPageContent />
    </ProtectedRoute>
  );
}