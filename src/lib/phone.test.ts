import { describe, expect, test } from 'vitest';
import { maskPhone } from './phone';

describe('maskPhone', () => {
  test('keeps the first two and last two digits', () => {
    expect(maskPhone('9876543210')).toBe('98••••••10');
  });
  test('ignores a +91 prefix and spaces', () => {
    expect(maskPhone('+91 98765 43210')).toBe('98••••••10');
  });
  test('hides everything when the number is not 10 digits', () => {
    expect(maskPhone('12345')).toBe('••••••••••');
    expect(maskPhone('')).toBe('••••••••••');
  });
  test('never returns the middle digits', () => {
    expect(maskPhone('9876543210')).not.toMatch(/765432/);
  });
});
