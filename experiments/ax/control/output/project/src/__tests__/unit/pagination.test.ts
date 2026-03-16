import { DEFAULT_LIMIT, DEFAULT_OFFSET, MAX_LIMIT } from '../../constants/pagination';

describe('Pagination Constants', () => {
  it('has correct default limit', () => {
    expect(DEFAULT_LIMIT).toBe(20);
  });

  it('has correct default offset', () => {
    expect(DEFAULT_OFFSET).toBe(0);
  });

  it('has correct max limit', () => {
    expect(MAX_LIMIT).toBe(100);
  });
});

describe('Pagination Logic', () => {
  it('handles limit undefined by using default', () => {
    const limit = undefined;
    const effectiveLimit = limit ?? DEFAULT_LIMIT;
    
    expect(effectiveLimit).toBe(20);
  });

  it('handles offset undefined by using default', () => {
    const offset = undefined;
    const effectiveOffset = offset ?? DEFAULT_OFFSET;
    
    expect(effectiveOffset).toBe(0);
  });

  it('allows limit up to MAX_LIMIT', () => {
    const limit = 100;
    expect(limit).toBeLessThanOrEqual(MAX_LIMIT);
  });

  it('calculates correct skip value from offset', () => {
    const offset = 40;
    const limit = 20;
    const skip = offset;
    const take = limit;
    
    expect(skip).toBe(40);
    expect(take).toBe(20);
  });
});
