import { AnalyticsTracker } from '@/lib/analytics/tracker';
import { ErrorHandler, StrongholdError } from '@/lib/error/error-handler';

export interface FeatureTest {
  id: string;
  name: string;
  description: string;
  category: 'ui' | 'api' | 'workflow' | 'integration' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  testFunction: () => Promise<TestResult>;
  dependencies?: string[];
  timeout?: number;
  retryCount?: number;
}

export interface TestResult {
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
  metrics?: Record<string, number>;
  screenshots?: string[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: FeatureTest[];
  parallel?: boolean;
  setupFunction?: () => Promise<void>;
  teardownFunction?: () => Promise<void>;
}

export interface TestReport {
  id: string;
  suite_id: string;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestExecutionResult[];
  metrics: {
    success_rate: number;
    avg_duration: number;
    performance_score: number;
    reliability_score: number;
  };
}

export interface TestExecutionResult {
  test_id: string;
  test_name: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  error_message?: string;
  retry_count: number;
  metrics?: Record<string, any>;
}

export class FeatureTester {
  private static suites: Map<string, TestSuite> = new Map();
  private static running: boolean = false;
  private static currentExecution: string | null = null;

  static registerTestSuite(suite: TestSuite): void {
    this.suites.set(suite.id, suite);
    console.log(`Registered test suite: ${suite.name} (${suite.tests.length} tests)`);
  }

  static registerTest(suiteId: string, test: FeatureTest): void {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }
    suite.tests.push(test);
  }

