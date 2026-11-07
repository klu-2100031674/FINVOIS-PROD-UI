/**
 * Dropdown of the admin's saved quick phone numbers; picking a short name
 * replaces the WhatsApp recipient with that number.
 */
import React from 'react';

const comparablePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const QuickPhoneSelect = ({ numbers, currentPhone, onSelect, className = '' }) => {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;

  const current = comparablePhone(currentPhone);
  const matchIndex = current
    ? numbers.findIndex((n) => comparablePhone(n.phone) === current)
    : -1;

  return (
    <select
      value={matchIndex >= 0 ? String(matchIndex) : ''}
      onChange={(e) => {
        const picked = numbers[Number(e.target.value)];
        if (picked) onSelect(picked.phone);
      }}
      className={`px-2 py-1 text-xs bg-white border border-gray-200 rounded-md text-gray-700 outline-none focus:ring-1 focus:ring-emerald-500 max-w-[9rem] ${className}`}
      title="Pick a quick phone number"
    >
      <option value="">Quick numbers…</option>
      {numbers.map((n, idx) => (
        <option key={`${n.label}-${n.phone}`} value={String(idx)}>
          {n.label} ({n.phone})
        </option>
      ))}
    </select>
  );
};

export default QuickPhoneSelect;
