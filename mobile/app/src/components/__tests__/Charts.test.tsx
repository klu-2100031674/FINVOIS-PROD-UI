import { fireEvent, render, screen } from '@testing-library/react-native';
import { BarChart, DonutChart, dayLabel, donutAngles, niceMax } from '../Charts';

describe('chart math', () => {
  it('rounds the axis top up to a friendly number', () => {
    expect([0, 1, 7, 23, 140, 1000].map(niceMax)).toEqual([2, 2, 8, 40, 200, 1000]);
  });

  it('splits the donut by share and skips zero slices', () => {
    const a = donutAngles([1, 0, 3]);
    expect(a[1]).toBeNull();
    expect(a[0]!.end).toBeCloseTo(Math.PI / 2);
    expect(a[2]!.end).toBeCloseTo(Math.PI * 2);
    expect(donutAngles([0, 0])).toEqual([null, null]);
  });

  it('labels a day key without shifting the date', () => {
    expect(dayLabel('2026-11-24')).toBe('24 Nov');
  });
});

describe('charts', () => {
  it('donut legend shows count and percent for every slice', async () => {
    await render(<DonutChart testID="d" title="Status" items={[{ label: 'Pending', value: 1 }, { label: 'Approved', value: 3 }]} />);
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('bar chart reads out the tapped day', async () => {
    await render(<BarChart testID="b" title="Requests" days={['2026-11-23', '2026-11-24']} values={[2, 5]} unit="requests" />);
    expect(screen.getByText(/on 24 Nov/)).toBeTruthy();
    await fireEvent(screen.getByTestId('b-plot'), 'layout', { nativeEvent: { layout: { width: 300 } } });
    await fireEvent.press(screen.getByTestId('b-bar-0'));
    expect(screen.getByText(/on 23 Nov/)).toBeTruthy();
  });
});
