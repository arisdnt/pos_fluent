// ======================================================================
// UI COMPONENT TEST
// Komponen untuk testing berbagai komponen UI dan interaksi
// ======================================================================

'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  SelectTabEvent,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Checkbox,
  Radio,
  RadioGroup,
  Slider,
  SpinButton,
  Textarea,
  Link,
  Avatar,
  Persona,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn
} from '@fluentui/react-components';
import {
  Play24Regular,
  Stop24Regular,
  Refresh24Regular,
  Settings24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Info24Regular,
  Delete24Regular,
  Edit24Regular,
  Add24Regular,
  Search24Regular,
  Filter24Regular,
  MoreHorizontal24Regular,
  ChevronDown24Regular,
  Calendar24Regular,
  Clock24Regular,
  Person24Regular,
  Mail24Regular,
  Phone24Regular
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/format';

// ======================================================================
// TYPES
// ======================================================================

interface TestItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  amount: number;
  date: string;
  avatar?: string;
}

interface ComponentTestState {
  loading: boolean;
  error: string | null;
  success: string | null;
  selectedItems: string[];
  formData: Record<string, any>;
  dialogOpen: boolean;
  menuOpen: boolean;
}

interface PerformanceTest {
  name: string;
  description: string;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockItems: TestItem[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    amount: 1500000,
    date: '2024-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'pending',
    amount: 2300000,
    date: '2024-01-14'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'inactive',
    amount: 750000,
    date: '2024-01-13'
  }
];

