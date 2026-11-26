import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useIsFocused, type CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, FileText, Folder, Mail, Paperclip, Plus, Send, Trash2 } from 'lucide-react-native';
import { ConfirmDialog } from '~/components/email/ConfirmDialog';
import { EmailRequestRow } from '~/components/email/EmailRequestRow';
import { Notice } from '~/components/email/Notice';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import {
  createEmailFolder,
  deleteEmailTemplate,
  emailKeys,
  getEmailQuota,
  listEmailFolders,
  listEmailRequests,
  listEmailTemplates,
  saveEmailLimit,
  type EmailFolder,
  type EmailQuota,
  type EmailRequest,
  type EmailTemplate,
} from '~/api/emailAutomation';
import { cn } from '~/lib/utils';
import type { AdminTabParamList, EmailTab, RootStackParamList } from '~/navigation/types';
import { bodyToText, emailTotals, isActiveRequest, isSentRequest } from '~/utils/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';
import { formatCount } from '~/utils/format';

const POLL_MS = 15000;

const TABS: { value: EmailTab; label: string }[] = [
  { value: 'sent', label: 'Sent' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'data', label: 'Data' },
  { value: 'templates', label: 'Templates' },
];

type Props = CompositeScreenProps<BottomTabScreenProps<AdminTabParamList, 'Email'>, NativeStackScreenProps<RootStackParamList>>;

function Stat({ label, value, testID }: { label: string; value?: number; testID: string }) {
  return (
    <View className="min-w-0 flex-1 gap-0.5 rounded-xl border border-gray-200 bg-white p-3">
      <Text className="text-xs text-gray-500" numberOfLines={2}>{label}</Text>
      <Text testID={testID} className="font-manrope text-xl text-gray-900">{value === undefined ? '-' : formatCount(value)}</Text>
    </View>
  );
}

function LimitEditor({ limit, onSaved }: { limit: number; onSaved: (q: EmailQuota) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(limit));
  const save = useMutation({
    networkMode: 'always',
    mutationFn: () => saveEmailLimit(Number(value)),
    onSuccess: (q) => {
      onSaved(q);
      setEditing(false);
    },
  });
  if (!editing) {
    return (
      <Pressable
        testID="change-limit"
        accessibilityRole="button"
        onPress={() => {
          setValue(String(limit));
          save.reset();
          setEditing(true);
        }}
        className="min-h-11 justify-center self-start">
        <Text className="text-sm font-medium text-purple-700">Change daily limit</Text>
      </Pressable>
    );
  }
  const valid = /^\d+$/.test(value.trim()) && Number(value) > 0;
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Input testID="limit-input" value={value} onChangeText={setValue} keyboardType="number-pad" className="h-11 flex-1 rounded-xl" />
        <Button testID="limit-save" disabled={!valid || save.isPending} onPress={() => save.mutate()} className="h-11 rounded-xl">
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text>Save</Text>}
        </Button>
        <Button testID="limit-cancel" variant="outline" disabled={save.isPending} onPress={() => setEditing(false)} className="h-11 rounded-xl">
          <Text className="text-gray-900">Cancel</Text>
        </Button>
      </View>
      {save.isError ? <Notice tone="error" testID="limit-error">{apiErrorMessage(save.error, "Couldn't change the limit. Try again.")}</Notice> : null}
    </View>
  );
}

function QuotaCard({ quota, onSaved }: { quota: EmailQuota; onSaved: (q: EmailQuota) => void }) {
  const used = quota.limit ? quota.sentLast24h / quota.limit : 0;
  return (
    <View testID="email-quota" className="gap-2 rounded-2xl border border-gray-200 bg-white p-4">
      <Text className="font-semibold text-gray-900">Sender daily limit (last 24 hours)</Text>
      <Text testID="email-quota-text" className="text-sm text-gray-700">
        {formatCount(quota.sentLast24h)} / {formatCount(quota.limit)} sent · {formatCount(quota.remaining)} remaining
      </Text>
      <View className="h-2 overflow-hidden rounded-full bg-gray-100">
        <View className={cn('h-full rounded-full', used >= 0.9 ? 'bg-red-500' : 'bg-purple-600')} style={{ width: `${Math.min(100, used * 100)}%` }} />
      </View>
      <Text className="text-xs text-gray-500">
        Counts only emails sent by Email automation. If a request goes over the remaining limit, the rest continue at the next 10:00 AM IST.
      </Text>
      <LimitEditor limit={quota.limit} onSaved={onSaved} />
    </View>
  );
}

function FolderRow({ folder, onPress }: { folder: EmailFolder; onPress: () => void }) {
  return (
    <Pressable
      testID={`email-folder-${folder._id}`}
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
      <Folder size={20} color="#7c3aed" />
      <Text className="flex-1 text-base font-medium text-gray-900" numberOfLines={1}>{folder.name}</Text>
      <Text testID={`email-folder-count-${folder._id}`} className="text-sm text-gray-500">{formatCount(folder.count)}</Text>
      <ChevronRight size={18} color="#9ca3af" />
    </Pressable>
  );
}

