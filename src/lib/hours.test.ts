import { describe, expect, it } from 'vitest';
import { hoursError } from './hours';

describe('hoursError', () => {
  it('accepts a same-day close, midnight, and after-midnight', () => {
    expect(hoursError('06:00', '23:00')).toBeNull();
    expect(hoursError('06:00', '00:00')).toBeNull();
    expect(hoursError('06:00', '02:00')).toBeNull();
    expect(hoursError('18:00', '03:00')).toBeNull();
  });
  it('refuses half hours', () => {
    expect(hoursError('06:30', '23:00')).toMatch(/whole hours/);
    expect(hoursError('06:00', '22:30')).toMatch(/whole hours/);
  });
  it('refuses identical open and close time or closing during the day before opening', () => {
    expect(hoursError('06:00', '06:00')).toMatch(/different/);
    expect(hoursError('00:00', '00:00')).toMatch(/different/);
    expect(hoursError('18:00', '12:00')).toMatch(/after opening/);
  });
});
