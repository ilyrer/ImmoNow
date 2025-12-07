/**
 * Investor Module Types
 * Types for professional investor features
 */

export type AssetStatus = 'vermietet' | 'leer' | 'renovierung' | 'verkauf';
export type MarketplaceStatus = 'available' | 'reserved' | 'sold';

export interface InvestorAsset {
  id: string;
  address: string;
  city: string;
  sqm: number;
  value: number;
  roi: number;
  cashflow: number;
  status: AssetStatus;
  type: 'wohnung' | 'haus' | 'gewerbe' | 'grundstück';
  acquisitionDate: string;
  monthlyRent: number;
  monthlyExpenses: number;
  vacancyRate: number;
  thumbnail?: string;
}

export interface InvestorReport {
  id: string;
  month: string;
  year: number;
  roi: number;
  cashflow: number;
  vacancy: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  generatedAt: string;
  assetCount: number;
}

export interface Simulation {
  id: string;
  name: string;
  scenario: 'optimistisch' | 'realistisch' | 'pessimistisch' | 'custom';
  investment: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  renovationCosts: number;
  monthlyRent: number;
  vacancyAssumption: number;
  roiProjection: number[];
  breakEvenMonth: number;
  totalReturn: number;
  createdAt: string;
}

export interface MarketplacePackage {
  id: string;
  title: string;
  description: string;
  objects: number;
  location: string;
  city: string;
  price: number;
  roi: number;
  totalSqm: number;
  status: MarketplaceStatus;
  listedDate: string;
  seller: string;
  images: string[];
  details: {
    avgRent: number;
    occupancyRate: number;
    yearBuilt: number;
    condition: string;
  };
}

export interface VacancyTrend {
  month: string;
  rate: number;
  units: number;
}

export interface CostAnalysis {
  month: string;
  maintenance: number;
  utilities: number;
  management: number;
  revenue: number;
}

export interface PortfolioKPIs {
  totalValue: number;
  averageROI: number;
  totalCashflow: number;
  vacancyRate: number;
  assetCount: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}
