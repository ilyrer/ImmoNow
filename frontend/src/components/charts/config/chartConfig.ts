import React from 'react';
import { CHART_COLORS } from '../constants/colors';

type IconType = 'circle' | 'plainline' | 'line' | 'square' | 'rect' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
type AnimationTiming = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
type StrokeLinecap = 'butt' | 'round' | 'square';
type StrokeLinejoin = 'miter' | 'round' | 'bevel';

interface TooltipStyle {
  contentStyle?: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    boxShadow: string;
  };
  cursor?: {
    fill: string;
  };
}

interface ChartConfig {
  common: {
    style: {
      fontFamily: string;
      fontSize: string;
    };
    margin: {
      top: number;
      right: number;
      left: number;
      bottom: number;
    };
  };
  grid: {
    vertical: boolean;
    horizontal: boolean;
    strokeDasharray: string;
    stroke: string;
    opacity: number;
  };
  axis: {
    stroke: string | undefined;
    tick: {
      fill: string;
      fontSize: number;
    };
    line: {
      stroke: string | undefined;
    };
  };
  tooltip: {
    contentStyle: {
      backgroundColor: string;
      border: string;
      borderRadius: string;
      boxShadow: string;
    };
  };
  radar: {
    polarGrid: {
      stroke: string;
      strokeOpacity: number;
    };
    polarAngleAxis: {
      tick: {
        fill: string;
        fontSize: number;
      };
      line: {
        stroke: string | null;
      };
    };
    polarRadiusAxis: {
      tick: {
        fill: string;
        fontSize: number;
      };
      line: {
        stroke: string | null;
      };
    };
  };
  gradients: {
    ziel: {
      id: string;
      color1: string;
      color2: string;
      opacity: number;
    };
    aktuell: {
      id: string;
      color1: string;
      color2: string;
      opacity: number;
    };
  };
}

export const CHART_CONFIG: ChartConfig = {
  common: {
    style: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
    },
    margin: { top: 20, right: 30, left: 40, bottom: 5 },
  },
  grid: {
    vertical: false,
    horizontal: true,
    strokeDasharray: '3 3',
    stroke: '#e5e7eb',
    opacity: 0.3,
  },
  axis: {
    stroke: undefined,
    tick: {
      fill: '#9ca3af',
      fontSize: 12,
    },
    line: {
      stroke: undefined,
    },
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
  },
  radar: {
    polarGrid: {
      stroke: '#e5e7eb',
      strokeOpacity: 0.3,
    },
    polarAngleAxis: {
      tick: {
        fill: '#9ca3af',
        fontSize: 12,
      },
      line: {
        stroke: 'none',
      },
    },
    polarRadiusAxis: {
      tick: {
        fill: '#9ca3af',
        fontSize: 12,
      },
      line: {
        stroke: 'none',
      },
    },
  },
  gradients: {
    ziel: {
      id: 'colorZiel',
      color1: CHART_COLORS.gray[0],
      color2: CHART_COLORS.gray[2],
      opacity: 0.6,
    },
    aktuell: {
      id: 'colorAktuell',
      color1: CHART_COLORS.primary[0],
      color2: CHART_COLORS.primary[2],
      opacity: 0.6,
    },
  },
};

export const CHART_SERIES_COLORS = [
  CHART_COLORS.primary[0],
  CHART_COLORS.success[0],
  CHART_COLORS.warning[0],
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  label?: string;
}

