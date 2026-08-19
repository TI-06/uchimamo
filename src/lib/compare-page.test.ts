import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutSource = readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
const compareCssUrl = new URL('../styles/compare-dynamic.css', import.meta.url);

describe('compare page client-rendered styles', () => {
  it('JavaScriptで生成する比較要素をグローバルCSSでスタイルする', () => {
    expect(layoutSource).toContain("import '../styles/compare-dynamic.css';");
    expect(existsSync(compareCssUrl)).toBe(true);
    if (!existsSync(compareCssUrl)) return;
    const css = readFileSync(compareCssUrl, 'utf8');
    expect(css).toContain('.summary-card');
    expect(css).toContain('.verdict-card');
    expect(css).toContain('.matrix-cell');
    expect(css).toContain('.matrix-row-label');
    expect(css).toContain('.matrix-product');
  });
});
