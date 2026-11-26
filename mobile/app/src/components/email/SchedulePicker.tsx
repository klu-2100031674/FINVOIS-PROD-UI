import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { CalendarDays, X } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';
import {
  MAX_SEND_DATES,
  SCHEDULE_MODES,
  SEND_TIMES,
  addDays,
  dateLabel,
  datesForMode,
  firstSendDate,
  timeLabel,
  type ScheduleMode,
} from '~/utils/emailSchedule';
import { MonthCalendar } from './MonthCalendar';
import { Notice } from './Notice';
import { PickerField } from './PickerField';

const TIME_OPTIONS = SEND_TIMES.map((t) => ({ value: t, label: timeLabel(t) }));

interface Props {
  dates: string[];
  onDates: (update: (dates: string[]) => string[]) => void;
  time: string;
  onTime: (time: string) => void;
}

function DateField({ label, value, open, onPress, testID }: { label: string; value: string; open: boolean; onPress: () => void; testID: string }) {
  return (
    <View className="min-w-0 flex-1 gap-1">
      <Text className="text-xs font-medium text-gray-500">{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={onPress}
        className="h-12 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 active:bg-gray-50">
        <CalendarDays size={18} color="#7c3aed" />
        <Text testID={`${testID}-value`} className="flex-1 text-base text-gray-900" numberOfLines={1}>{dateLabel(value)}</Text>
      </Pressable>
    </View>
  );
}

/** Presets fill the date list. The admin can then skip any date, or choose dates one at a time. */
export function SchedulePicker({ dates, onDates, time, onTime }: Props) {
  const min = firstSendDate(time);
  const [mode, setMode] = useState<ScheduleMode>('single');
  const [from, setFrom] = useState(min);
  const [to, setTo] = useState(addDays(min, 6));
  const [calendar, setCalendar] = useState<'from' | 'to' | null>(null);
  // A later or earlier time can make today valid or not: the start and the chosen dates stay on or after the earliest date.
  const start = from < min ? min : from;

  useEffect(() => {
    if (mode === 'pick') onDates((list) => list.filter((d) => d >= min));
    else onDates(() => datesForMode(mode, start, to));
  }, [mode, start, to, min, onDates]);

  const switchMode = (m: ScheduleMode) => {
    setMode(m);
    setCalendar(null);
    if (m === 'pick') onDates(() => []);
  };

  const pickOne = (date: string) =>
    onDates((list) => {
      if (list.includes(date)) return list.filter((d) => d !== date);
      return list.length < MAX_SEND_DATES ? [...list, date].sort() : list;
    });

  return (
    <View className="gap-3">
      <Notice tone="info" testID="send-time-note">
        Emails can only be scheduled between 10:00 AM and 11:59 PM IST, in 30-minute slots. They go out at the chosen time on every selected date. Send now starts straight away, whatever the time. If the daily limit is reached, the rest continue at the next 10:00 AM IST.
      </Notice>
      <PickerField label="Send time (IST)" placeholder="Choose a time" value={time} options={TIME_OPTIONS} onChange={onTime} testID="send-time" />
      <View className="flex-row flex-wrap gap-2">
        {SCHEDULE_MODES.map(({ value, label }) => (
          <Pressable
            key={value}
            testID={`schedule-mode-${value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === value }}
            onPress={() => switchMode(value)}
            className={cn('min-h-9 justify-center rounded-full border px-3', mode === value ? 'border-purple-600 bg-purple-600' : 'border-gray-200 bg-white')}>
            <Text className={cn('text-sm', mode === value ? 'font-medium text-white' : 'text-gray-700')}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === 'pick' ? (
        <MonthCalendar min={min} selected={dates} onPick={pickOne} />
      ) : (
        <>
          <View className="flex-row gap-2">
            <DateField
              label={mode === 'single' ? 'Date' : 'From'}
              value={start}
              open={calendar === 'from'}
              onPress={() => setCalendar(calendar === 'from' ? null : 'from')}
              testID="schedule-from"
            />
            {mode === 'range' ? (
              <DateField label="To" value={to} open={calendar === 'to'} onPress={() => setCalendar(calendar === 'to' ? null : 'to')} testID="schedule-to" />
            ) : null}
          </View>
          {calendar ? (
            <MonthCalendar
              key={calendar}
              min={calendar === 'to' ? start : min}
              selected={[calendar === 'to' ? to : start]}
              onPick={(date) => {
                if (calendar === 'to') setTo(date);
                else {
                  setFrom(date);
                  if (to < date) setTo(date);
                }
                setCalendar(null);
              }}
            />
          ) : null}
        </>
      )}

      {dates.length > 0 ? (
        <View className="gap-2">
          <Text testID="schedule-summary" className="text-sm text-gray-500">
            {dates.length} send date{dates.length === 1 ? '' : 's'} at {timeLabel(time)} IST. Tap a date to skip it.
          </Text>
          <ScrollView nestedScrollEnabled className="max-h-40" contentContainerClassName="flex-row flex-wrap gap-2">
            {dates.map((d) => (
              <Pressable
                key={d}
                testID={`skip-date-${d}`}
                accessibilityRole="button"
                accessibilityLabel={`Skip ${dateLabel(d)}`}
                onPress={() => onDates((list) => list.filter((x) => x !== d))}
                className="min-h-8 flex-row items-center gap-1 rounded-full bg-purple-50 px-2.5">
                <Text className="text-xs text-purple-700">{dateLabel(d)}</Text>
                <X size={12} color="#6d28d9" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
