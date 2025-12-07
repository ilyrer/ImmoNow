import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  TooltipProps,
} from 'recharts';
import {
  lineChartConfig,
  areaChartConfig,
  barChartConfig,
  pieChartConfig,
  radarChartConfig,
  chartHelpers,
  CHART_SERIES_COLORS,
} from './config/chartConfig';
import { CHART_COLORS } from './constants/colors';

interface ChartProps {
  data: any[];
  keys: string[];
  labels?: string[];
  height?: number;
  width?: string;
  className?: string;
}

const getColorFromPalette = (index: number): string => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

export const LineChartComponent: React.FC<ChartProps> = ({
  data,
  keys,
  labels,
  height = 300,
  width = '100%',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={lineChartConfig.margin}>
          <defs>
            {keys.map((key, index) => (
              <linearGradient
                key={key}
                id={`gradient-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={getColorFromPalette(index)}
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor={getColorFromPalette(index)}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray={lineChartConfig.gridStyle.strokeDasharray}
            stroke={lineChartConfig.gridStyle.stroke}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke={lineChartConfig.axisStyle.stroke}
            tickLine={lineChartConfig.axisStyle.tickLine}
            axisLine={lineChartConfig.axisStyle.axisLine}
            tick={lineChartConfig.axisStyle.tick}
          />
          <YAxis
            stroke={lineChartConfig.axisStyle.stroke}
            tickLine={lineChartConfig.axisStyle.tickLine}
            axisLine={lineChartConfig.axisStyle.axisLine}
            tick={lineChartConfig.axisStyle.tick}
          />
          <Tooltip 
            content={chartHelpers.createCustomTooltip as any}
            cursor={{
              stroke: '#e5e7eb',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
          />
          <Legend
            wrapperStyle={lineChartConfig.legendStyle.wrapperStyle}
            iconType={lineChartConfig.legendStyle.iconType}
            iconSize={lineChartConfig.legendStyle.iconSize}
          />
          {keys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={labels?.[index] || key}
              stroke={getColorFromPalette(index)}
              strokeWidth={lineChartConfig.lineStyle.strokeWidth}
              dot={lineChartConfig.lineStyle.dot}
              activeDot={lineChartConfig.lineStyle.activeDot}
              animationDuration={lineChartConfig.animation.duration}
              animationEasing={lineChartConfig.animation.easing}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AreaChartComponent: React.FC<ChartProps> = ({
  data,
  keys,
  labels,
  height = 300,
  width = '100%',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={areaChartConfig.margin}>
          <defs>
            {keys.map((key, index) => (
              <linearGradient
                key={key}
                id={`gradient-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.primary[index % 3]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.primary[index % 3]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray={areaChartConfig.gridStyle.strokeDasharray}
            stroke={areaChartConfig.gridStyle.stroke}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke={areaChartConfig.axisStyle.stroke}
            tickLine={areaChartConfig.axisStyle.tickLine}
            axisLine={areaChartConfig.axisStyle.axisLine}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            stroke={areaChartConfig.axisStyle.stroke}
            tickLine={areaChartConfig.axisStyle.tickLine}
            axisLine={areaChartConfig.axisStyle.axisLine}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip content={chartHelpers.createCustomTooltip as any} />
          <Legend
            wrapperStyle={areaChartConfig.legendStyle.wrapperStyle}
            iconType={areaChartConfig.legendStyle.iconType}
            iconSize={areaChartConfig.legendStyle.iconSize}
          />
          {keys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={labels?.[index] || key}
              stroke={CHART_COLORS.primary[index % 3]}
              fill={`url(#gradient-${key})`}
              strokeWidth={areaChartConfig.areaStyle.strokeWidth}
              strokeLinecap={areaChartConfig.areaStyle.strokeLinecap}
              strokeLinejoin={areaChartConfig.areaStyle.strokeLinejoin}
              animationDuration={areaChartConfig.animation.duration}
              animationEasing={areaChartConfig.animation.easing}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BarChartComponent: React.FC<ChartProps> = ({
  data,
  keys,
  labels,
  height = 300,
  width = '100%',
  className = '',
}) => {
  const getBarColor = (key: string, index: number) =>
    CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length] || getColorFromPalette(index);

  return (
    <div className={`relative ${className}`} style={{ height, width, background: 'linear-gradient(90deg, #23293a 0%, #1e2230 100%)', borderRadius: 18, padding: 18, boxShadow: '0 4px 32px rgba(30,41,59,0.12)' }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={barChartConfig.margin}
          layout={barChartConfig.layout}
          barGap={barChartConfig.barGap}
          barCategoryGap={barChartConfig.barCategoryGap}
        >
          <CartesianGrid
            strokeDasharray="4 8"
            stroke={barChartConfig.gridStyle.stroke}
            horizontal={false}
            vertical={true}
          />
          <XAxis
            type="number"
            stroke={barChartConfig.axisStyle.stroke}
            tickLine={barChartConfig.axisStyle.tickLine}
            axisLine={barChartConfig.axisStyle.axisLine}
            tick={barChartConfig.axisStyle.tick}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={barChartConfig.axisStyle.stroke}
            tickLine={barChartConfig.axisStyle.tickLine}
            axisLine={barChartConfig.axisStyle.axisLine}
            tick={barChartConfig.axisStyle.tick}
          />
          <Tooltip
            content={chartHelpers.createCustomTooltip as any}
            cursor={barChartConfig.tooltipStyle.cursor}
            wrapperStyle={barChartConfig.tooltipStyle.contentStyle}
          />
          <Legend
            wrapperStyle={{ ...barChartConfig.legendStyle.wrapperStyle, marginTop: 12, fontSize: 18 }}
            iconType={barChartConfig.legendStyle.iconType}
            iconSize={22}
          />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={labels?.[index] || key}
              fill={getBarColor(key, index)}
              radius={barChartConfig.barStyle.radius}
              maxBarSize={barChartConfig.barStyle.maxBarSize}
              minPointSize={barChartConfig.barStyle.minPointSize}
              animationDuration={barChartConfig.animation.duration}
              animationEasing={barChartConfig.animation.easing}
              label={{
                position: 'right',
                fill: '#fff',
                fontWeight: 700,
                fontSize: 18,
                filter: 'drop-shadow(0 2px 6px rgba(30,41,59,0.25))',
                formatter: (value: number) => value,
              }}
              style={{ filter: 'drop-shadow(0 2px 12px rgba(79,70,229,0.13))', transition: 'filter 0.2s' }}
              isAnimationActive
              onMouseOver={e => {
                // Optional: Glow-Effekt
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChartComponent: React.FC<{
  data: { name: string; value: number }[];
  height?: number;
  width?: string;
  className?: string;
}> = ({ data, height = 300, width = '100%', className = '' }) => {
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <ResponsiveContainer>
        <PieChart margin={pieChartConfig.margin}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={pieChartConfig.pieStyle.innerRadius}
            outerRadius={pieChartConfig.pieStyle.outerRadius}
            paddingAngle={pieChartConfig.pieStyle.paddingAngle}
            cornerRadius={pieChartConfig.pieStyle.cornerRadius}
            dataKey="value"
            label={({ name, percent }) => (
              <text
                x={0}
                y={0}
                dy={8}
                textAnchor="middle"
                fill={pieChartConfig.labelStyle.fill}
                fontSize={pieChartConfig.labelStyle.fontSize}
                fontWeight={pieChartConfig.labelStyle.fontWeight}
              >
                {`${name} ${(percent * 100).toFixed(0)}%`}
              </text>
            )}
            animationDuration={pieChartConfig.animation.duration}
            animationEasing={pieChartConfig.animation.easing as any}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColorFromPalette(index)}
              />
            ))}
          </Pie>
          <Tooltip content={chartHelpers.createCustomTooltip as any} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RadarChartComponent: React.FC<ChartProps> = ({
  data,
  keys,
  labels,
  height = 300,
  width = '100%',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <ResponsiveContainer>
        <RadarChart data={data} margin={radarChartConfig.margin}>
          <PolarGrid
            stroke={radarChartConfig.polarGrid.stroke}
            strokeDasharray={radarChartConfig.polarGrid.strokeDasharray}
          />
          <PolarAngleAxis
            dataKey="name"
            stroke={radarChartConfig.polarAngleAxis.stroke}
            tickLine={radarChartConfig.polarAngleAxis.tickLine}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            stroke={radarChartConfig.polarRadiusAxis.stroke}
            tickLine={radarChartConfig.polarRadiusAxis.tickLine}
            axisLine={radarChartConfig.polarRadiusAxis.axisLine}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip content={chartHelpers.createCustomTooltip as any} />
          <Legend
            wrapperStyle={radarChartConfig.legendStyle.wrapperStyle}
            iconType={radarChartConfig.legendStyle.iconType}
            iconSize={radarChartConfig.legendStyle.iconSize}
          />
          {keys.map((key, index) => (
            <Radar
              key={key}
              name={labels?.[index] || key}
              dataKey={key}
              stroke={getColorFromPalette(index)}
              fill={getColorFromPalette(index)}
              fillOpacity={radarChartConfig.radarStyle.fillOpacity}
              strokeWidth={radarChartConfig.radarStyle.strokeWidth}
              strokeLinecap={radarChartConfig.radarStyle.strokeLinecap as any}
              strokeLinejoin={radarChartConfig.radarStyle.strokeLinejoin as any}
              animationDuration={radarChartConfig.animation.duration}
              animationEasing={radarChartConfig.animation.easing as any}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}; 
