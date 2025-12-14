/**
 * Professional Finance Types for Banking-Grade Calculations
 * Includes ROI, Cashflow Analysis, Tax Benefits, and Scenario Comparison
 */

// ==================== CORE FINANCING TYPES ====================

export interface FinancingParameters {
  propertyPrice: number;
  equity: number;
  interestRate: number;
  loanTerm: number; // Total loan term in years
  fixedRatePeriod?: number; // Zinsbindungsfrist in years (can be shorter than loanTerm)
  additionalCosts: number;
  includeInsurance: boolean;
  insuranceRate: number;
  includeRepayment: boolean;
  repaymentAmount: number;
  maintenanceRate: number;

  // NEW: Special repayments configuration
  specialRepayments?: SpecialRepaymentSchedule[];

  // NEW: Fees structure
  fees?: {
    processingFee: number; // Bearbeitungsgebühr
    appraisalFee: number; // Schätzgebühr
    brokerFee: number; // Vermittlungsgebühr
  };

  // NEW: Optional repayment rate (Tilgungssatz)
  repaymentRate?: number; // Initial repayment rate in %
}

// NEW: Special repayment configuration
export interface SpecialRepaymentSchedule {
  id: string;
  amount: number;
  amountType: 'fixed' | 'percentage'; // Fixed amount or % of original loan
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'once';
  startMonth: number;
  endMonth?: number; // Optional end date for recurring repayments
}

export interface AmortizationEntry {
  month: number;
  year: number;
  monthlyPayment: number;
  interest: number;
  principal: number;
  remainingDebt: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  isFixedRatePeriod?: boolean; // NEW: Indicates if still within fixed rate period
}

export interface YearlyAmortization {
  year: number;
  remainingDebt: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  yearlyInterest: number;
  yearlyPrincipal: number;
  progress: number; // percentage
}

export interface FinancingResult {
  // Core monthly payment
  monthlyPayment: number; // Total including all costs
  baseMonthlyPayment: number; // NEW: Just loan payment (without insurance/maintenance)
  totalInterest: number;
  totalCost: number;
  loanAmount: number;

  // Additional monthly costs (legacy naming, kept for compatibility)
  monthlyInterest: number; // Actually insurance
  monthlyPrincipal: number; // Actually maintenance

  // Schedules
  amortizationSchedule: AmortizationEntry[];
  chartData: YearlyAmortization[];

  // Rates and ratios
  effectiveInterestRate: number;
  loanToValue: number; // Beleihungsauslauf
  repaymentRate: number; // NEW: Initial Tilgungssatz in %
  equityRatio: number; // NEW: Eigenkapitalquote in %

  // NEW: Fixed rate period
  fixedRatePeriod: number; // Zinsbindungsfrist in years
  remainingDebtAfterFixedRate: number; // Restschuld nach Zinsbindung

  // NEW: Fees breakdown
  fees: {
    processing: number;
    appraisal: number;
    broker: number;
    total: number;
  };
}

// ==================== BANK COMPARISON TYPES ====================

export interface BankOffer {
  id: string;
  bankName: string;
  bankLogo?: string;
  interestRate: number;
  effectiveRate: number;
  processingFee: number; // Bearbeitungsgebühr
  appraisalFee: number; // Schätzgebühr
  fixedRatePeriod: number; // Zinsbindungsfrist (Jahre)
  maxLoanToValue: number; // max. Beleihung (%)
  minEquity: number; // Mindesteigenkapital (%)
  repaymentOptions: {
    allowSpecialRepayment: boolean;
    specialRepaymentLimit: number; // % pro Jahr
    repaymentRate: number; // Tilgungssatz %
  };
  insurance: {
    required: boolean;
    monthlyRate: number;
  };
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  rating: number; // 1-5 stars
  pros: string[];
  cons: string[];
  recommendation: boolean;
}

export interface BankComparisonResult {
  offers: BankOffer[];
  bestOffer: BankOffer;
  averageRate: number;
  potentialSavings: number;
}

// ==================== INVESTMENT ANALYSIS TYPES ====================

export interface RentalIncome {
  monthlyRent: number;
  yearlyRent: number;
  vacancyRate: number; // Leerstandsquote %
  effectiveYearlyRent: number;
}

