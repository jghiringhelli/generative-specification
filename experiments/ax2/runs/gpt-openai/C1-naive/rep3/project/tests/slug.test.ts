import { describe, expect, it } from 'vitest';
import { createSlug } from '../src/utils/slug';

describe('createSlug', () => {
  it('creates a URL-safe unique slug from an article title', () => {
    const first = createSlug('Hello, World!');
    const second = createSlug('Hello, World!');
    expect(first).toMatch(/^hello-world-[a-f0-9]{8}$/);
    expect(second).not.toBe(first);
  });
});
