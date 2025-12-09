import { API_BASE_URL } from './api';

const API_URL = API_BASE_URL;

export interface HistoryEntry {
  id: string;
  requestId?: string;
  userId: string;
  method: string;
  url: string;
  requestBodyId: string;
  responseBodyId?: string;
  statusCode?: number;
  responseTime?: number;
  executedAt: string;
  request?: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
}

export interface HistoryResponse {
  history: HistoryEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface HistoryFilters {
  userId?: string;
  limit?: number;
  offset?: number;
  requestId?: string;
  method?: string;
  statusCodeMin?: number;
  statusCodeMax?: number;
  urlPattern?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryDetail extends HistoryEntry {
  requestBody: {
    headers: Array<{ key: string; value: string }>;
    body: {
      type: string;
      content: string;
    };
    auth: {
      type: string;
    };
  };
  responseBody?: {
    headers: Array<{ key: string; value: string }>;
    body: any;
    cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: string;
    }>;
    size: number;
  };
}

/**
 * Fetch request history with optional filters
 */
export async function fetchHistory(filters: HistoryFilters = {}): Promise<HistoryResponse> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`${API_URL}/requests/history?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

/**
 * Fetch a specific history entry with full details
 */
export async function fetchHistoryDetail(
  historyId: string
): Promise<HistoryDetail> {
  const response = await fetch(
    `${API_URL}/requests/history/${historyId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch history detail');
  }

  return response.json();
}

/**
 * Delete a specific history entry
 */
export async function deleteHistoryEntry(
  historyId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/requests/history/${historyId}`,
    {
      method: 'DELETE',
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to delete history entry');
  }
}

/**
 * Clear all history for a user
 */
export async function clearAllHistory(): Promise<void> {
  const response = await fetch(`${API_URL}/requests/history`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to clear history');
  }
}

/**
 * Export history as JSON
 */
export async function exportHistory(filters: HistoryFilters = {}): Promise<Blob> {
  // Fetch all history without pagination
  const allHistory: HistoryEntry[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchHistory({ ...filters, limit, offset });
    allHistory.push(...response.history);
    hasMore = response.hasMore;
    offset += limit;
  }

  const json = JSON.stringify(allHistory, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Download exported history
 */
export function downloadHistory(blob: Blob, filename: string = 'request-history.json'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
