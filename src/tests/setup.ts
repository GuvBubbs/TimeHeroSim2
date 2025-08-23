import { vi } from 'vitest'

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}

// Mock performance API if not available
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now())
  } as any
}