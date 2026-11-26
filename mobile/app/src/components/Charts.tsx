import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Text } from '~/components/ui/text';

// Hand-drawn with react-native-svg (already a dependency): three small charts don't justify a chart library.
// Colors are the validated categorical slots (dataviz reference palette, light mode, fixed order).
// Slots 3 and 4 sit under 3:1 on white, so every chart shows its numbers as text too (legend counts,
// the tapped value), never color alone.
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'] as const;
const SURFACE = '#ffffff';
const GRID = '#e5e7eb';

const useWidth = () => {
  const [w, setW] = useState(0);
  return [w, (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))] as const;
};

/** "2026-11-24" -> "24 Nov" without timezone drift (the day key is already India time). */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Round top for a y-axis with a whole-number midline: 0 -> 2, 7 -> 8, 23 -> 40, 140 -> 200. */
export function niceMax(n: number): number {
  if (n <= 2) return 2;
  const p = 10 ** Math.floor(Math.log10(n));
  const step = (p >= 10 ? [1, 2, 4, 6, 8, 10] : [2, 4, 6, 8, 10]).find((s) => s * p >= n) ?? 10;
  return step * p;
}

/** Donut segments: [start, end] angles in radians from 12 o'clock, zero values skipped. */
export function donutAngles(values: number[]): ({ start: number; end: number } | null)[] {
  const total = values.reduce((a, b) => a + b, 0);
  let at = 0;
  return values.map((v) => {
    if (!total || v <= 0) return null;
    const start = at;
    at += (v / total) * Math.PI * 2;
    return { start, end: at };
  });
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  // A full circle cannot be one arc command; stop a hair short.
  const e = end - start >= Math.PI * 2 ? start + Math.PI * 2 - 0.0001 : end;
  const pt = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x1, y1] = pt(start);
  const [x2, y2] = pt(e);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${e - start > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
}