export interface OperatingCosts {
  maintenance: number;
  insurance: number;
  propertyTax: number; // Grundsteuer
  propertyManagement: number; // Hausverwaltung
  reserves: number; // Instandhaltungsrücklage
  utilities: number; // Nebenkosten (falls nicht umlegbar)
  total: number;
}

export interface TaxBenefits {
  depreciationAmount: number; // AfA (Abschreibung für Abnutzung)
  deductibleInterest: number; // Absetzbare Zinsen
  deductibleCosts: number; // Absetzbare Nebenkosten
  taxSavings: number; // Steuerersparnis
  effectiveTaxRate: number; // Persönlicher Steuersatz
}

export interface CashflowAnalysis {
  income: RentalIncome;
  costs: OperatingCosts;
  financing: {
    monthlyPayment: number;
    yearlyPayment: number;
  };
  taxBenefits: TaxBenefits;
  monthlyCashflow: number;
  yearlyCashflow: number;
  cashflowBeforeTax: number;
  cashflowAfterTax: number;
  cashOnCashReturn: number; // % Rendite auf Eigenkapital
  breakEvenOccupancy: number; // Mindestauslastung für Break-Even
}

export interface ROIMetrics {
  capRate: number; // Kapitalisierungsrate (Nettomietrendite)
  cashOnCashReturn: number;
  totalROI: number; // Gesamtrendite inkl. Wertsteigerung
  irr: number; // Internal Rate of Return
  paybackPeriod: number; // Amortisationsdauer (Jahre)
  equityMultiple: number; // Eigenkapitalvervielfachung
}

export interface PropertyAppreciation {
  currentValue: number;
  appreciationRate: number; // % pro Jahr
  projectedValue5Y: number;
  projectedValue10Y: number;
  projectedValue20Y: number;
  totalAppreciation: number;
}

export interface InvestmentAnalysis {
  propertyPrice: number;
  equity: number;
  financing: FinancingResult;
  cashflow: CashflowAnalysis;
  createdAt: string; // NEW: ISO timestamp
  updatedAt: string; // NEW: ISO timestamp
  roi: ROIMetrics;
  appreciation: PropertyAppreciation;
  totalReturn: {
    cashflowTotal: number;
    appreciationTotal: number;
    combinedReturn: number;
    roiPercentage: number;
  };
  riskScore: number; // 1-10 (1=niedrig, 10=hoch)
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'avoid';
}

// ==================== SCENARIO COMPARISON TYPES ====================

export interface FinancingScenario {
  id: string;
  name: string;
  description: string;
  parameters: FinancingParameters;
  result: FinancingResult;
  investmentAnalysis?: InvestmentAnalysis;
  score: number; // Gesamtbewertung 0-100
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ScenarioComparison {
  scenarios: FinancingScenario[];
  bestScenario: FinancingScenario;
  comparison: {
    lowestMonthlyPayment: number;
    lowestTotalCost: number;
    shortestPayoffTime: number;
    highestROI: number;
  };
}

// ==================== CALCULATOR STATE TYPES ====================

export interface CalculatorState {
  parameters: FinancingParameters;
  result: FinancingResult | null;
  bankComparison: BankComparisonResult | null;
  investmentAnalysis: InvestmentAnalysis | null;
  scenarios: FinancingScenario[];
  activeView: 'basic' | 'comparison' | 'investment' | 'scenarios';
  loading: boolean;
  error: string | null;
}

// ==================== EXPORT TYPES ====================

export interface WordExportOptions {
  customerName: string;
  propertyAddress: string;
  bankName: string;
  includeAmortization: boolean;
  includeBankComparison: boolean;
  includeInvestmentAnalysis: boolean;
  includeCharts: boolean;
}

export interface PDFExportOptions extends WordExportOptions {
  template: 'standard' | 'premium' | 'investment';
  watermark?: string;
}

// ==================== HELPER TYPES ====================

export type Currency = number;
export type Percentage = number;
export type Years = number;
export type Months = number;

export interface CurrencyFormatter {
  format: (value: Currency) => string;
}

export interface PercentageFormatter {
  format: (value: Percentage) => string;
}

// ==================== VALIDATION TYPES ====================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationRules {
  propertyPrice: { min: number; max: number };
  equity: { min: number; max: number; minPercent: number };
  interestRate: { min: number; max: number };
  loanTerm: { min: number; max: number };
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: keyof FinancingParameters;
    message: string;
  }[];
  warnings: {
    field: keyof FinancingParameters;
    message: string;
  }[];
}
