import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui/Text';

export type Series = {
  label: string;
  color: string;
  points: number[];
  /** Optional label to print at the last point. */
  endLabel?: string;
};

export type TrendChartProps = {
  /** X-axis tick labels (one per point). */
  xLabels: string[];
  series: Series[];
  /** Y domain [min, max]. */
  domain: [number, number];
  /** Y gridline values to draw + label. */
  yTicks: number[];
  height?: number;
};

/**
 * Minimal, dependency-light trend chart (react-native-svg).
 * Two-series line with direct end-labels + a legend below.
 * For richer interaction later, swap for victory-native / react-native-svg-charts.
 */
export function TrendChart({ xLabels, series, domain, yTicks, height = 150 }: TrendChartProps) {
  const t = useTheme();
  const W = 300;
  const H = height;
  const padL = 34;
  const padR = 12;
  const padT = 20;
  const padB = 25;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const [min, max] = domain;

  const xFor = (i: number) =>
    padL + (xLabels.length <= 1 ? 0 : (plotW * i) / (xLabels.length - 1));
  const yFor = (v: number) => padT + plotH * (1 - (v - min) / (max - min));

  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderColor: t.colors.line,
        borderWidth: 1,
        borderRadius: t.radius.xl,
        paddingHorizontal: 14,
        paddingTop: 16,
        paddingBottom: 10,
        ...t.shadows.e1,
      }}
    >
      <Svg width="100%" height={undefined as any} viewBox={`0 0 ${W} ${H}`}>
        {/* gridlines */}
        {yTicks.map((v) => (
          <Line
            key={`g${v}`}
            x1={padL}
            x2={W - padR}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke={t.colors.line}
            strokeWidth={1}
          />
        ))}
        {yTicks.map((v) => (
          <SvgText
            key={`yl${v}`}
            x={padL - 5}
            y={yFor(v) + 3}
            fontSize={9}
            fill={t.colors.ink3}
            textAnchor="end"
          >
            {String(v)}
          </SvgText>
        ))}

        {/* series */}
        {series.map((s) => (
          <React.Fragment key={s.label}>
            <Polyline
              points={s.points.map((p, i) => `${xFor(i)},${yFor(p)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {s.points.map((p, i) => (
              <Circle
                key={`${s.label}-${i}`}
                cx={xFor(i)}
                cy={yFor(p)}
                r={i === s.points.length - 1 ? 3.8 : 3.2}
                fill={s.color}
              />
            ))}
            {s.endLabel ? (
              <SvgText
                x={xFor(s.points.length - 1)}
                y={yFor(s.points[s.points.length - 1]) - 8}
                fontSize={10}
                fontWeight="700"
                fill={s.color}
                textAnchor="end"
              >
                {s.endLabel}
              </SvgText>
            ) : null}
          </React.Fragment>
        ))}

        {/* x labels */}
        {xLabels.map((lbl, i) => (
          <SvgText
            key={`x${i}`}
            x={xFor(i)}
            y={H - 8}
            fontSize={8.5}
            fill={t.colors.ink3}
            textAnchor="middle"
          >
            {lbl}
          </SvgText>
        ))}
      </Svg>

      {/* legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 }}>
        {series.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
            <Text variant="caption" weight="600" color="ink2">
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
