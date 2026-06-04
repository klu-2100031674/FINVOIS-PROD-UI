import { useEffect, useMemo, useState } from 'react';
import { useFranchiseCategories } from '@/hooks/useFranchiseCategories';

const OTHER_VALUE = 'Other';

export function FranchiseCategorySelect({
  value = '',
  onChange,
  required = false,
  allowOther = true,
  className = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]',
  inputClassName = className,
  emptyLabel = 'Select category',
}) {
  const { categories, loading } = useFranchiseCategories();

  const isKnown = useMemo(
    () => value && categories.includes(value),
    [value, categories],
  );

  const [selectValue, setSelectValue] = useState(() => {
    if (!value) return '';
    if (isKnown || value === OTHER_VALUE) return value;
    return allowOther ? OTHER_VALUE : value;
  });
  const [customCategory, setCustomCategory] = useState(() =>
    value && !categories.includes(value) && value !== OTHER_VALUE ? value : '',
  );

  useEffect(() => {
    if (!value) {
      setSelectValue('');
      setCustomCategory('');
      return;
    }
    if (categories.includes(value)) {
      setSelectValue(value);
      setCustomCategory('');
    } else if (allowOther) {
      setSelectValue(OTHER_VALUE);
      setCustomCategory(value);
    } else {
      setSelectValue(value);
    }
  }, [value, categories, allowOther]);

  const handleSelectChange = (e) => {
    const next = e.target.value;
    setSelectValue(next);
    if (next === OTHER_VALUE) {
      onChange?.(customCategory.trim());
    } else {
      setCustomCategory('');
      onChange?.(next);
    }
  };

  const handleCustomChange = (e) => {
    const next = e.target.value;
    setCustomCategory(next);
    onChange?.(next.trim());
  };

  return (
    <div className="space-y-2">
      <select
        className={className}
        value={selectValue}
        onChange={handleSelectChange}
        required={required && selectValue !== OTHER_VALUE}
        disabled={loading}
      >
        <option value="">{emptyLabel}</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        {allowOther && <option value={OTHER_VALUE}>Other (custom)</option>}
        {!allowOther &&
          value &&
          !categories.includes(value) &&
          value !== OTHER_VALUE && (
            <option value={value}>{value}</option>
          )}
      </select>
      {allowOther && selectValue === OTHER_VALUE && (
        <input
          type="text"
          className={inputClassName}
          placeholder="Enter new category name"
          value={customCategory}
          onChange={handleCustomChange}
          required={required}
        />
      )}
    </div>
  );
}

export function FranchiseCategoryFilterSelect({
  value = '',
  onChange,
  className = 'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]',
  emptyLabel = 'All categories',
}) {
  const { categories, loading } = useFranchiseCategories();

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={loading}
    >
      <option value="">{emptyLabel}</option>
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