function TemplateRow({ template: t, onPress, onDelete }: { template: EmailTemplate; onPress: () => void; onDelete: () => void }) {
  return (
    <View className="flex-row items-start gap-1 rounded-2xl border border-gray-200 bg-white">
      <Pressable testID={`email-template-${t._id}`} accessibilityRole="button" onPress={onPress} className="min-w-0 flex-1 gap-1 p-4 active:bg-gray-50">
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>{t.name}</Text>
        <Text className="text-sm text-gray-600" numberOfLines={1}>{t.subject}</Text>
        <Text className="text-xs text-gray-500" numberOfLines={2}>{bodyToText(t.body).replace(/\s+/g, ' ')}</Text>
        {t.attachments?.length ? (
          <View className="flex-row items-center gap-1">
            <Paperclip size={14} color="#7c3aed" />
            <Text className="flex-1 text-xs text-purple-700" numberOfLines={1}>{t.attachments.map((a) => a.filename).join(', ')}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        testID={`email-template-delete-${t._id}`}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${t.name}`}
        onPress={onDelete}
        className="m-1 h-11 w-11 items-center justify-center rounded-full active:bg-red-50">
        <Trash2 size={18} color="#b91c1c" />
      </Pressable>
    </View>
  );
}

export default function EmailAutomationScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<EmailTab>(route.params?.tab ?? 'sent');
  const [folderName, setFolderName] = useState('');
  const [toDelete, setToDelete] = useState<EmailTemplate | null>(null);
  const focused = useIsFocused();
  const qc = useQueryClient();

  // Coming back from scheduling asks for a tab and a message while this screen is already mounted.
  const requested = route.params?.tab;
  const [lastRequested, setLastRequested] = useState(requested);
  if (requested !== lastRequested) {
    setLastRequested(requested);
    if (requested) setTab(requested);
  }
  const notice = route.params?.notice;

  const requests = useQuery({
    queryKey: emailKeys.requests,
    queryFn: listEmailRequests,
    // Keep the numbers moving while something is queued or sending.
    refetchInterval: (q) => (focused && q.state.data?.some(isActiveRequest) ? POLL_MS : false),
  });
  const active = requests.data?.some(isActiveRequest) ?? false;
  const quota = useQuery({ queryKey: emailKeys.quota, queryFn: getEmailQuota, refetchInterval: focused && active ? POLL_MS : false });
  const templates = useQuery({ queryKey: emailKeys.templates, queryFn: listEmailTemplates });
  const folders = useQuery({ queryKey: emailKeys.folders, queryFn: listEmailFolders });

  const totals = useMemo(() => (requests.data ? emailTotals(requests.data) : null), [requests.data]);
  const sent = useMemo(() => (requests.data ?? []).filter(isSentRequest), [requests.data]);
  const upcoming = useMemo(() => (requests.data ?? []).filter((r) => !isSentRequest(r)), [requests.data]);

  const createFolder = useMutation({
    networkMode: 'always',
    mutationFn: () => createEmailFolder(folderName.trim()),
    onSuccess: async (folder) => {
      setFolderName('');
      await qc.invalidateQueries({ queryKey: emailKeys.folders });
      navigation.navigate('EmailFolder', { folderId: folder._id });
    },
  });
  const removeTemplate = useMutation({
    networkMode: 'always',
    mutationFn: async (t: EmailTemplate) => {
      await deleteEmailTemplate(t._id);
      await qc.invalidateQueries({ queryKey: emailKeys.templates });
    },
  });

  const current = tab === 'data' ? folders : tab === 'templates' ? templates : requests;
  const rows: (EmailRequest | EmailFolder | EmailTemplate)[] =
    tab === 'sent' ? sent : tab === 'schedule' ? upcoming : tab === 'data' ? folders.data ?? [] : templates.data ?? [];

  const refresh = () => {
    void requests.refetch();
    void quota.refetch();
    void templates.refetch();
    void folders.refetch();
  };

  const switchTab = (t: EmailTab) => {
    setTab(t);
    if (notice) navigation.setParams({ notice: undefined });
  };

  const header = (
    <View className="gap-3 pb-3">
      {notice ? <Notice tone="success" testID="email-notice">{notice}</Notice> : null}
      <View className="gap-2">
        <View className="flex-row gap-2">
          <Stat label="Total emails" value={totals?.total} testID="stat-total" />
          <Stat label="Sent" value={totals?.sent} testID="stat-sent" />
          <Stat label="Pending" value={totals?.pending} testID="stat-pending" />
        </View>
        <View className="flex-row gap-2">
          <Stat label="Failed" value={totals?.failed} testID="stat-failed" />
          <Stat label="Scheduled" value={totals?.scheduled} testID="stat-scheduled" />
          <Stat label="Completed requests" value={totals?.completedRequests} testID="stat-completed" />
        </View>
      </View>
      {quota.data ? <QuotaCard quota={quota.data} onSaved={(q) => qc.setQueryData(emailKeys.quota, q)} /> : null}
      <Tabs value={tab} onValueChange={(v) => switchTab(v as EmailTab)}>
        <TabsList className="h-12 w-full rounded-xl p-1">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} testID={`email-tab-${value}`} className="h-full flex-1 rounded-lg">
              <Text className={cn('text-sm', tab === value && 'font-semibold text-purple-700')}>{label}</Text>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {current.isError && current.data ? (
        <Notice tone="error" testID="email-refresh-error">{apiErrorMessage(current.error, "Couldn't refresh.")} Pull down to try again.</Notice>
      ) : null}

      {tab === 'schedule' ? (
        <View className="gap-3">
          <Button testID="schedule-new" onPress={() => navigation.navigate('EmailSchedule', {})} className="h-12 rounded-xl">
            <Send size={18} color="#fff" />
            <Text>Schedule new emails</Text>
          </Button>
          <Text className="font-semibold text-gray-900">Scheduled and drafts</Text>
        </View>
      ) : null}

      {tab === 'data' ? (
        <View className="gap-2 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="font-semibold text-gray-900">Create a folder</Text>
          <Input
            testID="folder-name"
            value={folderName}
            onChangeText={setFolderName}
            placeholder="For example, Andhra Bank"
            returnKeyType="done"
            className="h-12 rounded-xl"
          />
          <Button
            testID="create-folder"
            disabled={!folderName.trim() || createFolder.isPending}
            onPress={() => createFolder.mutate()}
            className="h-12 rounded-xl">
            {createFolder.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Plus size={18} color="#fff" />
                <Text>Create folder</Text>
              </>
            )}
          </Button>
          {createFolder.isError ? <Notice tone="error" testID="create-folder-error">{apiErrorMessage(createFolder.error, "Couldn't create the folder. Try again.")}</Notice> : null}
        </View>
      ) : null}

      {tab === 'templates' ? (
        <View className="gap-3">
          <Button testID="new-template" onPress={() => navigation.navigate('EmailTemplateForm', {})} className="h-12 rounded-xl">
            <Plus size={18} color="#fff" />
            <Text>New template</Text>
          </Button>
          {removeTemplate.isError ? <Notice tone="error" testID="delete-template-error">{apiErrorMessage(removeTemplate.error, "Couldn't delete the template. Try again.")}</Notice> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Email automation" />
      <FlatList<EmailRequest | EmailFolder | EmailTemplate>
        testID="email-list"
        data={current.isPending || (current.isError && !current.data) ? [] : rows}
        keyExtractor={(r) => r._id}
        renderItem={({ item }) => {
          if (tab === 'data') {
            const folder = item as EmailFolder;
            return <FolderRow folder={folder} onPress={() => navigation.navigate('EmailFolder', { folderId: folder._id })} />;
          }
          if (tab === 'templates') {
            const template = item as EmailTemplate;
            return (
              <TemplateRow
                template={template}
                onPress={() => navigation.navigate('EmailTemplateForm', { templateId: template._id })}
                onDelete={() => {
                  removeTemplate.reset();
                  setToDelete(template);
                }}
              />
            );
          }
          const request = item as EmailRequest;
          return <EmailRequestRow request={request} onPress={() => navigation.navigate('EmailRequestDetail', { requestId: request._id })} />;
        }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName="px-5 pb-8 pt-1 grow"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        refreshControl={<RefreshControl refreshing={requests.isRefetching} onRefresh={refresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          current.isPending ? (
            <View testID="email-loading" className="gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </View>
          ) : current.isError ? (
            <ErrorState message={apiErrorMessage(current.error, "Couldn't load this. Try again.")} onRetry={refresh} />
          ) : tab === 'sent' ? (
            <EmptyState title="No emails sent yet" body="Finished sends show up here." icon={Mail} />
          ) : tab === 'schedule' ? (
            <EmptyState title="Nothing scheduled" body="Schedule new emails to a folder to get started." icon={Send} />
          ) : tab === 'data' ? (
            <EmptyState title="No folders yet" body="Create a folder, open it and upload an Excel file. Then schedule emails to it." icon={Folder} />
          ) : (
            <EmptyState title="No templates yet" body="A template holds the subject, body and files of an email." icon={FileText} />
          )
        }
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this template?"
        body={`${toDelete?.name ?? ''} will be removed. Emails already scheduled keep their own copy.`}
        confirm="Delete"
        onConfirm={() => toDelete && removeTemplate.mutate(toDelete)}
        onClose={() => setToDelete(null)}
        testID="delete-template-dialog"
      />
    </SafeAreaView>
  );
}