  static async runTestSuite(suiteId: string, options?: {
    parallel?: boolean;
    maxRetries?: number;
    timeout?: number;
  }): Promise<TestReport> {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    if (this.running) {
      throw new Error('Another test suite is already running');
    }

    this.running = true;
    this.currentExecution = `exec_${Date.now()}`;

    const startTime = Date.now();
    const results: TestExecutionResult[] = [];

    try {
      // Setup
      if (suite.setupFunction) {
        await suite.setupFunction();
      }

      // Track test run start
      await AnalyticsTracker.track('feature_usage', 'test_suite_started', undefined, {
        suite_id: suiteId,
        suite_name: suite.name,
        test_count: suite.tests.length,
        execution_id: this.currentExecution
      });

      // Run tests
      if (options?.parallel || suite.parallel) {
        const testPromises = suite.tests.map(test => this.executeTest(test, options));
        const testResults = await Promise.allSettled(testPromises);

        testResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              test_id: suite.tests[index].id,
              test_name: suite.tests[index].name,
              status: 'failed',
              duration: 0,
              error_message: result.reason?.message || 'Unknown error',
              retry_count: 0
            });
          }
        });
      } else {
        for (const test of suite.tests) {
          const result = await this.executeTest(test, options);
          results.push(result);
        }
      }

      // Teardown
      if (suite.teardownFunction) {
        await suite.teardownFunction();
      }

    } catch (error) {
      await ErrorHandler.handleError(new StrongholdError({
        type: 'unknown_error',
        message: `Test suite execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        context: {
          metadata: {
            suite_id: suiteId,
            execution_id: this.currentExecution
          }
        }
      }));

      throw error;
    } finally {
      this.running = false;
      this.currentExecution = null;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate metrics
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const successRate = results.length > 0 ? (passed / results.length) * 100 : 0;
    const avgDuration = results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;

    const report: TestReport = {
      id: this.currentExecution || `report_${Date.now()}`,
      suite_id: suiteId,
      timestamp: new Date().toISOString(),
      total_tests: results.length,
      passed,
      failed,
      skipped,
      duration,
      results,
      metrics: {
        success_rate: successRate,
        avg_duration: avgDuration,
        performance_score: this.calculatePerformanceScore(results),
        reliability_score: this.calculateReliabilityScore(results)
      }
    };

    // Track test completion
    await AnalyticsTracker.track('feature_usage', 'test_suite_completed', undefined, {
      suite_id: suiteId,
      execution_id: report.id,
      success_rate: successRate,
      duration,
      passed,
      failed,
      skipped
    });

    // Save report to analytics
    await this.saveTestReport(report);

    return report;
  }

  private static async executeTest(test: FeatureTest, options?: {
    maxRetries?: number;
    timeout?: number;
  }): Promise<TestExecutionResult> {
    const maxRetries = options?.maxRetries || test.retryCount || 2;
    const timeout = options?.timeout || test.timeout || 30000;

    let lastError: string | undefined;
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        // Execute test with timeout
        const result = await Promise.race([
          test.testFunction(),
          new Promise<TestResult>((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), timeout)
          )
        ]);

        const duration = Date.now() - startTime;

        if (result.success) {
          return {
            test_id: test.id,
            test_name: test.name,
            status: 'passed',
            duration,
            retry_count: retryCount,
            metrics: result.metrics
          };
        } else {
          lastError = result.error || 'Test failed without error message';
          retryCount++;

          if (attempt < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        retryCount++;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    return {
      test_id: test.id,
      test_name: test.name,
      status: 'failed',
      duration: 0,
      error_message: lastError,
      retry_count: retryCount
    };
  }

  private static calculatePerformanceScore(results: TestExecutionResult[]): number {
    if (results.length === 0) return 0;

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const timeoutCount = results.filter(r => r.status === 'timeout').length;

    // Lower duration and fewer timeouts = higher score
    const durationScore = Math.max(0, 100 - (avgDuration / 100));
    const timeoutPenalty = (timeoutCount / results.length) * 50;

    return Math.max(0, durationScore - timeoutPenalty);
  }

  private static calculateReliabilityScore(results: TestExecutionResult[]): number {
    if (results.length === 0) return 0;

    const successRate = (results.filter(r => r.status === 'passed').length / results.length) * 100;
    const avgRetries = results.reduce((sum, r) => sum + r.retry_count, 0) / results.length;

    // High success rate and low retries = higher score
    const retryPenalty = avgRetries * 10;

    return Math.max(0, successRate - retryPenalty);
  }

  private static async saveTestReport(report: TestReport): Promise<void> {
    try {
      // Save to analytics for trending and insights
      await AnalyticsTracker.track('performance', 'test_report_generated', undefined, {
        suite_id: report.suite_id,
        execution_id: report.id,
        metrics: report.metrics,
        test_results: {
          total: report.total_tests,
          passed: report.passed,
          failed: report.failed,
          skipped: report.skipped
        }
      });

      // Store detailed report in localStorage for development
      if (typeof window !== 'undefined') {
        const storedReports = JSON.parse(localStorage.getItem('stronghold_test_reports') || '[]');
        storedReports.push(report);

        // Keep only last 20 reports
        if (storedReports.length > 20) {
          storedReports.splice(0, storedReports.length - 20);
        }

        localStorage.setItem('stronghold_test_reports', JSON.stringify(storedReports));
      }
    } catch (error) {
      console.error('Failed to save test report:', error);
    }
  }

  static async runAllSuites(): Promise<TestReport[]> {
    const reports: TestReport[] = [];

    for (const [suiteId] of this.suites) {
      try {
        const report = await this.runTestSuite(suiteId);
        reports.push(report);
      } catch (error) {
        console.error(`Failed to run test suite ${suiteId}:`, error);
      }
    }

    return reports;
  }

  static getTestSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  static getTestSuite(suiteId: string): TestSuite | undefined {
    return this.suites.get(suiteId);
  }

  static isRunning(): boolean {
    return this.running;
  }

  static getCurrentExecution(): string | null {
    return this.currentExecution;
  }

  // Helper method to create DOM-based tests
  static createDOMTest(config: {
    id: string;
    name: string;
    description: string;
    selector: string;
    expectedText?: string;
    expectedCount?: number;
    timeout?: number;
  }): FeatureTest {
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      category: 'ui',
      priority: 'medium',
      timeout: config.timeout || 5000,
      testFunction: async (): Promise<TestResult> => {
        const startTime = Date.now();

        try {
          const elements = document.querySelectorAll(config.selector);

          if (config.expectedCount !== undefined && elements.length !== config.expectedCount) {
            return {
              success: false,
              duration: Date.now() - startTime,
              error: `Expected ${config.expectedCount} elements, found ${elements.length}`,
              details: { selector: config.selector, found: elements.length }
            };
          }

          if (config.expectedText) {
            const element = elements[0];
            if (!element || !element.textContent?.includes(config.expectedText)) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: `Expected text "${config.expectedText}" not found`,
                details: {
                  selector: config.selector,
                  actualText: element?.textContent || 'No element found'
                }
              };
            }
          }

          return {
            success: true,
            duration: Date.now() - startTime,
            details: {
              selector: config.selector,
              elements: elements.length
            }
          };
        } catch (error) {
          return {
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    };
  }

  // Helper method to create API tests
  static createAPITest(config: {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    expectedStatus?: number;
    expectedData?: any;
    timeout?: number;
  }): FeatureTest {
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      category: 'api',
      priority: 'high',
      timeout: config.timeout || 10000,
      testFunction: async (): Promise<TestResult> => {
        const startTime = Date.now();

        try {
          const response = await fetch(config.endpoint, {
            method: config.method,
            headers: { 'Content-Type': 'application/json' }
          });

          const duration = Date.now() - startTime;

          if (config.expectedStatus && response.status !== config.expectedStatus) {
            return {
              success: false,
              duration,
              error: `Expected status ${config.expectedStatus}, got ${response.status}`,
              details: {
                endpoint: config.endpoint,
                status: response.status,
                statusText: response.statusText
              }
            };
          }

          let responseData;
          try {
            responseData = await response.json();
          } catch {
            responseData = await response.text();
          }

          if (config.expectedData) {
            const dataMatch = JSON.stringify(responseData) === JSON.stringify(config.expectedData);
            if (!dataMatch) {
              return {
                success: false,
                duration,
                error: 'Response data does not match expected data',
                details: {
                  expected: config.expectedData,
                  actual: responseData
                }
              };
            }
          }

          return {
            success: true,
            duration,
            details: {
              endpoint: config.endpoint,
              status: response.status,
              responseSize: JSON.stringify(responseData).length
            },
            metrics: {
              response_time: duration,
              status_code: response.status
            }
          };
        } catch (error) {
          return {
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    };
  }
}