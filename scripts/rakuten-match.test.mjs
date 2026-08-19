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

  it('modelTokens指定時は型番が一致しない候補を採用しない', () => {
    const product = {
      id: 'tapo-c425',
      name: 'Tapo C425',
      brand: 'TP-Link Tapo',
      rakuten: { keyword: 'Tapo C425', modelTokens: ['Tapo', 'C425'] }
    };
    const rows = [
      { itemCode: 'a:1', itemName: 'TP-Link Tapo C420 バッテリーカメラ' },
      { itemCode: 'b:2', itemName: 'Tapo C410 KIT 屋外カメラ' }
    ];
    const result = selectRakutenCandidate(rows, product);
    expect(result.item).toBeUndefined();
    expect(result.needsReview).toBe(true);
    expect(result.reason).toBe('model-token-mismatch');
  });

  it('excludeTokens指定時はセット商品を除外する', () => {
    const product = {
      id: 'tapo-c425',
      name: 'Tapo C425',
      brand: 'TP-Link Tapo',
      rakuten: {
        keyword: 'Tapo C425',
        modelTokens: ['Tapo', 'C425'],
        excludeTokens: ['2台', 'セット']
      }
    };
    const rows = [
      { itemCode: 'a:1', itemName: 'TP-Link Tapo C425 2台セット' },
      { itemCode: 'b:2', itemName: 'TP-Link Tapo C425 単品 防犯カメラ' }
    ];
    const result = selectRakutenCandidate(rows, product);
    expect(result.item?.itemCode).toBe('b:2');
    expect(result.needsReview).toBe(false);
  });

  it('modelTokensがすべて一致する単品候補を採用する', () => {
    const product = {
      id: 'qrio-lock-q-sl2',
      name: 'Qrio Lock Q-SL2',
      brand: 'Qrio',
      rakuten: {
        keyword: 'Qrio Lock Q-SL2',
        modelTokens: ['Qrio', 'Q-SL2'],
        excludeTokens: ['セット', 'Qrio Pad']
      }
    };
    const rows = [
      { itemCode: 'a:1', itemName: 'Qrio Pad Q-KP2' },
      { itemCode: 'b:2', itemName: 'Qrio Lock Q-SL2 スマートロック 本体' }
    ];
    const result = selectRakutenCandidate(rows, product);
    expect(result.item?.itemCode).toBe('b:2');
    expect(result.needsReview).toBe(false);
  });
});
