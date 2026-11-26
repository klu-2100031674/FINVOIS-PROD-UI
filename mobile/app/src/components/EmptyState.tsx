import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Inbox, type LucideIcon } from 'lucide-react-native';
import { Text } from '~/components/ui/text';

interface Props {
  title: string;
  body?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, body, icon: Icon = Inbox, action }: Props) {
  return (
    <View testID="empty-state" className="items-center gap-2 px-6 py-16">
      <Icon size={36} color="#9ca3af" />
      <Text className="font-manrope text-lg text-gray-900">{title}</Text>
      {body ? <Text className="text-center text-gray-500">{body}</Text> : null}
      {action}
    </View>
  );
}