const performanceTests: PerformanceTest[] = [
  {
    name: 'Component Render Test',
    description: 'Test rendering performance of complex components',
    duration: 0,
    status: 'pending'
  },
  {
    name: 'State Update Test',
    description: 'Test state update performance with large datasets',
    duration: 0,
    status: 'pending'
  },
  {
    name: 'Event Handler Test',
    description: 'Test event handler performance under load',
    duration: 0,
    status: 'pending'
  },
  {
    name: 'Memory Leak Test',
    description: 'Test for memory leaks in component lifecycle',
    duration: 0,
    status: 'pending'
  }
];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export function UIComponentTest() {
  const [activeTab, setActiveTab] = useState<string>('components');
  const [testState, setTestState] = useState<ComponentTestState>({
    loading: false,
    error: null,
    success: null,
    selectedItems: [],
    formData: {},
    dialogOpen: false,
    menuOpen: false
  });
  const [tests, setTests] = useState<PerformanceTest[]>(performanceTests);
  const [items, setItems] = useState<TestItem[]>(mockItems);
  
  const { dispatchToast } = useToastController();

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

  const updateTestState = useCallback(<K extends keyof ComponentTestState>(
    key: K,
    value: ComponentTestState[K]
  ) => {
    setTestState(prev => ({ ...prev, [key]: value }));
  }, []);

  const showToast = useCallback((title: string, body: string, intent: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        <ToastBody>{body}</ToastBody>
      </Toast>,
      { intent, timeout: 3000 }
    );
  }, [dispatchToast]);

  const simulateAsyncOperation = useCallback(async (duration: number = 2000) => {
    updateTestState('loading', true);
    updateTestState('error', null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, duration));
      
      if (Math.random() > 0.8) {
        throw new Error('Simulated error occurred');
      }
      
      updateTestState('success', 'Operation completed successfully');
      showToast('Success', 'Operation completed successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTestState('error', errorMessage);
      showToast('Error', errorMessage, 'error');
    } finally {
      updateTestState('loading', false);
    }
  }, [updateTestState, showToast]);

  const runPerformanceTest = useCallback(async (testIndex: number) => {
    const test = tests[testIndex];
    if (test.status === 'running') return;

    setTests(prev => prev.map((t, i) => 
      i === testIndex ? { ...t, status: 'running' as const, duration: 0 } : t
    ));

    const startTime = performance.now();
    
    try {
      // Simulate different types of performance tests
      switch (test.name) {
        case 'Component Render Test':
          // Test component rendering
          for (let i = 0; i < 1000; i++) {
            const div = document.createElement('div');
            div.innerHTML = `<span>Test ${i}</span>`;
            document.body.appendChild(div);
            document.body.removeChild(div);
          }
          break;
          
        case 'State Update Test':
          // Test state updates
          for (let i = 0; i < 100; i++) {
            await new Promise(resolve => {
              setItems(prev => [...prev, {
                id: `test-${i}`,
                name: `Test User ${i}`,
                email: `test${i}@example.com`,
                status: 'active' as const,
                amount: Math.random() * 1000000,
                date: new Date().toISOString().split('T')[0]
              }]);
              setTimeout(resolve, 1);
            });
          }
          // Reset items
          setItems(mockItems);
          break;
          
        case 'Event Handler Test':
          // Test event handlers
          for (let i = 0; i < 1000; i++) {
            const event = new Event('click');
            document.dispatchEvent(event);
            await new Promise(resolve => setTimeout(resolve, 1));
          }
          break;
          
        case 'Memory Leak Test':
          // Test for memory leaks
          const objects = [];
          for (let i = 0; i < 10000; i++) {
            objects.push({ data: new Array(1000).fill(i) });
          }
          // Clear objects
          objects.length = 0;
          break;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setTests(prev => prev.map((t, i) => 
        i === testIndex ? {
          ...t,
          status: 'completed' as const,
          duration,
          result: `Completed in ${duration.toFixed(2)}ms`
        } : t
      ));
      
      showToast('Test Completed', `${test.name} completed in ${duration.toFixed(2)}ms`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      setTests(prev => prev.map((t, i) => 
        i === testIndex ? {
          ...t,
          status: 'failed' as const,
          result: errorMessage
        } : t
      ));
      
      showToast('Test Failed', errorMessage, 'error');
    }
  }, [tests, showToast]);

  const runAllTests = useCallback(async () => {
    for (let i = 0; i < tests.length; i++) {
      await runPerformanceTest(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    }
  }, [tests, runPerformanceTest]);

  // ======================================================================
  // MEMOIZED VALUES
  // ======================================================================

  const columns: TableColumnDefinition<TestItem>[] = useMemo(() => [
    createTableColumn<TestItem>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <div className="flex items-center gap-2">
          <Avatar name={item.name} size={24} />
          <Text weight="semibold">{item.name}</Text>
        </div>
      )
    }),
    createTableColumn<TestItem>({
      columnId: 'email',
      compare: (a, b) => a.email.localeCompare(b.email),
      renderHeaderCell: () => 'Email',
      renderCell: (item) => (
        <Text className="text-blue-600">{item.email}</Text>
      )
    }),
    createTableColumn<TestItem>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => {
        const statusConfig = {
          active: { color: 'success' as const, text: 'Active' },
          inactive: { color: 'danger' as const, text: 'Inactive' },
          pending: { color: 'warning' as const, text: 'Pending' }
        };
        const config = statusConfig[item.status];
        return <Badge color={config.color}>{config.text}</Badge>;
      }
    }),
    createTableColumn<TestItem>({
      columnId: 'amount',
      compare: (a, b) => a.amount - b.amount,
      renderHeaderCell: () => 'Amount',
      renderCell: (item) => (
        <Text weight="semibold">{formatCurrency(item.amount)}</Text>
      )
    }),
    createTableColumn<TestItem>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <div className="flex items-center gap-2">
          <Button
            appearance="subtle"
            icon={<Edit24Regular />}
            size="small"
            onClick={() => showToast('Edit', `Editing ${item.name}`)}
          />
          <Button
            appearance="subtle"
            icon={<Delete24Regular />}
            size="small"
            onClick={() => showToast('Delete', `Deleting ${item.name}`, 'warning')}
          />
        </div>
      )
    })
  ], [showToast]);

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderComponentTests = () => (
    <div className="space-y-6">
      {/* Basic Components */}
      <Card className="p-6">
        <Title3 className="mb-4">Basic Components</Title3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Buttons */}
          <div className="space-y-3">
            <Text weight="semibold">Buttons</Text>
            <div className="space-y-2">
              <Button appearance="primary" onClick={() => showToast('Primary', 'Primary button clicked')}>Primary</Button>
              <Button appearance="outline" onClick={() => showToast('Outline', 'Outline button clicked')}>Outline</Button>
              <Button appearance="subtle" onClick={() => showToast('Subtle', 'Subtle button clicked')}>Subtle</Button>
              <Button disabled>Disabled</Button>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => showToast('Icon', 'Icon button clicked')}
              >
                With Icon
              </Button>
            </div>
          </div>
          
          {/* Inputs */}
          <div className="space-y-3">
            <Text weight="semibold">Inputs</Text>
            <div className="space-y-2">
              <Field label="Text Input">
                <Input
                  placeholder="Enter text..."
                  onChange={(e) => updateTestState('formData', { ...testState.formData, text: e.target.value })}
                />
              </Field>
              <Field label="Number Input">
                <SpinButton
                  value={testState.formData.number || 0}
                  onChange={(e, data) => updateTestState('formData', { ...testState.formData, number: data.value })}
                />
              </Field>
              <Field label="Textarea">
                <Textarea
                  placeholder="Enter description..."
                  onChange={(e) => updateTestState('formData', { ...testState.formData, description: e.target.value })}
                />
              </Field>
            </div>
          </div>
          
          {/* Selections */}
          <div className="space-y-3">
            <Text weight="semibold">Selections</Text>
            <div className="space-y-2">
              <Field label="Dropdown">
                <Dropdown
                  placeholder="Select option..."
                  onOptionSelect={(e, data) => showToast('Dropdown', `Selected: ${data.optionText}`)}
                >
                  <Option value="option1">Option 1</Option>
                  <Option value="option2">Option 2</Option>
                  <Option value="option3">Option 3</Option>
                </Dropdown>
              </Field>
              
              <Field label="Checkbox">
                <Checkbox
                  label="Enable notifications"
                  onChange={(e, data) => showToast('Checkbox', `Checked: ${data.checked}`)}
                />
              </Field>
              
              <Field label="Radio Group">
                <RadioGroup
                  onChange={(e, data) => showToast('Radio', `Selected: ${data.value}`)}
                >
                  <Radio value="option1" label="Option 1" />
                  <Radio value="option2" label="Option 2" />
                  <Radio value="option3" label="Option 3" />
                </RadioGroup>
              </Field>
              
              <Field label="Slider">
                <Slider
                  min={0}
                  max={100}
                  step={10}
                  onChange={(e, data) => showToast('Slider', `Value: ${data.value}`)}
                />
              </Field>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Advanced Components */}
      <Card className="p-6">
        <Title3 className="mb-4">Advanced Components</Title3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dialog */}
          <div className="space-y-3">
            <Text weight="semibold">Dialog</Text>
            <Dialog>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Test Dialog</DialogTitle>
                  <DialogContent>
                    <Text>This is a test dialog with some content.</Text>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Cancel</Button>
                    </DialogTrigger>
                    <Button
                      appearance="primary"
                      onClick={() => showToast('Dialog', 'Dialog action confirmed')}
                    >
                      Confirm
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </div>
          
          {/* Menu */}
          <div className="space-y-3">
            <Text weight="semibold">Menu</Text>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="outline"
                  icon={<MoreHorizontal24Regular />}
                  iconPosition="after"
                >
                  Actions
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    icon={<Edit24Regular />}
                    onClick={() => showToast('Menu', 'Edit action selected')}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    icon={<Delete24Regular />}
                    onClick={() => showToast('Menu', 'Delete action selected', 'warning')}
                  >
                    Delete
                  </MenuItem>
                  <MenuItem
                    icon={<Settings24Regular />}
                    onClick={() => showToast('Menu', 'Settings action selected')}
                  >
                    Settings
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
        
        {/* Data Grid */}
        <div className="mt-6">
          <Text weight="semibold" className="mb-3 block">Data Grid</Text>
          <DataGrid
            items={items}
            columns={columns}
            sortable
            getRowId={(item) => item.id}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<TestItem>>
              {({ item, rowId }) => (
                <DataGridRow<TestItem> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </div>
      </Card>
      
      {/* State Testing */}
      <Card className="p-6">
        <Title3 className="mb-4">State & Async Testing</Title3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              appearance="primary"
              onClick={() => simulateAsyncOperation(1000)}
              disabled={testState.loading}
            >
              {testState.loading ? 'Loading...' : 'Test Async Operation'}
            </Button>
            
            <Button
              appearance="outline"
              onClick={() => simulateAsyncOperation(3000)}
              disabled={testState.loading}
            >
              Long Operation (3s)
            </Button>
            
            <Button
              appearance="subtle"
              onClick={() => {
                updateTestState('error', null);
                updateTestState('success', null);
              }}
            >
              Clear Messages
            </Button>
          </div>
          
          {testState.loading && (
            <div className="flex items-center gap-2">
              <Spinner size="small" />
              <Text>Processing...</Text>
            </div>
          )}
          
          {testState.error && (
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Error</MessageBarTitle>
                {testState.error}
              </MessageBarBody>
            </MessageBar>
          )}
          
          {testState.success && (
            <MessageBar intent="success">
              <MessageBarBody>
                <MessageBarTitle>Success</MessageBarTitle>
                {testState.success}
              </MessageBarBody>
            </MessageBar>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPerformanceTests = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Title3>Performance Tests</Title3>
          <div className="flex items-center gap-2">
            <Button
              appearance="primary"
              onClick={runAllTests}
              disabled={tests.some(t => t.status === 'running')}
            >
              Run All Tests
            </Button>
            <Button
              appearance="outline"
              onClick={() => setTests(performanceTests.map(t => ({ ...t, status: 'pending' as const, duration: 0, result: undefined })))}
            >
              Reset Tests
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={test.name} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Text weight="semibold">{test.name}</Text>
                    <Badge
                      color={
                        test.status === 'completed' ? 'success' :
                        test.status === 'failed' ? 'danger' :
                        test.status === 'running' ? 'warning' : 'subtle'
                      }
                    >
                      {test.status}
                    </Badge>
                  </div>
                  <Text size={200} className="text-gray-600 mb-2">
                    {test.description}
                  </Text>
                  {test.result && (
                    <Text size={200} className="text-blue-600">
                      {test.result}
                    </Text>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {test.status === 'running' && <Spinner size="small" />}
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => runPerformanceTest(index)}
                    disabled={test.status === 'running'}
                  >
                    {test.status === 'running' ? 'Running...' : 'Run Test'}
                  </Button>
                </div>
              </div>
              
              {test.status === 'running' && (
                <ProgressBar className="mt-3" />
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  // ======================================================================
  // MAIN RENDER
  // ======================================================================

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* Header */}
      <div>
        <Title1>UI Component Test</Title1>
        <Text className="text-gray-600 mt-1">
          Test berbagai komponen UI dan fungsionalitas interaksi
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
            <Tab value="components" icon={<Settings24Regular />}>
              Components
            </Tab>
            <Tab value="performance" icon={<Play24Regular />}>
              Performance Tests
            </Tab>
          </TabList>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'components' && renderComponentTests()}
      {activeTab === 'performance' && renderPerformanceTests()}
    </div>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default UIComponentTest;