function Card({ title, subtitle, children, testID }: { title: string; subtitle?: string; children: React.ReactNode; testID?: string }) {
  return (
    <View testID={testID} className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="gap-0.5">
        <Text className="font-manrope text-base text-gray-900">{title}</Text>
        {subtitle ? <Text className="text-xs text-gray-500">{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** Share of a whole (pie / donut) with a legend that carries label, count and percent. */
export function DonutChart({ title, subtitle, items, testID }: { title: string; subtitle?: string; items: { label: string; value: number }[]; testID?: string }) {
  const size = 140;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const total = items.reduce((a, b) => a + b.value, 0);
  const angles = donutAngles(items.map((i) => i.value));
  const gap = items.filter((i) => i.value > 0).length > 1 ? 0.035 : 0; // 2px-ish surface gap between segments

  return (
    <Card title={title} subtitle={subtitle} testID={testID}>
      <View className="flex-row items-center gap-4">
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={GRID} strokeWidth={stroke} fill="none" />
            {angles.map((a, i) =>
              a ? (
                <Path key={i} d={arcPath(size / 2, size / 2, r, a.start + gap / 2, a.end - gap / 2)} stroke={SERIES[i % SERIES.length]} strokeWidth={stroke} fill="none" />
              ) : null
            )}
          </Svg>
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <Text className="font-manrope text-2xl text-gray-900">{total}</Text>
            <Text className="text-xs text-gray-500">total</Text>
          </View>
        </View>
        <View className="flex-1 gap-2">
          {items.map((it, i) => (
            <View key={it.label} className="flex-row items-center gap-2" testID={testID ? `${testID}-legend-${i}` : undefined}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: SERIES[i % SERIES.length] }} />
              <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>{it.label}</Text>
              <Text className="text-sm font-semibold text-gray-900">{it.value}</Text>
              <Text className="w-10 text-right text-xs text-gray-500">{total ? `${Math.round((it.value / total) * 100)}%` : '–'}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

/** Tapped-value readout shared by the bar and line charts (the mobile stand-in for a hover tooltip). */
function Readout({ days, values, at, unit }: { days: string[]; values: number[]; at: number; unit: string }) {
  return (
    <Text className="text-sm text-gray-700">
      <Text className="text-sm font-semibold text-gray-900">{values[at]}</Text> {unit} on {dayLabel(days[at])}
    </Text>
  );
}

const H = 150;
const PAD = { top: 8, bottom: 22, left: 28, right: 8 };

function Axes({ width, max }: { width: number; max: number }) {
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / max);
  return (
    <>
      {[0, max / 2, max].map((v) => (
        <Line key={v} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
      ))}
    </>
  );
}

function YLabels({ max }: { max: number }) {
  return (
    <View pointerEvents="none" className="absolute left-0" style={{ top: PAD.top - 7, height: H - PAD.top - PAD.bottom + 14, width: PAD.left - 4 }}>
      <View className="flex-1 justify-between">
        {[max, max / 2, 0].map((v) => (
          <Text key={v} className="text-right text-[10px] text-gray-400">{Number.isInteger(v) ? v : v.toFixed(1)}</Text>
        ))}
      </View>
    </View>
  );
}

function XLabels({ days, width }: { days: string[]; width: number }) {
  const plot = width - PAD.left - PAD.right;
  const show = days.length <= 7 ? days.map((_d, i) => i) : [0, Math.floor((days.length - 1) / 2), days.length - 1];
  return (
    <View pointerEvents="none" style={{ height: 14, marginTop: -PAD.bottom + 6 }}>
      {show.map((i) => (
        <Text
          key={i}
          className="absolute text-center text-[10px] text-gray-400"
          style={{ width: 48, left: PAD.left + (plot * (i + 0.5)) / days.length - 24 }}>
          {dayLabel(days[i])}
        </Text>
      ))}
    </View>
  );
}

/** Magnitude per day (bar). Tap a column to read its value. */
export function BarChart({ title, subtitle, days, values, unit, testID }: { title: string; subtitle?: string; days: string[]; values: number[]; unit: string; testID?: string }) {
  const [width, onLayout] = useWidth();
  const [at, setAt] = useState(values.length - 1);
  const max = niceMax(Math.max(0, ...values));
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = days.length ? plotW / days.length : 0;
  const barW = Math.max(4, Math.min(28, slot - 6));

  return (
    <Card title={title} subtitle={subtitle} testID={testID}>
      <Readout days={days} values={values} at={Math.min(at, values.length - 1)} unit={unit} />
      <View testID={testID ? `${testID}-plot` : undefined} onLayout={onLayout} style={{ height: H }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={H}>
              <Axes width={width} max={max} />
              {values.map((v, i) => {
                const h = (v / max) * plotH;
                const x = PAD.left + slot * i + (slot - barW) / 2;
                const y = PAD.top + plotH - h;
                return v > 0 ? (
                  <Path
                    key={i}
                    // 4px rounded data-end, square at the baseline
                    d={`M ${x} ${y + h} V ${y + Math.min(4, h)} Q ${x} ${y} ${x + Math.min(4, barW / 2)} ${y} H ${x + barW - Math.min(4, barW / 2)} Q ${x + barW} ${y} ${x + barW} ${y + Math.min(4, h)} V ${y + h} Z`}
                    fill={SERIES[0]}
                    opacity={i === at ? 1 : 0.55}
                  />
                ) : null;
              })}
            </Svg>
            <YLabels max={max} />
            <View className="absolute flex-row" style={{ left: PAD.left, top: 0, width: plotW, height: H - PAD.bottom }}>
              {values.map((v, i) => (
                <Pressable
                  key={i}
                  testID={testID ? `${testID}-bar-${i}` : undefined}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(days[i])}: ${v} ${unit}`}
                  onPress={() => setAt(i)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
            <XLabels days={days} width={width} />
          </>
        ) : null}
      </View>
    </Card>
  );
}

/** Change over time (line). Tap anywhere on the plot to read the nearest day. */
export function LineChart({ title, subtitle, days, values, unit, testID }: { title: string; subtitle?: string; days: string[]; values: number[]; unit: string; testID?: string }) {
  const [width, onLayout] = useWidth();
  const [at, setAt] = useState(values.length - 1);
  const max = niceMax(Math.max(0, ...values));
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = days.length ? plotW / days.length : 0;
  const pt = (v: number, i: number) => [PAD.left + slot * (i + 0.5), PAD.top + plotH * (1 - v / max)] as const;
  const d = values.map((v, i) => `${i ? 'L' : 'M'} ${pt(v, i).join(' ')}`).join(' ');
  const sel = Math.min(at, values.length - 1);
  const [sx, sy] = values.length ? pt(values[sel], sel) : [0, 0];

  return (
    <Card title={title} subtitle={subtitle} testID={testID}>
      <Readout days={days} values={values} at={sel} unit={unit} />
      <View testID={testID ? `${testID}-plot` : undefined} onLayout={onLayout} style={{ height: H }}>
        {width > 0 && values.length ? (
          <>
            <Svg width={width} height={H}>
              <Axes width={width} max={max} />
              <Line x1={sx} x2={sx} y1={PAD.top} y2={PAD.top + plotH} stroke={GRID} strokeWidth={1} />
              <Path d={d} stroke={SERIES[0]} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Circle cx={sx} cy={sy} r={5} fill={SERIES[0]} stroke={SURFACE} strokeWidth={2} />
            </Svg>
            <YLabels max={max} />
            <View className="absolute flex-row" style={{ left: PAD.left, top: 0, width: plotW, height: H - PAD.bottom }}>
              {values.map((v, i) => (
                <Pressable
                  key={i}
                  testID={testID ? `${testID}-point-${i}` : undefined}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(days[i])}: ${v} ${unit}`}
                  onPress={() => setAt(i)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
            <XLabels days={days} width={width} />
          </>
        ) : null}
      </View>
    </Card>
  );
}

