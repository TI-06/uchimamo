import { describe, expect, it } from 'vitest';
import { guides } from '../data/guides';
import { validateGuideCatalog } from './guides';


describe('guide catalog', () => {
  it('初期ガイドを10本以上持ち、slugが重複しない', () => {
    expect(guides.length).toBeGreaterThanOrEqual(10);
    expect(new Set(guides.map((guide) => guide.slug)).size).toBe(guides.length);
  });

  it('公開に必要な項目と十分なセクションを持つ', () => {
    expect(validateGuideCatalog(guides)).toEqual([]);
  });
});