export const chartHelpers = {
  formatCurrency: (value: number) => `€${value.toLocaleString()}`,
  formatPercentage: (value: number) => `${value}%`,
  formatNumber: (value: number) => value.toLocaleString(),
  createCustomTooltip: ({ active, payload, label }: TooltipProps) => {
    if (!active || !payload || !payload.length) return null;
    return React.createElement(
      'div',
      { className: 'bg-white p-3 rounded-lg shadow-md border border-gray-100' },
      [
        React.createElement('p', { className: 'text-sm font-medium text-gray-600 mb-2', key: 'label' }, label),
        ...payload.map((entry, index) =>
          React.createElement(
            'div',
            { key: index, className: 'flex items-center gap-2' },
            [
              React.createElement('div', {
                key: 'color',
                className: 'w-3 h-3 rounded-full',
                style: { backgroundColor: entry.color || CHART_COLORS.primary[0] }
              }),
              React.createElement('span', {
                key: 'text',
                className: 'text-sm font-medium text-gray-700'
              }, `${entry.name}: ${entry.value}`)
            ]
          )
        )
      ]
    );
  },
};

export const lineChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  gridStyle: {
    strokeDasharray: '3 3',
    stroke: '#E5E7EB',
  },
  axisStyle: {
    stroke: '#6B7280',
    tickLine: false,
    axisLine: false,
    tick: { fontSize: 12, fill: '#6B7280' },
  },
  lineStyle: {
    strokeWidth: 2,
    dot: { r: 4, strokeWidth: 2 },
    activeDot: { r: 6, strokeWidth: 2 },
  },
  legendStyle: {
    wrapperStyle: { paddingTop: 20 },
    iconType: 'circle' as IconType,
    iconSize: 8,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out' as AnimationTiming,
  },
};

export const areaChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  gridStyle: {
    strokeDasharray: '3 3',
    stroke: '#E5E7EB',
  },
  axisStyle: {
    stroke: '#6B7280',
    tickLine: false,
    axisLine: false,
    tick: { fontSize: 12, fill: '#6B7280' },
  },
  areaStyle: {
    strokeWidth: 2,
    strokeLinecap: 'round' as StrokeLinecap,
    strokeLinejoin: 'round' as StrokeLinejoin,
  },
  legendStyle: {
    wrapperStyle: { paddingTop: 20 },
    iconType: 'circle' as IconType,
    iconSize: 8,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out' as AnimationTiming,
  },
};

export const barChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  layout: 'vertical' as const,
  barSize: 20,
  barGap: 4,
  barCategoryGap: '20%',
  gridStyle: {
    strokeDasharray: '3 3',
    stroke: '#E5E7EB',
  },
  axisStyle: {
    stroke: '#6B7280',
    tickLine: false,
    axisLine: false,
    tick: { fontSize: 12, fill: '#6B7280' },
  },
  barStyle: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    maxBarSize: 40,
    minPointSize: 2,
  },
  tooltipStyle: {
    contentStyle: {
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    cursor: {
      fill: 'rgba(79,70,229,0.08)',
    },
  } as TooltipStyle,
  legendStyle: {
    wrapperStyle: { paddingTop: 20 },
    iconType: 'circle' as IconType,
    iconSize: 8,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out' as AnimationTiming,
  },
};

export const pieChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  pieStyle: {
    innerRadius: 60,
    outerRadius: 80,
    paddingAngle: 5,
    cornerRadius: 3,
  },
  labelStyle: {
    fill: '#6B7280',
    fontSize: 12,
    fontWeight: 500,
  },
  legendStyle: {
    wrapperStyle: { paddingTop: 20 },
    iconType: 'circle' as IconType,
    iconSize: 8,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out' as AnimationTiming,
  },
};

export const radarChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  polarGrid: {
    stroke: '#E5E7EB',
    strokeDasharray: '3 3',
  },
  polarAngleAxis: {
    stroke: '#6B7280',
    tickLine: false,
  },
  polarRadiusAxis: {
    stroke: '#6B7280',
    tickLine: false,
    axisLine: false,
  },
  radarStyle: {
    fillOpacity: 0.3,
    strokeWidth: 2,
    strokeLinecap: 'round' as 'round',
    strokeLinejoin: 'round' as 'round',
  },
  legendStyle: {
    wrapperStyle: { paddingTop: 20 },
    iconType: 'circle' as IconType,
    iconSize: 8,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out' as AnimationTiming,
  },
}; 
