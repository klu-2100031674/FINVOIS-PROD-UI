import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';
import { addMonths, monthCells, monthLabel } from '~/utils/emailSchedule';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  /** The earliest date that can be chosen, "YYYY-MM-DD". */
  min: string;
  selected: string[];
  onPick: (date: string) => void;
}

// Dates stay plain India-time strings all the way through, so a phone set to another time zone can't shift a send by a day.
export function MonthCalendar({ min, selected, onPick }: Props) {
  const [month, setMonth] = useState((selected[0] ?? min).slice(0, 7));
  const atStart = month <= min.slice(0, 7);
  return (
    <View testID="calendar" className="gap-2 rounded-xl border border-gray-200 bg-white p-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          testID="calendar-prev"
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={atStart}
          onPress={() => setMonth(addMonths(month, -1))}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-gray-100">
          <ChevronLeft size={20} color={atStart ? '#d1d5db' : '#111827'} />
        </Pressable>
        <Text testID="calendar-month" className="font-semibold text-gray-900">{monthLabel(month)}</Text>
        <Pressable
          testID="calendar-next"
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setMonth(addMonths(month, 1))}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-gray-100">
          <ChevronRight size={20} color="#111827" />
        </Pressable>
      </View>
      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text key={i} className="flex-1 text-center text-xs text-gray-500">{d}</Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {monthCells(month).map((date, i) => {
          if (!date) return <View key={`pad-${i}`} style={{ width: '14.28%' }} />;
          const on = selected.includes(date);
          const off = date < min;
          return (
            <Pressable
              key={date}
              testID={`calendar-day-${date}`}
              accessibilityRole="button"
              accessibilityLabel={date}
              accessibilityState={{ selected: on, disabled: off }}
              disabled={off}
              onPress={() => onPick(date)}
              style={{ width: '14.28%' }}
              className="h-11 items-center justify-center">
              <View className={cn('h-9 w-9 items-center justify-center rounded-full', on && 'bg-purple-600')}>
                <Text className={cn('text-sm', on ? 'font-semibold text-white' : off ? 'text-gray-300' : 'text-gray-900')}>
                  {Number(date.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
