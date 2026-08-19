import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../pages/compare.astro', import.meta.url), 'utf8');

describe('compare page client-rendered styles', () => {
  it('JavaScriptで生成する比較要素へページCSSが適用される', () => {
    expect(source).toContain('<style is:global>');
    expect(source).not.toContain(':global(');
    expect(source).toContain('.matrix-cell');
    expect(source).toContain('.matrix-row-label');
    expect(source).toContain('.summary-card');
  });
});
