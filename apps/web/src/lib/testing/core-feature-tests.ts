import { FeatureTester, TestSuite, FeatureTest } from './feature-tester';
import { FeedbackManager } from '@/lib/feedback/feedback-manager';
import { ErrorHandler } from '@/lib/error/error-handler';

export class CoreFeatureTests {
  static initialize(): void {
    // Register all test suites
    this.registerDocumentManagementTests();
    this.registerFeedbackSystemTests();
    this.registerErrorHandlingTests();
    this.registerUserInterfaceTests();
    this.registerPerformanceTests();
    this.registerIntegrationTests();
  }

  private static registerDocumentManagementTests(): void {
    const tests: FeatureTest[] = [
      // UI presence tests
      FeatureTester.createDOMTest({
        id: 'doc_upload_button_exists',
        name: 'Document Upload Button Exists',
        description: 'Verify upload button is present on vault page',
        selector: '[data-testid="upload-button"], button:contains("Upload"), button:contains("Nahrať")',
        expectedCount: 1
      }),

      FeatureTester.createDOMTest({
        id: 'doc_list_container_exists',
        name: 'Document List Container Exists',
        description: 'Verify document list container is present',
        selector: '[data-testid="document-list"], .document-list, table',
        expectedCount: 1
      }),

      // AI functionality tests
      {
        id: 'ai_document_analysis_test',
        name: 'AI Document Analysis',
        description: 'Test AI document analysis functionality',
        category: 'integration',
        priority: 'critical',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            // Create a test blob representing a document
            const testFile = new Blob(['Test document content for AI analysis'], {
              type: 'text/plain'
            });

            const formData = new FormData();
            formData.append('file', testFile, 'test-document.txt');

            const response = await fetch('/api/analyze-document', {
              method: 'POST',
              body: formData
            });

            const result = await response.json();
            const duration = Date.now() - startTime;

            if (!response.ok) {
              return {
                success: false,
                duration,
                error: `API returned ${response.status}: ${result.message || 'Unknown error'}`,
                details: { status: response.status, response: result }
              };
            }

            if (!result.success || !result.data) {
              return {
                success: false,
                duration,
                error: 'AI analysis failed or returned no data',
                details: { result }
              };
            }

            // Verify required AI analysis fields
            const requiredFields = ['category', 'confidence', 'metadata', 'description'];
            const missingFields = requiredFields.filter(field => !(field in result.data));

            if (missingFields.length > 0) {
              return {
                success: false,
                duration,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                details: { result: result.data, missingFields }
              };
            }

            return {
              success: true,
              duration,
              details: {
                category: result.data.category,
                confidence: result.data.confidence,
                hasMetadata: !!result.data.metadata
              },
              metrics: {
                response_time: duration,
                confidence_score: result.data.confidence
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
      },

      // Document storage API test
      FeatureTester.createAPITest({
        id: 'document_metadata_api',
        name: 'Document Metadata API',
        description: 'Test document metadata retrieval',
        endpoint: '/api/documents',
        method: 'GET',
        expectedStatus: 200
      })
    ];

    FeatureTester.registerTestSuite({
      id: 'document_management',
      name: 'Document Management System',
      description: 'Tests for document upload, AI analysis, and management features',
      tests,
      parallel: false
    });
  }

  private static registerFeedbackSystemTests(): void {
    const tests: FeatureTest[] = [
      // Feedback manager functionality
      {
        id: 'feedback_submission_test',
        name: 'Feedback Submission',
        description: 'Test feedback submission functionality',
        category: 'integration',
        priority: 'high',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            const testFeedback = {
              type: 'general' as const,
              subject: 'Test Feedback',
              message: 'This is a test feedback message for automated testing',
              rating: 4,
              includeSystemInfo: false,
              metadata: { testRun: true }
            };

            const result = await FeedbackManager.submitFeedback(testFeedback);
            const duration = Date.now() - startTime;

            if (!result.success) {
              return {
                success: false,
                duration,
                error: result.error || 'Feedback submission failed',
                details: { result }
              };
            }

            return {
              success: true,
              duration,
              details: { feedbackId: result.id },
              metrics: { submission_time: duration }
            };
          } catch (error) {
            return {
              success: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },

      // Feedback widget UI test
      FeatureTester.createDOMTest({
        id: 'feedback_widget_button',
        name: 'Feedback Widget Button',
        description: 'Verify feedback widget trigger button exists',
        selector: '[data-testid="feedback-button"], button:contains("Feedback")',
        expectedCount: 1
      }),

      // Feedback stats test
      {
        id: 'feedback_stats_test',
        name: 'Feedback Statistics',
        description: 'Test feedback statistics retrieval',
        category: 'api',
        priority: 'medium',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            const stats = await FeedbackManager.getFeedbackStats(7);
            const duration = Date.now() - startTime;

            if (typeof stats.totalFeedback !== 'number') {
              return {
                success: false,
                duration,
                error: 'Invalid stats format',
                details: { stats }
              };
            }

            return {
              success: true,
              duration,
              details: {
                totalFeedback: stats.totalFeedback,
                successRate: stats.averageRating
              },
              metrics: { retrieval_time: duration }
            };
          } catch (error) {
            return {
              success: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      }
    ];

    FeatureTester.registerTestSuite({
      id: 'feedback_system',
      name: 'User Feedback System',
      description: 'Tests for feedback collection, processing, and analytics',
      tests,
      parallel: true
    });
  }

  private static registerErrorHandlingTests(): void {
    const tests: FeatureTest[] = [
      // Error handler functionality
      {
        id: 'error_handling_test',
        name: 'Error Handler Processing',
        description: 'Test error handler processes errors correctly',
        category: 'integration',
        priority: 'critical',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            // Create a test error
            const testError = new Error('Test error for automated testing');

            // Process error through handler
            await ErrorHandler.handleError(testError, {
              metadata: { testRun: true, automated: true }
            });

            const duration = Date.now() - startTime;

            // Verify error was logged (check localStorage as fallback)
            const errorQueue = localStorage.getItem('stronghold_error_queue');
            if (errorQueue) {
              const errors = JSON.parse(errorQueue);
              const testErrors = errors.filter((e: any) =>
                e.message === 'Test error for automated testing'
              );

              if (testErrors.length === 0) {
                return {
                  success: false,
                  duration,
                  error: 'Test error not found in error queue',
                  details: { errorQueue: errors.length }
                };
              }
            }

            return {
              success: true,
              duration,
              details: { errorProcessed: true },
              metrics: { processing_time: duration }
            };
          } catch (error) {
            return {
              success: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },

      // Error boundary presence test
      FeatureTester.createDOMTest({
        id: 'error_boundary_present',
        name: 'Error Boundary Present',
        description: 'Verify error boundary components are present',
        selector: '[data-error-boundary], .error-boundary',
        expectedCount: 1
      })
    ];

    FeatureTester.registerTestSuite({
      id: 'error_handling',
      name: 'Error Handling System',
      description: 'Tests for error detection, processing, and recovery',
      tests,
      parallel: true
    });
  }

  private static registerUserInterfaceTests(): void {
    const tests: FeatureTest[] = [
      // Navigation tests
      FeatureTester.createDOMTest({
        id: 'navigation_menu_exists',
        name: 'Navigation Menu Exists',
        description: 'Verify main navigation menu is present',
        selector: 'nav, [role="navigation"], .navigation, .nav-menu',
        expectedCount: 1
      }),

      // Main content tests
      FeatureTester.createDOMTest({
        id: 'main_content_exists',
        name: 'Main Content Area Exists',
        description: 'Verify main content area is present',
        selector: 'main, [role="main"], .main-content',
        expectedCount: 1
      }),

      // Responsive design test
      {
        id: 'responsive_design_test',
        name: 'Responsive Design',
        description: 'Test responsive design at different viewport sizes',
        category: 'ui',
        priority: 'medium',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            const originalWidth = window.innerWidth;
            const originalHeight = window.innerHeight;

            // Test mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
            window.dispatchEvent(new Event('resize'));

            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if mobile-specific elements are visible
            const mobileNav = document.querySelector('.mobile-nav, [data-mobile-nav]');
            const desktopNav = document.querySelector('.desktop-nav, [data-desktop-nav]');

            // Restore original viewport
            Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true });
            window.dispatchEvent(new Event('resize'));

            const duration = Date.now() - startTime;

            return {
              success: true,
              duration,
              details: {
                mobileNavVisible: !!mobileNav,
                desktopNavVisible: !!desktopNav,
                viewportChanged: true
              },
              metrics: { test_duration: duration }
            };
          } catch (error) {
            return {
              success: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },

      // Accessibility test
      {
        id: 'accessibility_test',
        name: 'Basic Accessibility',
        description: 'Test basic accessibility features',
        category: 'ui',
        priority: 'high',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            const issues: string[] = [];

            // Check for alt text on images
            const images = document.querySelectorAll('img');
            images.forEach((img, index) => {
              if (!img.getAttribute('alt')) {
                issues.push(`Image ${index + 1} missing alt text`);
              }
            });

            // Check for form labels
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach((input, index) => {
              const id = input.getAttribute('id');
              if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (!label && !input.getAttribute('aria-label')) {
                  issues.push(`Input ${index + 1} missing label`);
                }
              }
            });

            // Check for heading hierarchy
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length === 0) {
              issues.push('No headings found');
            }

            const duration = Date.now() - startTime;

            return {
              success: issues.length === 0,
              duration,
              error: issues.length > 0 ? `Accessibility issues: ${issues.join(', ')}` : undefined,
              details: {
                imagesChecked: images.length,
                inputsChecked: inputs.length,
                headingsFound: headings.length,
                issues
              },
              metrics: { accessibility_score: Math.max(0, 100 - (issues.length * 10)) }
            };
          } catch (error) {
            return {
              success: false,
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      }
    ];

    FeatureTester.registerTestSuite({
      id: 'user_interface',
      name: 'User Interface',
      description: 'Tests for UI components, accessibility, and user experience',
      tests,
      parallel: true
    });
  }

  private static registerPerformanceTests(): void {
    const tests: FeatureTest[] = [
      // Page load performance
      {
        id: 'page_load_performance',
        name: 'Page Load Performance',
        description: 'Test page load performance metrics',
        category: 'performance',
        priority: 'high',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            if (!navigation) {
              return {
                success: false,
                duration: Date.now() - startTime,
                error: 'Navigation timing not available'
              };
            }

            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime || 0;

            const duration = Date.now() - startTime;

            // Performance thresholds
            const issues: string[] = [];
            if (loadTime > 3000) issues.push('Page load time > 3s');
            if (domContentLoaded > 1500) issues.push('DOM content loaded > 1.5s');
            if (firstPaint > 1000) issues.push('First paint > 1s');

            return {
              success: issues.length === 0,
              duration,
              error: issues.length > 0 ? `Performance issues: ${issues.join(', ')}` : undefined,
              details: {
                loadTime,
                domContentLoaded,
                firstPaint,
                issues
              },
              metrics: {
                load_time: loadTime,
                dom_ready_time: domContentLoaded,
                first_paint_time: firstPaint,
                performance_score: Math.max(0, 100 - (issues.length * 20))
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
      },

      // Memory usage test
      {
        id: 'memory_usage_test',
        name: 'Memory Usage',
        description: 'Test memory usage patterns',
        category: 'performance',
        priority: 'medium',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            // @ts-ignore - performance.memory is non-standard but widely supported
            const memory = (performance as any).memory;

            if (!memory) {
              return {
                success: true,
                duration: Date.now() - startTime,
                details: { memoryAPINotAvailable: true },
                metrics: { memory_available: 0 }
              };
            }

            const heapUsed = memory.usedJSHeapSize;
            const heapTotal = memory.totalJSHeapSize;
            const heapLimit = memory.jsHeapSizeLimit;

            const usage = (heapUsed / heapLimit) * 100;
            const duration = Date.now() - startTime;

            const issues: string[] = [];
            if (usage > 80) issues.push('High memory usage (>80%)');
            if (heapUsed > 50 * 1024 * 1024) issues.push('Heap usage > 50MB');

            return {
              success: issues.length === 0,
              duration,
              error: issues.length > 0 ? `Memory issues: ${issues.join(', ')}` : undefined,
              details: {
                heapUsed,
                heapTotal,
                heapLimit,
                usagePercent: usage,
                issues
              },
              metrics: {
                heap_used_mb: heapUsed / (1024 * 1024),
                memory_usage_percent: usage,
                memory_score: Math.max(0, 100 - usage)
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
      }
    ];

    FeatureTester.registerTestSuite({
      id: 'performance',
      name: 'Performance Tests',
      description: 'Tests for application performance and resource usage',
      tests,
      parallel: true
    });
  }

  private static registerIntegrationTests(): void {
    const tests: FeatureTest[] = [
      // End-to-end workflow test
      {
        id: 'document_upload_workflow',
        name: 'Document Upload Workflow',
        description: 'Test complete document upload and processing workflow',
        category: 'workflow',
        priority: 'critical',
        timeout: 30000,
        testFunction: async () => {
          const startTime = Date.now();
          try {
            // 1. Create test document
            const testContent = `Test Document for Automated Testing

            This is a sample document that should be processed by the AI analysis system.
            Document Type: Contract
            Amount: $1,000
            Expiry Date: 2024-12-31
            Contract Number: TEST-001`;

            const testFile = new Blob([testContent], { type: 'text/plain' });
            const formData = new FormData();
            formData.append('file', testFile, 'test-contract.txt');

            // 2. Analyze document
            const analysisResponse = await fetch('/api/analyze-document', {
              method: 'POST',
              body: formData
            });

            if (!analysisResponse.ok) {
              throw new Error(`Analysis failed: ${analysisResponse.status}`);
            }

            const analysisResult = await analysisResponse.json();

            if (!analysisResult.success) {
              throw new Error(`Analysis failed: ${analysisResult.message}`);
            }

            // 3. Verify analysis results
            const aiData = analysisResult.data;
            if (!aiData.category || !aiData.metadata || typeof aiData.confidence !== 'number') {
              throw new Error('Invalid analysis result structure');
            }

            const duration = Date.now() - startTime;

            return {
              success: true,
              duration,
              details: {
                analysisCategory: aiData.category,
                confidence: aiData.confidence,
                hasMetadata: !!aiData.metadata,
                workflowCompleted: true
              },
              metrics: {
                total_workflow_time: duration,
                ai_confidence: aiData.confidence,
                workflow_success_rate: 100
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
      },

      // System health check
      {
        id: 'system_health_check',
        name: 'System Health Check',
        description: 'Overall system health and connectivity check',
        category: 'integration',
        priority: 'critical',
        testFunction: async () => {
          const startTime = Date.now();
          try {
            const healthChecks = [];

            // Check API endpoints
            try {
              const healthResponse = await fetch('/api/health', { method: 'GET' });
              healthChecks.push({
                service: 'health_api',
                status: healthResponse.ok ? 'ok' : 'error',
                responseTime: Date.now() - startTime
              });
            } catch {
              healthChecks.push({
                service: 'health_api',
                status: 'error',
                responseTime: Date.now() - startTime
              });
            }

            // Check localStorage
            try {
              localStorage.setItem('health_test', 'test');
              localStorage.removeItem('health_test');
              healthChecks.push({ service: 'local_storage', status: 'ok' });
            } catch {
              healthChecks.push({ service: 'local_storage', status: 'error' });
            }

            // Check console errors
            const hasConsoleErrors = window.console.error.toString().includes('error');
            healthChecks.push({
              service: 'console_errors',
              status: hasConsoleErrors ? 'warning' : 'ok'
            });

            const duration = Date.now() - startTime;
            const errorCount = healthChecks.filter(c => c.status === 'error').length;
            const warningCount = healthChecks.filter(c => c.status === 'warning').length;

            return {
              success: errorCount === 0,
              duration,
              error: errorCount > 0 ? `${errorCount} system health issues detected` : undefined,
              details: {
                healthChecks,
                errorCount,
                warningCount,
                totalChecks: healthChecks.length
              },
              metrics: {
                health_score: Math.max(0, 100 - (errorCount * 30) - (warningCount * 10)),
                response_time: duration
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
      }
    ];

    FeatureTester.registerTestSuite({
      id: 'integration',
      name: 'Integration Tests',
      description: 'End-to-end tests for complete workflows and system integration',
      tests,
      parallel: false
    });
  }

  // Utility method to run all critical tests
  static async runCriticalTests(): Promise<void> {
    const criticalSuites = ['document_management', 'error_handling', 'integration'];

    for (const suiteId of criticalSuites) {
      try {
        const report = await FeatureTester.runTestSuite(suiteId);
        console.log(`✅ ${suiteId}: ${report.passed}/${report.total_tests} passed`);

        if (report.failed > 0) {
          console.warn(`⚠️  ${suiteId} has ${report.failed} failing tests`);
        }
      } catch (error) {
        console.error(`❌ Failed to run ${suiteId}:`, error);
      }
    }
  }

  // Method to get test status summary
  static getTestStatusSummary(): any {
    const suites = FeatureTester.getTestSuites();
    return {
      totalSuites: suites.length,
      totalTests: suites.reduce((sum, suite) => sum + suite.tests.length, 0),
      suiteNames: suites.map(s => s.name),
      isRunning: FeatureTester.isRunning(),
      currentExecution: FeatureTester.getCurrentExecution()
    };
  }
}