// ======================================================================
// TESTING UTILITIES
// Utilitas untuk testing, debugging, dan quality assurance
// ======================================================================

// ======================================================================
// TYPES
// ======================================================================

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface MockData {
  [key: string]: any;
}

export interface APITestConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
}

export interface ComponentTestConfig {
  renderTimeout: number;
  interactionDelay: number;
  screenshotOnFailure: boolean;
}

// ======================================================================
// TEST RUNNER
// ======================================================================

export class TestRunner {
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];
  private isRunning = false;
  private observers: ((result: TestResult) => void)[] = [];

  // Add test suite
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  // Add observer for test results
  addObserver(callback: (result: TestResult) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Run all test suites
  async runAll(): Promise<TestResult[]> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.results = [];

    try {
      for (const suite of this.suites) {
        await this.runSuite(suite);
      }
    } finally {
      this.isRunning = false;
    }

    return this.results;
  }

  // Run specific test suite
  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    const suiteResults: TestResult[] = [];

    try {
      // Setup
      if (suite.setup) {
        await suite.setup();
      }

      // Run tests
      for (const test of suite.tests) {
        const result = await this.runTest(test);
        suiteResults.push(result);
        this.results.push(result);
        this.notifyObservers(result);
      }
    } finally {
      // Teardown
      if (suite.teardown) {
        await suite.teardown();
      }
    }

    return suiteResults;
  }

  // Run individual test
  private async runTest(test: TestResult): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Test execution would go here
      // This is a placeholder for actual test execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const endTime = performance.now();
      
      return {
        ...test,
        status: Math.random() > 0.1 ? 'passed' : 'failed', // 90% pass rate
        duration: endTime - startTime,
        error: Math.random() > 0.1 ? undefined : 'Simulated test failure'
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        ...test,
        status: 'failed',
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get test results
  getResults(): TestResult[] {
    return [...this.results];
  }

  // Get test summary
  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      totalDuration,
      averageDuration: total > 0 ? totalDuration / total : 0
    };
  }

  // Clear results
  clear(): void {
    this.results = [];
    this.suites = [];
  }

  private notifyObservers(result: TestResult): void {
    this.observers.forEach(callback => callback(result));
  }
}

// ======================================================================
// MOCK DATA GENERATORS
// ======================================================================

export class MockDataGenerator {
  private static readonly FIRST_NAMES = [
    'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hani',
    'Indra', 'Joko', 'Kartika', 'Lestari', 'Made', 'Novi', 'Omar', 'Putri',
    'Qori', 'Rina', 'Sari', 'Tono', 'Umar', 'Vina', 'Wati', 'Yani', 'Zaki'
  ];

  private static readonly LAST_NAMES = [
    'Pratama', 'Sari', 'Wijaya', 'Kusuma', 'Santoso', 'Lestari', 'Permana',
    'Handayani', 'Setiawan', 'Rahayu', 'Kurniawan', 'Safitri', 'Putra',
    'Maharani', 'Nugroho', 'Anggraini', 'Saputra', 'Wulandari'
  ];

  private static readonly CITIES = [
    'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar',
    'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Batam'
  ];

  private static readonly PRODUCT_CATEGORIES = [
    'Elektronik', 'Pakaian', 'Makanan', 'Minuman', 'Buku', 'Olahraga',
    'Kecantikan', 'Kesehatan', 'Rumah Tangga', 'Otomotif'
  ];

  private static readonly PRODUCT_NAMES = [
    'Smartphone', 'Laptop', 'Tablet', 'Headphone', 'Speaker', 'Kamera',
    'Baju', 'Celana', 'Sepatu', 'Tas', 'Jam Tangan', 'Kacamata',
    'Nasi Goreng', 'Mie Ayam', 'Gado-gado', 'Sate', 'Bakso', 'Soto',
    'Teh', 'Kopi', 'Jus', 'Air Mineral', 'Soft Drink'
  ];

