import React from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, normalizeLocale, DEFAULT_LOCALE } from "@tsotsa/i18n";
import "../i18n/setup";
import type { ZScorePoint } from "../types";

export interface ZScoreChartProps {
  points: ZScorePoint[];
  title?: string;
  width?: number;
  height?: number;
  currentZScore?: number;
  testID?: string;
  className?: string;
}

export function ZScoreChart({
  points,
  title,
  width = 650,
  height = 240,
  testID = "zscore-chart",
  className = "",
}: ZScoreChartProps): React.JSX.Element {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;

  // Y-axis range: from -4 to +2 (total span of 6 units)
  const minY = -4;
  const maxY = 2;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getY = (val: number): number => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return paddingTop + chartH * (1 - ratio);
  };

  const getX = (idx: number, count: number): number => {
    if (count <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (count - 1)) * chartW;
  };

  // Threshold Y positions
  const yMinus2 = getY(-2);
  const yMinus3 = getY(-3);
  const yBottom = getY(-4);
  const yTop = getY(2);

  // SVG path generation
  const pathD = points
    .map((p, idx) => {
      const x = getX(idx, points.length);
      const y = getY(p.zScore);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div data-testid={testID} className={`relative overflow-hidden bg-white ${className}`}>
      {title && (
        <h3 className="text-16 font-bold text-text-primary mb-3">
          {title}
        </h3>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background Bands */}
        {/* Normal Band: >= -2 (Greenish #E6F4EC) */}
        <rect
          data-testid="band-normal"
          x={paddingLeft}
          y={yTop}
          width={chartW}
          height={yMinus2 - yTop}
          fill="#E6F4EC"
        />

        {/* Moderate Warning Band: -3 to -2 (Yellowish #FFF4D6) */}
        <rect
          data-testid="band-warning"
          x={paddingLeft}
          y={yMinus2}
          width={chartW}
          height={yMinus3 - yMinus2}
          fill="#FFF4D6"
        />

        {/* Severe Danger Band: < -3 (Reddish #FDECEC) */}
        <rect
          data-testid="band-danger"
          x={paddingLeft}
          y={yMinus3}
          width={chartW}
          height={yBottom - yMinus3}
          fill="#FDECEC"
        />

        {/* Grid lines */}
        {[-3, -2, -1, 0, 1].map((lvl) => {
          const y = getY(lvl);
          const isZero = lvl === 0;
          return (
            <line
              key={`grid-${lvl}`}
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + chartW}
              y2={y}
              stroke={isZero ? "#8A9893" : "#D9DFDC"}
              strokeWidth={isZero ? 1.5 : 1}
              strokeDasharray={isZero ? "4 4" : undefined}
            />
          );
        })}

        {/* Zero line */}
        <line
          data-testid="line-z0"
          x1={paddingLeft}
          y1={getY(0)}
          x2={paddingLeft + chartW}
          y2={getY(0)}
          stroke="#8A9893"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* Y Axis labels */}
        {[1, 0, -1, -2, -3, -4].map((lvl) => {
          const y = getY(lvl);
          return (
            <text
              key={`ylabel-${lvl}`}
              x={paddingLeft - 8}
              y={y + 4}
              textAnchor="end"
              className="text-[13px] fill-text-muted font-sans"
            >
              {lvl > 0 ? `+${lvl}` : lvl === 0 ? "0" : `−${Math.abs(lvl)}`}
            </text>
          );
        })}

        {/* Chart Line */}
        {points.length > 1 && (
          <path
            data-testid="zscore-curve"
            d={pathD}
            fill="none"
            stroke="#534AB7"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points & Values */}
        {points.map((p, idx) => {
          const cx = getX(idx, points.length);
          const cy = getY(p.zScore);
          const pointColor = p.color || "#534AB7";
          const formattedAbs = formatNumber(p.zScore, locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const formattedVal = p.zScore > 0 ? `+${formattedAbs}` : formattedAbs;

          return (
            <g key={`pt-${p.date}-${idx}`} data-testid={`zscore-point-${idx}`}>
              {/* Point circle: 16px with white border */}
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill={pointColor}
                stroke="#FFFFFF"
                strokeWidth={2}
                className="transition-transform duration-100"
              />

              {/* Value above point: 13px bold */}
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                className="text-[13px] font-bold fill-text font-sans"
              >
                {formattedVal}
              </text>

              {/* Date / Label below */}
              <text
                x={cx}
                y={paddingTop + chartH + 20}
                textAnchor="middle"
                className="text-[13px] fill-text-muted font-sans"
              >
                {p.label ?? p.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ZScoreChart;
