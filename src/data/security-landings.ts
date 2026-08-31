import type { ProductCategory, ProductPlace } from '../types/product';

export interface SecurityLandingFilter {
  category?: ProductCategory;
  place?: ProductPlace;
  noDrilling?: boolean;
  wifiNotRequired?: boolean;
  monthlyFeeFree?: boolean;
  outdoor?: boolean;
}

export interface SecurityLanding {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  lead: string;
  conclusion: string;
  filter: SecurityLandingFilter;
  checkpoints: Array<{ heading: string; body: string }>;
  guideHref: string;
  guideLabel: string;
  updatedAt: string;
}

export const securityLandings: SecurityLanding[] = [
  {
    slug: 'no-drilling-camera',
    title: '工事不要の防犯カメラの選び方｜穴あけなしで使える候補を比較｜ウチマモ',
    description: '外壁に穴を開けずに使いたい人向けに、工事不要の防犯カメラを取付方法・電源・Wi-Fi・落下防止から比較します。',
    eyebrow: 'NO DRILLING CAMERA',
    headline: '工事不要の防犯カメラは、固定方法まで見て選ぶ。',
    lead: '「穴あけ不要」と書かれていても、実際には取付金具、電源、通信環境まで確認しないと設置できないことがあります。ウチマモでは本体だけでなく、自宅で使える条件から比較候補を整理します。',
    conclusion: 'まず固定できる場所を決め、その次にバッテリー・ソーラーなどの電源とWi-Fi到達範囲を確認すると、購入後の設置失敗を減らしやすくなります。',
    filter: { category: 'camera', noDrilling: true },
    checkpoints: [
      { heading: '固定方法を先に決める', body: '雨どい、ポール、手すり、磁石が使える金属面など、建物を傷つけずに安全に固定できる場所を確認します。落下防止ワイヤーの併用も検討します。' },
      { heading: '電源工事を避けるならバッテリーを確認', body: 'コンセント配線を増やしたくない場合はバッテリー式が候補です。日照を確保できる場所ならソーラーパネル対応も充電頻度を減らす選択肢になります。' },
      { heading: '屋外までWi-Fiが届くか確認', body: '工事不要でもWi-Fiが必要な製品は多くあります。設置予定位置でスマートフォンが安定して通信できるかを先に確認すると判断しやすくなります。' }
    ],
    guideHref: '/guide/outdoor-camera-no-drilling/',
    guideLabel: '穴あけ不要で屋外防犯カメラを設置する考え方',
    updatedAt: '2026-08-31'
  },
  {
    slug: 'no-wifi-camera',
    title: 'Wi-Fi不要の防犯カメラの選び方｜4G・LTE対応を比較｜ウチマモ',
    description: 'Wi-Fiがない実家・空き家・駐車場向けに、4G/LTE対応防犯カメラの通信費・電源・録画方法・設置条件を整理します。',
    eyebrow: 'NO WIFI CAMERA',
    headline: 'Wi-Fiがない場所は、通信費と電源をセットで考える。',
    lead: 'Wi-Fi不要のカメラは、4G/LTE回線を使うタイプが中心です。遠隔確認しやすい一方、SIMや通信プランなどの維持費が発生するため、本体価格だけで判断しないことが重要です。',
    conclusion: '実家・空き家など常時Wi-Fiを置きにくい場所ではLTE対応が有力です。月額通信費、SIM条件、ソーラー運用、録画先まで確認してから比較します。',
    filter: { category: 'camera', wifiNotRequired: true },
    checkpoints: [
      { heading: 'SIMと通信料金を確認する', body: 'LTE対応でも利用できるSIMや料金体系は製品ごとに異なります。付属SIM限定か、任意SIMが使えるか、月額費用はいくらかを販売ページで確認します。' },
      { heading: '電源のない場所はソーラーも候補', body: 'Wi-Fiがない場所は電源も確保しにくいことがあります。バッテリー容量やソーラー対応を合わせて見ると、充電のために現地へ行く回数を減らしやすくなります。' },
      { heading: '録画と遠隔確認の違いを見る', body: 'SDカード録画、クラウド保存、アプリからの遠隔確認は別機能です。必要な記録期間と、通信障害時に録画を残せるかを確認します。' }
    ],
    guideHref: '/guide/security-camera-no-wifi/',
    guideLabel: 'Wi-Fiなしで使える防犯カメラの選び方',
    updatedAt: '2026-08-31'
  },
  {
    slug: 'no-monthly-fee-camera',
    title: '月額なしで使える防犯カメラの選び方｜維持費を抑える比較ポイント｜ウチマモ',
    description: '月額料金を抑えたい家庭向けに、月額不要で使える防犯カメラを録画先・通知機能・SDカード・クラウド利用条件から比較します。',
    eyebrow: 'NO MONTHLY FEE',
    headline: '月額なしでも、録画方法によって費用は変わる。',
    lead: '「月額不要」は基本機能を追加料金なしで使える意味でも、クラウド録画や高度な通知だけ有料の場合があります。何を無料で使えるかを分けて確認するのがポイントです。',
    conclusion: '維持費を抑えるなら、本体価格だけでなくSDカードなどのローカル録画、無料通知の範囲、クラウド契約が任意かを確認します。',
    filter: { category: 'camera', monthlyFeeFree: true },
    checkpoints: [
      { heading: '無料で残せる録画先を見る', body: 'microSDなど本体側に録画できる製品は、クラウド契約なしで記録を残しやすい傾向があります。対応容量や上書き方式も確認します。' },
      { heading: '通知機能の有料範囲を確認', body: '人物検知や詳細なAI判定だけ有料プランになることがあります。自分が必要とする通知が無料範囲に含まれるかを確認します。' },
      { heading: '消耗品と充電コストも見る', body: '月額がなくてもSDカード交換、バッテリー充電、ソーラーパネル追加などの費用は発生します。数年間使う前提で維持しやすさを比較します。' }
    ],
    guideHref: '/guide/outdoor-camera-no-drilling/',
    guideLabel: '屋外カメラを設置条件から選ぶ',
    updatedAt: '2026-08-31'
  },
  {
    slug: 'entrance-security',
    title: '玄関の防犯対策を後付けで始める方法｜スマートロック・ライトを比較｜ウチマモ',
    description: '玄関の防犯を後付けで見直す人向けに、施錠、スマートロック、センサーライトなどを導入する順番と比較候補を整理します。',
    eyebrow: 'ENTRANCE SECURITY',
    headline: '玄関は、まず施錠。その上で後付け機器を足す。',
    lead: '玄関対策はスマート機器を追加する前に、既存の鍵とドアの状態を確認することが基本です。そのうえで施錠忘れ対策、夜間の抑止、通知など必要な役割を後付けします。',
    conclusion: '鍵の状態と施錠習慣を確認し、必要ならスマートロックや補助対策を追加します。便利さだけでなく、ドア形状への適合と非常時の解錠方法も確認します。',
    filter: { place: 'entrance' },
    checkpoints: [
      { heading: '既存の鍵とドアを確認', body: '鍵がスムーズに動くか、ドアの建付けに問題がないかを先に確認します。後付けスマートロックは対応するサムターン形状や設置寸法の確認が必要です。' },
      { heading: '締め忘れ対策を決める', body: 'オートロック、施錠状態の確認、家族ごとの解錠方法など、困っていることを先に決めると必要以上に高機能な製品を選びにくくなります。' },
      { heading: '夜間は照明も組み合わせる', body: '玄関周りの暗がりには人感センサーライトも有効な補助策です。カメラやスマートロックだけでなく、見通しと照明も合わせて見直します。' }
    ],
    guideHref: '/guide/house-security-diy-order/',
    guideLabel: '戸建て防犯を自分で始める順番',
    updatedAt: '2026-08-31'
  },
  {
    slug: 'window-security',
    title: '窓の防犯対策を後付けで始める方法｜補助錠・開閉センサーを比較｜ウチマモ',
    description: '窓の防犯対策を自分で始めたい人向けに、補助錠・開閉センサーなどの役割と設置前に確認したいポイントを整理します。',
    eyebrow: 'WINDOW SECURITY',
    headline: '窓は、侵入されにくくする対策と気づく対策を分ける。',
    lead: '補助錠は窓を開けにくくする対策、開閉センサーは異常に気づくための対策です。役割が違うため、どちらか1つで完結させず、窓の位置や使い方に合わせて考えます。',
    conclusion: '1階や足場のある窓から優先して、施錠・補助錠などの物理対策を確認し、必要に応じて開閉センサーなどの通知・警戒を追加します。',
    filter: { place: 'window' },
    checkpoints: [
      { heading: '狙われやすい窓から優先', body: '道路から見えにくい窓、1階の窓、物置や室外機など足場になる物の近くは優先して確認します。すべての窓へ同じ機器を付ける必要はありません。' },
      { heading: '補助錠は開閉方法との相性を見る', body: '窓の種類やサッシ形状によって取り付けられる補助錠が異なります。換気時の使い方や避難経路を妨げないかも確認します。' },
      { heading: 'センサーは通知方法を確認', body: '本体が鳴るだけのタイプと、スマートフォンへ通知できるタイプでは役割が違います。Wi-Fiやハブの有無、電池交換のしやすさも比較します。' }
    ],
    guideHref: '/guide/house-security-diy-order/',
    guideLabel: '玄関・窓・屋外の優先順位を確認する',
    updatedAt: '2026-08-31'
  },
  {
    slug: 'parking-security-camera',
    title: '駐車場の防犯カメラの選び方｜屋外・夜間・電源条件を比較｜ウチマモ',
    description: '自宅駐車場に防犯カメラを設置したい人向けに、撮影範囲、夜間性能、電源、Wi-Fi、工事不要の条件から候補を整理します。',
    eyebrow: 'PARKING CAMERA',
    headline: '駐車場は、車だけでなく人の動線が映る位置を考える。',
    lead: '高画質なカメラでも、車体だけしか映らない位置では状況確認に使いにくくなります。道路との境界や玄関への動線を含め、撮影範囲と設置高さを先に決めます。',
    conclusion: '撮影したい範囲を決めてから、夜間性能、電源、Wi-Fi、設置方法を確認します。近隣住宅や公道を必要以上に撮影しない配慮も必要です。',
    filter: { category: 'camera', place: 'parking', outdoor: true },
    checkpoints: [
      { heading: '撮影範囲を先に決める', body: '車両全体、ナンバープレート、人の出入りなど、何を確認したいかで画角が変わります。逆光や夜間照明の位置も現地で確認します。' },
      { heading: '電源と通信を現地で確認', body: '屋外コンセントがない場合はバッテリーやソーラー、Wi-Fiが届かない場合はLTE対応など、設置場所の条件から方式を絞ります。' },
      { heading: 'プライバシーに配慮する', body: '近隣住宅の窓や敷地、公道を必要以上に撮影しない角度へ調整します。録画データの保存期間やアクセス権限も家庭内で決めておきます。' }
    ],
    guideHref: '/guide/outdoor-camera-no-drilling/',
    guideLabel: '屋外カメラの設置条件を確認する',
    updatedAt: '2026-08-31'
  }
];
