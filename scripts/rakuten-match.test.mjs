import { describe, expect, it } from 'vitest';
import { selectRakutenCandidate } from './rakuten-match.mjs';

describe('selectRakutenCandidate', () => {
  it('固定itemCodeがある商品は完全一致だけを採用する', () => {
    const product = {
      id: 'lock',
      name: 'SwitchBot ロックUltra',
      brand: 'SwitchBot',
      rakuten: { keyword: 'SwitchBot ロックUltra', itemCode: 'switchbot:fixed' }
    };
    const rows = [
      { itemCode: 'switchbot:other', itemName: 'SwitchBot ロックUltra 別セット' },
      { itemCode: 'switchbot:fixed', itemName: 'SwitchBot ロックUltra 固定商品' }
    ];
    const result = selectRakutenCandidate(rows, product);
    expect(result.item?.itemCode).toBe('switchbot:fixed');
    expect(result.fixed).toBe(true);
    expect(result.needsReview).toBe(false);
  });

  it('固定itemCodeが見つからない場合は別商品へ自動すり替えしない', () => {
    const product = {
      id: 'lock',
      name: 'SwitchBot ロックUltra',
      brand: 'SwitchBot',
      rakuten: { keyword: 'SwitchBot ロックUltra', itemCode: 'switchbot:missing' }
    };
    const rows = [{ itemCode: 'switchbot:other', itemName: 'SwitchBot ロックUltra 人気セット' }];
    const result = selectRakutenCandidate(rows, product);
    expect(result.item).toBeUndefined();
    expect(result.needsReview).toBe(true);
  });

  it('itemCode未固定の商品だけ検索スコアで候補を選ぶ', () => {
    const product = {
      id: 'sensor',
      name: '窓 開閉センサー',
      brand: 'REVEX',
      rakuten: { keyword: 'REVEX 窓 開閉センサー' }
    };
    const rows = [
      { itemCode: 'a:1', itemName: '屋外 防犯カメラ' },
      { itemCode: 'b:2', itemName: 'REVEX 窓 開閉センサー 防犯' }
    ];
    const result = selectRakutenCandidate(rows, product);
    expect(result.item?.itemCode).toBe('b:2');
    expect(result.fixed).toBe(false);
  });
});
