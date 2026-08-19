import type { Product, ProductPlace } from '../types/product';

export interface DiagnosisAnswers {
  residence: 'house' | 'apartment' | 'rental' | 'parents-home' | 'vacant-home';
  place: ProductPlace;
  power: 'available' | 'none' | 'unknown';
  wifi: 'available' | 'none' | 'unknown';
  drilling: 'yes' | 'no' | 'unknown';
  budget: number;
}

export interface DiagnosisResult {
  score: number;
  priorities: Array<{ title: string; level: 'high' | 'medium' | 'low'; reason: string }>;
  recommendedProductIds: string[];
}

const residenceLabels: Record<DiagnosisAnswers['residence'], string> = {
  house: '戸建て', apartment: 'マンション', rental: '賃貸', 'parents-home': '実家', 'vacant-home': '空き家'
};

const placeLabels: Record<ProductPlace, string> = {
  entrance: '玄関', window: '窓', parking: '駐車場', garden: '庭', backdoor: '勝手口', indoor: '室内'
};

function suitability(product: Product, answers: DiagnosisAnswers): number {
  let points = product.score / 5;
  if (product.places.includes(answers.place)) points += 60;
  else points -= 20;

  if (answers.drilling === 'no') points += product.installation.noDrilling ? 25 : -80;
  if (answers.wifi === 'none') points += (!product.connectivity.wifiRequired || product.connectivity.lteSupported) ? 25 : -90;
  if (answers.power === 'none') points += (product.power.battery || product.power.solar) ? 25 : -70;
  if (product.targetUsers.includes(residenceLabels[answers.residence])) points += 10;
  if (product.priceBand?.min && product.priceBand.min > answers.budget) points -= 25;
  else if (product.priceBand?.min) points += 5;
  return points;
}

export function diagnoseSecurity(answers: DiagnosisAnswers, products: Product[]): DiagnosisResult {
  const ranked = products
    .map((product) => ({ product, points: suitability(product, answers) }))
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points);

  let score = 62;
  if (answers.drilling === 'no') score -= 5;
  if (answers.power === 'none') score -= 8;
  if (answers.wifi === 'none') score -= 8;
  if (answers.residence === 'vacant-home') score -= 12;
  score = Math.max(10, Math.min(100, score));

  const priorities: DiagnosisResult['priorities'] = [
    {
      title: `${placeLabels[answers.place]}の侵入・異常検知`,
      level: 'high',
      reason: '最初に守りたい場所へ、設置条件に合う機器を配置します。'
    },
    {
      title: answers.drilling === 'no' ? '工事不要で設置' : '確実な固定方法を選択',
      level: 'medium',
      reason: answers.drilling === 'no' ? '穴あけ不要の製品を優先します。' : '設置環境に合う固定方法を選びます。'
    },
    {
      title: '通知・記録方法を確認',
      level: 'low',
      reason: '月額、保存先、通信条件まで含めて継続運用しやすい構成にします。'
    }
  ];

  return {
    score,
    priorities,
    recommendedProductIds: ranked.slice(0, 3).map((entry) => entry.product.id)
  };
}
