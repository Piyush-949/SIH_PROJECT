/**
 * KRISHI SETU - Assertion Library for E2E Testing
 * Deterministic value checking and informative diff messages
 */

export class AssertionError extends Error {
  public actual: unknown;
  public expected: unknown;

  constructor(message: string, actual?: unknown, expected?: unknown) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new AssertionError(`Assertion Failed: ${message}`);
  }
}

export function fail(message: string): never {
  throw new AssertionError(`Explicit Failure: ${message}`);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export function expect<T>(actual: T) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected: unknown) {
      if (!deepEqual(actual, expected)) {
        throw new AssertionError(
          `Expected deep equality:\nActual: ${JSON.stringify(actual, null, 2)}\nExpected: ${JSON.stringify(expected, null, 2)}`,
          actual,
          expected
        );
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          `Expected ${actual} to be strictly greater than ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than or equal to ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(
          `Expected ${actual} to be strictly less than ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new AssertionError(
          `Expected ${actual} to be less than or equal to ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeCloseTo(expected: number, delta: number = 0.01) {
      if (typeof actual !== 'number' || Math.abs(actual - expected) > delta) {
        throw new AssertionError(
          `Expected ${actual} to be within ±${delta} of ${expected}`,
          actual,
          expected
        );
      }
    },
    toContain(item: unknown) {
      if (typeof actual === 'string') {
        if (!actual.includes(String(item))) {
          throw new AssertionError(
            `Expected string "${actual}" to contain "${item}"`,
            actual,
            item
          );
        }
      } else if (Array.isArray(actual)) {
        const found = actual.some(x => deepEqual(x, item) || x === item);
        if (!found) {
          throw new AssertionError(
            `Expected array to contain ${JSON.stringify(item)}`,
            actual,
            item
          );
        }
      } else {
        throw new AssertionError(`Target is neither string nor array`, actual, item);
      }
    },
    toMatch(pattern: RegExp | string) {
      const reg = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      if (typeof actual !== 'string' || !reg.test(actual)) {
        throw new AssertionError(
          `Expected "${actual}" to match pattern ${pattern}`,
          actual,
          pattern
        );
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new AssertionError(`Expected value to be defined, received undefined`, actual, 'defined');
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new AssertionError(`Expected value to be null, received ${actual}`, actual, null);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new AssertionError(`Expected truthy value, received ${actual}`, actual, true);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new AssertionError(`Expected falsy value, received ${actual}`, actual, false);
      }
    },
    toHaveProperty(prop: string) {
      if (typeof actual !== 'object' || actual === null || !(prop in actual)) {
        throw new AssertionError(
          `Expected object to have property "${prop}"`,
          actual,
          prop
        );
      }
    },
    toThrow(expectedMessagePattern?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new AssertionError(`Expected actual to be a function`);
      }
      let threw = false;
      let errorThrown: any = null;
      try {
        (actual as any)();
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new AssertionError(`Expected function to throw an error, but it returned cleanly`);
      }
      if (expectedMessagePattern && errorThrown) {
        const msg = errorThrown.message || String(errorThrown);
        const reg = typeof expectedMessagePattern === 'string' ? new RegExp(expectedMessagePattern) : expectedMessagePattern;
        if (!reg.test(msg)) {
          throw new AssertionError(
            `Expected thrown error message "${msg}" to match ${expectedMessagePattern}`,
            msg,
            expectedMessagePattern
          );
        }
      }
    }
  };
}
