import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const headerPath = fileURLToPath(new URL('../components/Header.astro', import.meta.url));

describe('security hub navigation', () => {
  it('PCヘッダーから条件別の防犯ハブへ移動できる', () => {
    const source = readFileSync(headerPath, 'utf8');
    expect(source).toContain("{ href: '/security/', label: '条件から探す' }");
  });
});
