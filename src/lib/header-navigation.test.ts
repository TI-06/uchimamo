import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const headerPath = fileURLToPath(new URL('../components/Header.astro', import.meta.url));
const headerSource = readFileSync(headerPath, 'utf8');

describe('header navigation', () => {
  it('SEO記事ハブへの常設リンクを表示する', () => {
    expect(headerSource).toContain("{ href: '/learn/', label: '防犯の選び方' }");
  });
});
