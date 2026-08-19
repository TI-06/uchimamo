import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const homePath = fileURLToPath(new URL('../pages/index.astro', import.meta.url));
const layoutPath = fileURLToPath(new URL('../layouts/BaseLayout.astro', import.meta.url));
const homeSource = readFileSync(homePath, 'utf8');
const layoutSource = readFileSync(layoutPath, 'utf8');

describe('premium home page', () => {
  it('Search Console verification metaを共通headに出力する', () => {
    expect(layoutSource).toContain('google-site-verification');
    expect(layoutSource).toContain('sF2foqS0K9hluvQTJslEp1ZGHOZv6p19uIvzsBXb03E');
  });

  it('意味の分かりにくい旧62点ハウスUIを残さない', () => {
    expect(homeSource).not.toContain('score-ring');
    expect(homeSource).not.toContain('house-map');
    expect(homeSource).not.toContain('<strong>62</strong>');
  });

  it('30秒診断の入力と結果が一目で分かるプレビューを表示する', () => {
    expect(homeSource).toContain('30秒診断でわかること');
    expect(homeSource).toContain('01 住まい');
    expect(homeSource).toContain('02 気になる場所');
    expect(homeSource).toContain('03 設置条件');
    expect(homeSource).toContain('あなたなら、まずこの3対策');
  });

  it('診断・商品検索・比較の3つの主要導線をファーストビュー直下に持つ', () => {
    expect(homeSource).toContain('30秒診断');
    expect(homeSource).toContain('条件から探す');
    expect(homeSource).toContain('3商品を比較');
    expect(homeSource).toContain('href="/diagnosis/"');
    expect(homeSource).toContain('href="/products/"');
    expect(homeSource).toContain('href="/compare/"');
  });

  it('編集済み商品と自動発掘商品を分けて表示する', () => {
    expect(homeSource).toContain('discovered-products.json');
    expect(homeSource).toContain('編集済み');
    expect(homeSource).toContain('自動発掘');
  });
});
