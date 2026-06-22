import React from 'react';
import { ThreatEvent } from '../threat-hunting/types';

interface TrendChartProps {
  events: ThreatEvent[];
  timeRange: '24h' | '7d' | '30d';
}

interface DataPoint {
  label: string;
  value: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ events, timeRange }) => {
  // Use a fixed baseline date (June 17, 2026) matching the mock events timeline
  const baseDate = new Date('2026-06-17T12:00:00Z');

  // Process data points based on timeRange
  const getDataPoints = (): DataPoint[] => {
    const points: DataPoint[] = [];

    if (timeRange === '24h') {
      // Group by 4-hour intervals for the past 24 hours
      for (let i = 5; i >= 0; i--) {
        const hourTime = new Date(baseDate.getTime() - i * 4 * 60 * 60 * 1000);
        const hourLabel = hourTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        // Count events in this 4-hour bucket
        const count = events.filter(e => {
          const eTime = new Date(e.timestamp.replace(' UTC', 'Z')).getTime();
          const bucketStart = hourTime.getTime() - 2 * 60 * 60 * 1000;
          const bucketEnd = hourTime.getTime() + 2 * 60 * 60 * 1000;
          return eTime >= bucketStart && eTime < bucketEnd;
        }).length;

        points.push({ label: hourLabel, value: count });
      }
    } else if (timeRange === '7d') {
      // Group by last 7 days
      for (let i = 6; i >= 0; i--) {
        const dayTime = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = dayTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

        // Count events on this day
        const count = events.filter(e => {
          const eDate = new Date(e.timestamp.replace(' UTC', 'Z'));
          return eDate.toDateString() === dayTime.toDateString();
        }).length;

        points.push({ label: dayLabel, value: count });
      }
    } else {
      // Group by last 5 weeks for 30d (approx 30 days)
      for (let i = 4; i >= 0; i--) {
        const weekTime = new Date(baseDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekLabel = `Wk -${i}`;

        const count = events.filter(e => {
          const eTime = new Date(e.timestamp.replace(' UTC', 'Z')).getTime();
          const weekStart = weekTime.getTime() - 3.5 * 24 * 60 * 60 * 1000;
          const weekEnd = weekTime.getTime() + 3.5 * 24 * 60 * 60 * 1000;
          return eTime >= weekStart && eTime < weekEnd;
        }).length;

        points.push({ label: weekLabel, value: count });
      }
    }

    return points;
  };

  const data = getDataPoints();
  const maxVal = Math.max(...data.map(p => p.value), 4); // minimum upper limit of 4 for spacing

  // SVG dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Scale functions
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return paddingTop + chartHeight - (value / maxVal) * chartHeight;
  };

  // Generate paths
  const pointsCoords = data.map((p, idx) => ({ x: getX(idx), y: getY(p.value) }));

  let linePath = '';
  let areaPath = '';

  if (pointsCoords.length > 0) {
    // Generate curved line paths
    linePath = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;
    for (let i = 1; i < pointsCoords.length; i++) {
      const prev = pointsCoords[i - 1];
      const curr = pointsCoords[i];
      // Control point for smooth cubic bezier
      const cpX1 = prev.x + (curr.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (2 * (curr.x - prev.x)) / 3;
      const cpY2 = curr.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    // Generate area path
    const baselineY = paddingTop + chartHeight;
    areaPath = `${linePath} L ${pointsCoords[pointsCoords.length - 1].x} ${baselineY} L ${pointsCoords[0].x} ${baselineY} Z`;
  }

  // Generate gridlines for Y-axis
  const gridTicks = 4;
  const yTicks = Array.from({ length: gridTicks + 1 }, (_, i) => (maxVal / gridTicks) * i);

  return (
    <div className="an-chart-wrapper">
      <svg className="an-chart-svg" viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          {/* Violet line gradient */}
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          {/* Soft area gradient */}
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </linearGradient>
          {/* Grid background pattern */}
          <linearGradient id="risk-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines & labels */}
        {yTicks.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx}>
              <line
                className="an-chart-gridline"
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
              />
              <text className="an-chart-text" x={paddingLeft - 10} y={y + 3} textAnchor="end">
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((p, idx) => {
          const x = getX(idx);
          return (
            <text
              key={idx}
              className="an-chart-text"
              x={x}
              y={height - paddingBottom + 20}
              textAnchor="middle"
            >
              {p.label}
            </text>
          );
        })}

        {/* Area fill under the line */}
        {areaPath && <path className="an-chart-area" d={areaPath} />}

        {/* Trend line */}
        {linePath && <path className="an-chart-line" d={linePath} />}

        {/* Data points (dots) */}
        {pointsCoords.map((pt, idx) => (
          <circle
            key={idx}
            className="an-chart-dot"
            cx={pt.x}
            cy={pt.y}
            r={5}
            data-testid={`chart-dot-${idx}`}
          />
        ))}

        {/* Main axes lines */}
        <line
          className="an-chart-axis-line"
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + chartHeight}
        />
        <line
          className="an-chart-axis-line"
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
        />
      </svg>
    </div>
  );
};
