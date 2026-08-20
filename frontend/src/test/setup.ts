import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
