import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

interface Props {
  label: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  testID: string;
}

// The Select primitive can't scroll on a phone, and these lists can be long (29 send times, any number of templates),
// so the options open in place in a list that scrolls by itself.
export function PickerField({ label, placeholder, value, options, onChange, testID }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View className="gap-1">
      <Text className="text-xs font-medium text-gray-500">{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        className="h-12 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 active:bg-gray-50">
        <Text testID={`${testID}-value`} className={cn('flex-1 text-base', selected ? 'text-gray-900' : 'text-gray-500')} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color="#6b7280" />
      </Pressable>
      {open ? (
        <View testID={`${testID}-options`} className="max-h-60 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {options.map((o) => (
              <Pressable
                key={o.value}
                testID={`${testID}-option-${o.value}`}
                accessibilityRole="button"
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="min-h-11 flex-row items-center gap-2 px-3 py-2 active:bg-gray-50">
                <Text className="flex-1 text-base text-gray-900">{o.label}</Text>
                {o.value === value ? <Check size={18} color="#7c3aed" /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
