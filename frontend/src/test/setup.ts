import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000/api/v1',
    VITE_BACKEND_HOST: 'localhost',
    VITE_BACKEND_PORT: '5000',
  },
}));
