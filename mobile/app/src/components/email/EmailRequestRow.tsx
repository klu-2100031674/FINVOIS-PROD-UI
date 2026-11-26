import { Pressable, View } from 'react-native';
import { ChevronRight, Paperclip } from 'lucide-react-native';
import { StatusPill } from '~/components/StatusPill';
import { Text } from '~/components/ui/text';
import type { EmailRequest } from '~/api/emailAutomation';
import { emailPill, runInfo } from '~/utils/emailAutomation';
import { formatDate, formatTime } from '~/utils/format';

export const requestWhen = (r: EmailRequest) => {
  const at = r.status === 'completed' ? r.completed_at : r.scheduled_at;
  return at ? `${formatDate(at)}, ${formatTime(at)}` : '';
};

export function EmailRequestRow({ request: r, onPress }: { request: EmailRequest; onPress: () => void }) {
  const pill = emailPill(r.status);
  const source = r.folders?.length ? `Folders: ${r.folders.map((f) => f.name).filter(Boolean).join(', ')}` : r.file_name;
  const pending = r.stats.pending + r.stats.scheduled + r.stats.processing;
  const when = [requestWhen(r), runInfo(r)].filter(Boolean).join(' · ');
  return (
    <Pressable
      testID={`email-request-${r._id}`}
      accessibilityRole="button"
      onPress={onPress}
      className="gap-2 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>{r.name}</Text>
        <ChevronRight size={18} color="#9ca3af" />
      </View>
      {source ? <Text className="text-sm text-gray-600" numberOfLines={1}>{source}</Text> : null}
      {r.template?.name ? <Text className="text-sm text-gray-600" numberOfLines={1}>Template: {r.template.name}</Text> : null}
      <Text testID={`email-request-counts-${r._id}`} className="text-sm text-gray-900">
        {r.stats.total} total · {r.stats.sent} sent · {pending} pending · {r.stats.failed} failed
      </Text>
      {when ? <Text className="text-xs text-gray-500">{when}</Text> : null}
      <View className="flex-row flex-wrap items-center gap-2">
        <StatusPill testID={`email-request-status-${r._id}`} label={pill.label} tone={pill.tone} />
        {r.attachments?.length ? (
          <View className="flex-row items-center gap-1">
            <Paperclip size={14} color="#7c3aed" />
            <Text className="text-xs text-purple-700">{r.attachments.length} attachment{r.attachments.length === 1 ? '' : 's'}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
