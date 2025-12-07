export interface ChartColorPalette {
  primary: string;
  success: string;
  warning: string;
  info: string;
  gray: string;
  primaryArray: string[];
  successArray: string[];
  warningArray: string[];
  infoArray: string[];
  grayArray: string[];
  length: number;
  [key: number]: string; // Index-Signatur für numerische Indizes
}

export const CHART_COLORS: ChartColorPalette = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#6366F1',
  gray: '#6B7280',
  primaryArray: ['#3B82F6', '#60A5FA', '#93C5FD'],
  successArray: ['#10B981', '#34D399', '#6EE7B7'],
  warningArray: ['#F59E0B', '#FBBF24', '#FCD34D'],
  infoArray: ['#6366F1', '#818CF8', '#A5B4FC'],
  grayArray: ['#6B7280', '#9CA3AF', '#D1D5DB'],
  length: 5, // Anzahl der Farbkategorien
  // Numerische Index-Getter
  0: '#3B82F6', // primary
  1: '#10B981', // success
  2: '#F59E0B', // warning
  3: '#6366F1', // info
  4: '#6B7280', // gray
}; 
