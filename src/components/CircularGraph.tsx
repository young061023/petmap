import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';

interface CircularGraphProps {
  size?: number;
  strokeWidth?: number;
  value: number; // e.g. 4
  targetValue?: number; // e.g. 5
  color?: string; // pastel pink or mint
  trackColor?: string;
  unit?: string;
}

export const CircularGraph: React.FC<CircularGraphProps> = ({
  size = 64,
  strokeWidth = 5.5,
  value,
  targetValue = 5,
  color = theme.colors.pastelPinkDark,
  trackColor = '#FFEBE9',
  unit = '회',
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage fill (cap at 100%)
  const percentage = Math.min(Math.max(value / targetValue, 0.15), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle - Thin Line */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.textOverlay}>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textOverlay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSub,
    marginLeft: 1.5,
  },
});
