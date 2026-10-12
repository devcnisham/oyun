import { describe, expect, it } from 'vitest';
import { hoursError } from './hours';

describe('hoursError', () => {
  it('accepts a same-day close and midnight', () => {
    expect(hoursError('06:00', '23:00')).toBeNull();
    expect(hoursError('06:00', '00:00')).toBeNull();
  });
  it('refuses half hours', () => {
    expect(hoursError('06:30', '23:00')).toMatch(/whole hours/);
    expect(hoursError('06:00', '22:30')).toMatch(/whole hours/);
  });
  it('refuses a close time after midnight or at the open time', () => {
    expect(hoursError('06:00', '02:00')).toMatch(/after midnight/);
    expect(hoursError('06:00', '06:00')).toMatch(/after opening/);
    expect(hoursError('00:00', '00:00')).toMatch(/different/);
  });
});
