import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { FilterSelect, type FilterOption } from '~/components/FilterSelect';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';
import { EMPTY_FILTERS, activeFilterCount, type CaFilter, type PaymentFilter, type QueueFilters } from '~/utils/queueFilters';

const PAYMENT_OPTIONS: FilterOption[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
];

const CA_OPTIONS: FilterOption[] = [
  { value: 'none', label: 'No report yet' },
  { value: 'pending', label: 'CA pending' },
  { value: 'under_review', label: 'Under CA' },
  { value: 'approved', label: 'Validated' },
  { value: 'rejected', label: 'Queried or rejected' },
];

interface Props {
  filters: QueueFilters;
  onChange: (next: QueueFilters) => void;
  departments: FilterOption[];
  /** The web offers payment and CA filters only on the Open queue. */
  showReportFilters?: boolean;
  placeholder?: string;
  /** How many rows pass the filters and how many there are, shown while anything is applied. */
  shown?: number;
  total?: number;
}

export function RequestFilters({ filters, onChange, departments, showReportFilters, placeholder, shown, total }: Props) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<QueueFilters>) => onChange({ ...filters, ...patch });
  const active = activeFilterCount(filters);
  const applied = active > 0 || Boolean(filters.search.trim());

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1 justify-center">
          <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 14 }} />
          <Input
            testID="queue-search"
            accessibilityLabel="Search requests"
            value={filters.search}
            onChangeText={(search) => set({ search })}
            placeholder={placeholder ?? 'Search name, phone or email'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="h-12 rounded-xl pl-11 pr-10"
          />
          {filters.search ? (
            <Pressable
              testID="queue-search-clear"
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
              onPress={() => set({ search: '' })}
              style={{ position: 'absolute', right: 14 }}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          testID="queue-filters-toggle"
          accessibilityRole="button"
          accessibilityLabel={active ? `Filters, ${active} applied` : 'Filters'}
          aria-expanded={open}
          onPress={() => setOpen((v) => !v)}
          className={cn(
            'h-12 w-12 items-center justify-center rounded-xl border',
            open || active ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
          )}>
          <SlidersHorizontal size={18} color={open || active ? '#7c3aed' : '#4b5563'} />
          {active ? (
            <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-purple-600 px-1">
              <Text testID="queue-filters-count" className="text-xs font-medium text-white">{active}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {open ? (
        <View testID="queue-filters-panel" className="gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <FilterSelect
            testID="filter-department"
            label="Department"
            allLabel="All departments"
            value={filters.department}
            options={departments}
            onChange={(department) => set({ department })}
          />
          {showReportFilters ? (
            <View className="flex-row gap-2">
              <FilterSelect
                testID="filter-payment"
                label="Payment"
                allLabel="All"
                value={filters.payment}
                options={PAYMENT_OPTIONS}
                onChange={(payment) => set({ payment: payment as PaymentFilter })}
              />
              <FilterSelect
                testID="filter-ca"
                label="CA status"
                allLabel="All"
                value={filters.ca}
                options={CA_OPTIONS}
                onChange={(ca) => set({ ca: ca as CaFilter })}
              />
            </View>
          ) : null}
          {active ? (
            <Pressable
              testID="queue-filters-reset"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
              className="self-start py-1">
              <Text className="text-sm font-medium text-purple-700">Reset filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {applied && shown !== undefined && total !== undefined ? (
        <Text testID="queue-result-count" className="text-xs text-gray-500">Showing {shown} of {total}</Text>
      ) : null}
    </View>
  );
}
