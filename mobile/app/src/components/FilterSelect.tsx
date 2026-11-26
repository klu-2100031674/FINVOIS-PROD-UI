import { View } from 'react-native';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Text } from '~/components/ui/text';

const ALL = '__all__'; // the Select primitive rejects an empty item value

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  testID: string;
}

/** One labelled dropdown in a filter panel. An empty value means no filter. */
export function FilterSelect({ label, allLabel, value, options, onChange, testID }: Props) {
  const selected = value
    ? { value, label: options.find((o) => o.value === value)?.label ?? value }
    : { value: ALL, label: allLabel };
  return (
    <View className="min-w-0 flex-1 gap-1">
      <Text className="text-xs font-medium text-gray-500">{label}</Text>
      <Select value={selected} onValueChange={(o) => onChange(!o || o.value === ALL ? '' : o.value)}>
        <SelectTrigger testID={testID} aria-label={label} className="h-11 w-full rounded-xl bg-white">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL} label={allLabel} />
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value} label={o.label} />
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </View>
  );
}
