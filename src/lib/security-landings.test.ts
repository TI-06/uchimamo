import { describe, expect, it } from 'vitest';
import { securityLandings } from '../data/security-landings';

describe('securityLandings', () => {
  it('SEOランディングのslugが重複しない', () => {
    const slugs = securityLandings.map((landing) => landing.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('各ページに検索意図別の本文と3つの確認項目がある', () => {
    for (const landing of securityLandings) {
      expect(landing.title.length).toBeGreaterThan(20);
      expect(landing.description.length).toBeGreaterThan(40);
      expect(landing.lead.length).toBeGreaterThan(60);
      expect(landing.checkpoints).toHaveLength(3);
      expect(landing.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
