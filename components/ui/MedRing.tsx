import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './Text';

export type MedRingProps = {
  taken: number;
  total: number;
  size?: number;
  /** Track + progress colors. Defaults suit the blue hero card (white on blue). */
  trackColor?: string;
  progressColor?: string;
  labelColor?: string;
  subLabel?: string;
};

export function MedRing({
  taken,
  total,
  size = 96,
  trackColor = 'rgba(255,255,255,0.22)',
  progressColor = '#FFFFFF',
  labelColor = '#FFFFFF',
  subLabel = 'มื้อวันนี้',
}: MedRingProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(taken / total, 1) : 0;
  const dashoffset = circumference * (1 - pct);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={progressColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </Svg>
      <Text variant="h1" weight="700" style={{ color: labelColor, fontSize: 26, lineHeight: 28 }}>
        {taken}/{total}
      </Text>
      <Text variant="micro" style={{ color: labelColor, opacity: 0.85 }}>
        {subLabel}
      </Text>
    </View>
  );
}
