import axios from 'axios';
import { API_BASE_URL } from './api';
import type { 
  RunnerResults, 
  IterationResult, 
  RequestResult
} from '../types';

export interface RunOptions {
  environmentId?: string;
  iterations?: number;
  delay?: number;
  stopOnError?: boolean;
  folderId?: string;
  dataFileId?: string;
}

// Re-export for backward compatibility
export type { RunnerResults, IterationResult, RequestResult };

class CollectionRunnerService {
  async runCollection(collectionId: string, options: RunOptions): Promise<RunnerResults> {
    const response = await axios.post(`${API_BASE_URL}/collections/${collectionId}/run`, options);
    return response.data;
  }

  exportResultsAsJSON(result: RunnerResults): void {
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collection-run-${result.collectionName}-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportResultsAsHTML(result: RunnerResults): void {
    const html = this.generateHTMLReport(result);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collection-run-${result.collectionName}-${new Date().toISOString()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private generateHTMLReport(result: RunnerResults): string {
    const successRate = result.totalRequests > 0 
      ? ((result.passedRequests / result.totalRequests) * 100).toFixed(1)
      : '0';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collection Run Report - ${result.collectionName}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 24px;
        }
        h1 {
            margin: 0 0 8px 0;
            color: #1a1a1a;
        }
        .subtitle {
            color: #666;
            margin: 0 0 24px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: #f9f9f9;
            padding: 16px;
            border-radius: 6px;
            border-left: 4px solid #ddd;
        }
        .stat-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 4px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .stat-card.passed { border-left-color: #22c55e; }
        .stat-card.failed { border-left-color: #ef4444; }
        .stat-card.passed .stat-value { color: #22c55e; }
        .stat-card.failed .stat-value { color: #ef4444; }
        .iteration {
            margin-bottom: 32px;
        }
        .iteration-header {
            background: #f9f9f9;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-weight: 600;
        }
        .request {
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
        }
        .request-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        .method {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .method.GET { background: #dcfce7; color: #166534; }
        .method.POST { background: #fef3c7; color: #92400e; }
        .method.PUT { background: #dbeafe; color: #1e40af; }
        .method.DELETE { background: #fee2e2; color: #991b1b; }
        .status-icon {
            width: 24px;
            height: 24px;
        }
        .status-icon.passed { color: #22c55e; }
        .status-icon.failed { color: #ef4444; }
        .request-name {
            font-weight: 500;
            flex: 1;
        }
        .request-meta {
            display: flex;
            gap: 16px;
            font-size: 14px;
            color: #666;
        }
        .test-results {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e5e5e5;
        }
        .test-item {
            display: flex;
            align-items: start;
            gap: 8px;
            padding: 8px;
            background: #f9f9f9;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        .test-item.passed { background: #f0fdf4; }
        .test-item.failed { background: #fef2f2; }
        .error {
            background: #fef2f2;
            border: 1px solid #fee2e2;
            border-radius: 4px;
            padding: 12px;
            color: #991b1b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Collection Run Report</h1>
        <p class="subtitle">${result.collectionName}</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Status</div>
                <div class="stat-value">${result.status}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Requests</div>
                <div class="stat-value">${result.totalRequests}</div>
            </div>
            <div class="stat-card passed">
                <div class="stat-label">Passed</div>
                <div class="stat-value">${result.passedRequests}</div>
            </div>
            <div class="stat-card failed">
                <div class="stat-label">Failed</div>
                <div class="stat-value">${result.failedRequests}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Success Rate</div>
                <div class="stat-value">${successRate}%</div>
            </div>
        </div>
        
        ${result.iterations.map((iteration) => `
            <div class="iteration">
                <div class="iteration-header">
                    Iteration ${iteration.iteration} - ${iteration.passed} passed, ${iteration.failed} failed (${iteration.totalTime}ms)
                </div>
                ${iteration.results.map(req => `
                    <div class="request">
                        <div class="request-header">
                            <svg class="status-icon ${req.status}" fill="currentColor" viewBox="0 0 20 20">
                                ${req.status === 'passed' 
                                  ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
                                  : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
                                }
                            </svg>
                            <span class="method ${req.method}">${req.method}</span>
                            <span class="request-name">${req.requestName}</span>
                        </div>
                        <div class="request-meta">
                            <span>URL: ${req.url}</span>
                            ${req.statusCode ? `<span>Status: ${req.statusCode}</span>` : ''}
                            ${req.responseTime !== undefined ? `<span>Time: ${req.responseTime}ms</span>` : ''}
                        </div>
                        ${req.error ? `<div class="error">${req.error}</div>` : ''}
                        ${req.testResults ? `
                            <div class="test-results">
                                <strong>Tests: ${Array.isArray(req.testResults) 
                                  ? req.testResults.filter((t: any) => t.passed).length
                                  : req.testResults.passed} passed, ${Array.isArray(req.testResults)
                                  ? req.testResults.filter((t: any) => !t.passed).length
                                  : req.testResults.failed} failed</strong>
                                ${(Array.isArray(req.testResults) 
                                  ? req.testResults 
                                  : req.testResults.tests
                                ).map((test: any) => `
                                    <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                            ${test.passed 
                                              ? '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>'
                                              : '<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>'
                                            }
                                        </svg>
                                        <div>
                                            <div>${test.name}</div>
                                            ${test.error ? `<div style="color: #991b1b; font-size: 12px; margin-top: 4px;">${test.error}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666;">
            Generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;
  }
}

export default new CollectionRunnerService();