  // Generate random person data
  static generatePerson(id?: string): any {
    const firstName = this.randomFromArray(this.FIRST_NAMES);
    const lastName = this.randomFromArray(this.LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    return {
      id: id || this.generateId(),
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+62${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      address: `Jl. ${this.randomFromArray(['Sudirman', 'Thamrin', 'Gatot Subroto', 'Kuningan'])} No. ${Math.floor(Math.random() * 100) + 1}`,
      city: this.randomFromArray(this.CITIES),
      birthDate: this.randomDate(new Date(1970, 0, 1), new Date(2000, 11, 31)),
      gender: Math.random() > 0.5 ? 'male' : 'female',
      status: this.randomFromArray(['active', 'inactive', 'pending'])
    };
  }

  // Generate random product data
  static generateProduct(id?: string): any {
    const category = this.randomFromArray(this.PRODUCT_CATEGORIES);
    const name = this.randomFromArray(this.PRODUCT_NAMES);
    
    return {
      id: id || this.generateId(),
      name: `${name} ${category}`,
      sku: this.generateSKU(),
      barcode: this.generateBarcode(),
      category,
      price: Math.floor(Math.random() * 1000000) + 10000,
      cost: Math.floor(Math.random() * 500000) + 5000,
      stock: Math.floor(Math.random() * 100),
      minStock: Math.floor(Math.random() * 10) + 1,
      unit: this.randomFromArray(['pcs', 'kg', 'liter', 'box', 'pack']),
      description: `Deskripsi untuk ${name} ${category}`,
      status: this.randomFromArray(['active', 'inactive', 'discontinued'])
    };
  }

  // Generate random transaction data
  static generateTransaction(id?: string): any {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = Array.from({ length: itemCount }, () => ({
      productId: this.generateId(),
      name: this.randomFromArray(this.PRODUCT_NAMES),
      quantity: Math.floor(Math.random() * 5) + 1,
      price: Math.floor(Math.random() * 100000) + 10000
    }));
    
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    return {
      id: id || this.generateId(),
      transactionNumber: this.generateTransactionNumber(),
      customerId: this.generateId(),
      customerName: `${this.randomFromArray(this.FIRST_NAMES)} ${this.randomFromArray(this.LAST_NAMES)}`,
      items,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod: this.randomFromArray(['cash', 'card', 'transfer', 'ewallet']),
      paymentStatus: this.randomFromArray(['paid', 'pending', 'failed']),
      status: this.randomFromArray(['completed', 'pending', 'cancelled']),
      createdAt: this.randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: new Date()
    };
  }

  // Generate array of mock data
  static generateArray<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }

  // Utility methods
  private static randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static generateSKU(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let sku = '';
    for (let i = 0; i < 3; i++) {
      sku += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 4; i++) {
      sku += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return sku;
  }

  private static generateBarcode(): string {
    let barcode = '';
    for (let i = 0; i < 13; i++) {
      barcode += Math.floor(Math.random() * 10).toString();
    }
    return barcode;
  }

  private static generateTransactionNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `TRX${year}${month}${day}${random}`;
  }

  private static randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
}

// ======================================================================
// API TESTING UTILITIES
// ======================================================================

export class APITester {
  private config: APITestConfig;

  constructor(config: APITestConfig) {
    this.config = config;
  }

