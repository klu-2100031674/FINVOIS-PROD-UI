import type { ReactNode } from 'react';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

const TONES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

export function Notice({ tone, children, testID }: { tone: keyof typeof TONES; children: ReactNode; testID?: string }) {
  return (
    <Text
      testID={testID}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      className={cn('rounded-xl border px-4 py-3 text-sm', TONES[tone])}>
      {children}
    </Text>
  );
}
