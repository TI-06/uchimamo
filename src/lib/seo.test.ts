import { describe, expect, it } from 'vitest';
import { absoluteUrl, normalizeSiteUrl } from './seo';

describe('normalizeSiteUrl', () => {
  it('末尾スラッシュを除去する', () => {
    expect(normalizeSiteUrl('https://example.pages.dev/')).toBe('https://example.pages.dev');
  });
});

describe('absoluteUrl', () => {
  it('サイトURLとパスからcanonical URLを作る', () => {
    expect(absoluteUrl('https://example.pages.dev/', '/products/item/')).toBe('https://example.pages.dev/products/item/');
  });
});