  // Test API endpoint
  async testEndpoint(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    expectedStatus = 200
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `${method} ${endpoint}`;

    try {
      const response = await this.makeRequest(method, endpoint, data);
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (response.status === expectedStatus) {
        return {
          name: testName,
          status: 'passed',
          duration,
          details: {
            status: response.status,
            responseTime: duration,
            responseSize: JSON.stringify(response.data).length
          }
        };
      } else {
        return {
          name: testName,
          status: 'failed',
          duration,
          error: `Expected status ${expectedStatus}, got ${response.status}`,
          details: {
            status: response.status,
            responseTime: duration
          }
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        name: testName,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test API performance
  async testPerformance(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    iterations = 10
  ): Promise<TestResult> {
    const testName = `Performance: ${method} ${endpoint} (${iterations}x)`;
    const startTime = performance.now();
    const durations: number[] = [];
    let errors = 0;

    try {
      for (let i = 0; i < iterations; i++) {
        const iterationStart = performance.now();
        try {
          await this.makeRequest(method, endpoint, data);
          const iterationEnd = performance.now();
          durations.push(iterationEnd - iterationStart);
        } catch (error) {
          errors++;
        }
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

      return {
        name: testName,
        status: errors === 0 ? 'passed' : 'failed',
        duration: totalDuration,
        error: errors > 0 ? `${errors} out of ${iterations} requests failed` : undefined,
        details: {
          iterations,
          errors,
          avgResponseTime: avgDuration,
          minResponseTime: minDuration,
          maxResponseTime: maxDuration,
          requestsPerSecond: (iterations / totalDuration) * 1000
        }
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        name: testName,
        status: 'failed',
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Make HTTP request
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<{ status: number; data: any }> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();
      return {
        status: response.status,
        data: responseData
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// ======================================================================
// COMPONENT TESTING UTILITIES
// ======================================================================

export class ComponentTester {
  private config: ComponentTestConfig;

  constructor(config: ComponentTestConfig) {
    this.config = config;
  }

  // Test component rendering
  async testRender(componentName: string, renderFn: () => void): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Render: ${componentName}`;

    try {
      renderFn();
      
      // Wait for render to complete
      await new Promise(resolve => setTimeout(resolve, this.config.renderTimeout));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        details: {
          renderTime: duration
        }
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        name: testName,
        status: 'failed',
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Render failed'
      };
    }
  }

  // Test component interaction
  async testInteraction(
    componentName: string,
    interactionFn: () => void,
    expectedResult?: () => boolean
  ): Promise<TestResult> {
    const startTime = performance.now();
    const testName = `Interaction: ${componentName}`;

    try {
      interactionFn();
      
      // Wait for interaction to complete
      await new Promise(resolve => setTimeout(resolve, this.config.interactionDelay));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const passed = expectedResult ? expectedResult() : true;

      return {
        name: testName,
        status: passed ? 'passed' : 'failed',
        duration,
        error: passed ? undefined : 'Expected result not achieved',
        details: {
          interactionTime: duration
        }
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        name: testName,
        status: 'failed',
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Interaction failed'
      };
    }
  }
}

// ======================================================================
// DEBUGGING UTILITIES
// ======================================================================

export class DebugLogger {
  private logs: Array<{ level: string; message: string; timestamp: Date; data?: any }> = [];
  private maxLogs = 1000;

  // Log debug message
  debug(message: string, data?: any): void {
    this.addLog('debug', message, data);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  // Log info message
  info(message: string, data?: any): void {
    this.addLog('info', message, data);
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, data);
    }
  }

  // Log warning message
  warn(message: string, data?: any): void {
    this.addLog('warn', message, data);
    console.warn(`[WARN] ${message}`, data);
  }

  // Log error message
  error(message: string, data?: any): void {
    this.addLog('error', message, data);
    console.error(`[ERROR] ${message}`, data);
  }

  // Get all logs
  getLogs(): Array<{ level: string; message: string; timestamp: Date; data?: any }> {
    return [...this.logs];
  }

  // Get logs by level
  getLogsByLevel(level: string): Array<{ level: string; message: string; timestamp: Date; data?: any }> {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clear(): void {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private addLog(level: string, message: string, data?: any): void {
    this.logs.push({
      level,
      message,
      timestamp: new Date(),
      data
    });

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }
}

// ======================================================================
// GLOBAL INSTANCES
// ======================================================================

export const globalTestRunner = new TestRunner();
export const globalDebugLogger = new DebugLogger();

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

// Wait for condition to be true
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Simulate user delay
export async function simulateUserDelay(min = 100, max = 500): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Generate test data for specific scenarios
export function generateTestScenarios() {
  return {
    // Empty state scenarios
    emptyData: [],
    
    // Small dataset scenarios
    smallDataset: MockDataGenerator.generateArray(() => MockDataGenerator.generatePerson(), 5),
    
    // Medium dataset scenarios
    mediumDataset: MockDataGenerator.generateArray(() => MockDataGenerator.generatePerson(), 100),
    
    // Large dataset scenarios
    largeDataset: MockDataGenerator.generateArray(() => MockDataGenerator.generatePerson(), 1000),
    
    // Edge cases
    edgeCases: {
      longNames: Array.from({ length: 5 }, (_, i) => ({
        ...MockDataGenerator.generatePerson(),
        name: 'A'.repeat(100 + i * 50) // Very long names
      })),
      
      specialCharacters: Array.from({ length: 5 }, (_, i) => ({
        ...MockDataGenerator.generatePerson(),
        name: `Test ${i} !@#$%^&*()_+-=[]{}|;':",./<>?`
      })),
      
      unicodeCharacters: Array.from({ length: 5 }, (_, i) => ({
        ...MockDataGenerator.generatePerson(),
        name: `测试 ${i} 🚀 ñáéíóú`
      }))
    }
  };
}