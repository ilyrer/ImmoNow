// Hauptfarben für Charts
export const COLORS = {
  primary: '#4f46e5',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',
  purple: '#8b5cf6',
  teal: '#14b8a6',
};

// Farbverläufe für verschiedene Chart-Typen
export const GRADIENTS = {
  primary: {
    start: 'rgba(79, 70, 229, 0.2)',
    end: 'rgba(79, 70, 229, 0)',
  },
  secondary: {
    start: 'rgba(59, 130, 246, 0.2)',
    end: 'rgba(59, 130, 246, 0)',
  },
  success: {
    start: 'rgba(16, 185, 129, 0.2)',
    end: 'rgba(16, 185, 129, 0)',
  },
  warning: {
    start: 'rgba(245, 158, 11, 0.2)',
    end: 'rgba(245, 158, 11, 0)',
  },
};

// Farbpalette für verschiedene Datensätze
export interface ChartColorPalette {
  primary: string[];
  success: string[];
  warning: string[];
  info: string[];
  gray: string[];
}

export const CHART_COLORS: ChartColorPalette = {
  primary: ['#4f46e5', '#818cf8', '#c7d2fe'],
  success: ['#059669', '#34d399', '#a7f3d0'],
  warning: ['#d97706', '#fbbf24', '#fde68a'],
  info: ['#0284c7', '#38bdf8', '#bae6fd'],
  gray: ['#4b5563', '#9ca3af', '#e5e7eb']
}; 
