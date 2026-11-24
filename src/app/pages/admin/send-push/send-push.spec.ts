import { normalizeTarget } from './send-push';

describe('normalizeTarget (send to one phone)', () => {
  it('turns a US phone number into +1 format', () => {
    expect(normalizeTarget('(408) 555-0123')).toBe('+14085550123');
    expect(normalizeTarget('1 408 555 0123')).toBe('+14085550123');
  });

  it('accepts an 8-character device code', () => {
    expect(normalizeTarget(' a1b2c3d4 ')).toBe('A1B2C3D4');
    expect(normalizeTarget('12345678')).toBe('12345678');
  });

  it('rejects anything else', () => {
    expect(normalizeTarget('')).toBeNull();
    expect(normalizeTarget('555-0123')).toBeNull();
    expect(normalizeTarget('hello')).toBeNull();
  });
});
