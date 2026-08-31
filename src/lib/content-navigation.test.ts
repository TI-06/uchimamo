import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const bottomNavPath = fileURLToPath(new URL('../components/BottomNav.astro', import.meta.url));
const learnIndexPath = fileURLToPath(new URL('../pages/learn/index.astro', import.meta.url));

describe('content navigation', () => {
  it('モバイル下部ナビの記事導線はSEO記事ハブを向く', () => {
    const source = readFileSync(bottomNavPath, 'utf8');
    expect(source).toContain("{ href: '/learn/', label: '記事', icon: 'book' }");
    expect(source).not.toContain("{ href: '/guide/', label: '記事', icon: 'book' }");
  });

  it('SEO記事ハブから既存の防犯ガイドへ移動できる', () => {
    const source = readFileSync(learnIndexPath, 'utf8');
    expect(source).toContain('href="/guide/"');
    expect(source).toContain('基礎防犯ガイド');
  });
});
