export type ProductCategory = 'camera' | 'smart-lock' | 'sensor' | 'window-lock' | 'light';
export type ProductPlace = 'entrance' | 'window' | 'parking' | 'garden' | 'backdoor' | 'indoor';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  score: number;
  priceBand?: { min?: number; max?: number };
  installation: {
    noDrilling: boolean;
    diy: boolean;
    outdoor: boolean;
    indoor: boolean;
  };
  connectivity: {
    wifiRequired: boolean;
    lteSupported: boolean;
  };
  power: {
    ac: boolean;
    battery: boolean;
    solar: boolean;
  };
  storage?: {
    sd: boolean;
    cloud: boolean;
    local: boolean;
  };
  monthlyFeeRequired: boolean;
  features: string[];
  targetUsers: string[];
  places: ProductPlace[];
  editorial?: {
    verdict: string;
    bestFor: string;
    pros: string[];
    cautions: string[];
    scoreBreakdown?: {
      installation: number;
      features: number;
      cost: number;
      maintenance: number;
    };
  };
  rakuten: {
    enabled: boolean;
    keyword: string;
    itemCode?: string;
    modelTokens?: string[];
    excludeTokens?: string[];
  };
  asp?: {
    provider: string;
    url: string;
    label: string;
  };
}

export interface ProductFilters {
  category?: ProductCategory;
  place?: ProductPlace;
  noDrilling?: boolean;
  wifiNotRequired?: boolean;
  powerNotRequired?: boolean;
  battery?: boolean;
  solar?: boolean;
  monthlyFeeFree?: boolean;
  outdoor?: boolean;
}
