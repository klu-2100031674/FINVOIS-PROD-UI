import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react-native';
import { AttachmentPicker } from '~/components/email/AttachmentPicker';
import { Notice } from '~/components/email/Notice';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { emailKeys, listEmailTemplates, saveEmailTemplate, type EmailAttachment, type EmailColumn, type EmailTemplate } from '~/api/emailAutomation';
import type { RootStackParamList } from '~/navigation/types';
import { BUILT_IN_PLACEHOLDERS, bodyToText, hasFormatting, insertAtCursor } from '~/utils/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailTemplateForm'>;
type Selection = { start: number; end: number };

function TemplateForm({ initial, columns, onSaved }: { initial?: EmailTemplate; columns?: EmailColumn[]; onSaved: (t: EmailTemplate) => void }) {
  const original = initial?.body ?? '';
  const formatted = hasFormatting(original);
  const [name, setName] = useState(initial?.name ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [body, setBody] = useState(bodyToText(original));
  // A body with bold, colours or links is left untouched unless the admin chooses to replace it with plain text.
  const [rewriting, setRewriting] = useState(!formatted);
  const [files, setFiles] = useState<EmailAttachment[]>(initial?.attachments ?? []);
  const [focus, setFocus] = useState<'subject' | 'body'>('body');
  const [subjectAt, setSubjectAt] = useState<Selection>();
  const [bodyAt, setBodyAt] = useState<Selection>();
  const qc = useQueryClient();

  const chips = columns?.length ? columns : BUILT_IN_PLACEHOLDERS;
  const bodyChanged = rewriting && body !== bodyToText(original);

  const insert = (label: string) => {
    const text = `{{${label}}}`;
    if (focus === 'subject') setSubject((v) => insertAtCursor(v, text, subjectAt));
    else if (rewriting) setBody((v) => insertAtCursor(v, text, bodyAt));
  };

  const save = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      const saved = await saveEmailTemplate({
        _id: initial?._id,
        name,
        subject,
        // An unchanged body goes back exactly as it was, so a web-formatted template keeps its markup.
        body: bodyChanged || !initial ? body : original,
        attachments: files,
      });
      await qc.invalidateQueries({ queryKey: emailKeys.templates });
      return saved;
    },
    onSuccess: onSaved,
  });

  const valid = name.trim() && subject.trim() && (rewriting ? body.trim() : original);

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView testID="template-form" contentContainerClassName="gap-4 px-5 pb-8 pt-1" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-xs font-medium text-gray-500">Template name</Text>
          <Input testID="template-name" value={name} onChangeText={setName} className="h-12 rounded-xl" />
        </View>
        <View className="gap-1">
          <Text className="text-xs font-medium text-gray-500">Email subject</Text>
          <Input
            testID="template-subject"
            value={subject}
            onChangeText={setSubject}
            onFocus={() => setFocus('subject')}
            onSelectionChange={(e) => setSubjectAt(e.nativeEvent.selection)}
            className="h-12 rounded-xl"
          />
        </View>

        <View className="gap-1">
          <Text className="text-xs font-medium text-gray-500">Email body</Text>
          {rewriting ? (
            <Textarea
              testID="template-body"
              value={body}
              onChangeText={setBody}
              onFocus={() => setFocus('body')}
              onSelectionChange={(e) => setBodyAt(e.nativeEvent.selection)}
              placeholder="Write the email here"
              className="min-h-48 rounded-xl"
            />
          ) : (
            <View className="gap-3">
              <Text testID="template-body-preview" className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">{body}</Text>
              <Notice tone="warning" testID="template-formatted-note">
                {"This body has formatting from the web, such as bold, colours or links. The app can't edit formatting, so saving here keeps it as it is."}
              </Notice>
              <Button testID="template-rewrite" variant="outline" onPress={() => setRewriting(true)} className="h-11 rounded-xl">
                <Text className="text-gray-900">Edit as plain text (removes formatting)</Text>
              </Button>
            </View>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-xs text-gray-500">
            {columns?.length
              ? 'Tap a column to insert it at the cursor, in the subject or body:'
              : 'Placeholders for the subject and body. Each one is filled in per recipient:'}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {chips.map((c) => (
              <Pressable
                key={c.key}
                testID={`placeholder-${c.key}`}
                accessibilityRole="button"
                accessibilityLabel={`Insert ${c.label}`}
                onPress={() => insert(c.label)}
                className="min-h-9 justify-center rounded-full border border-purple-200 bg-white px-3 active:bg-purple-50">
                <Text className="text-sm text-purple-700">{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <AttachmentPicker label="Template attachments, sent with every email using this template" files={files} onChange={setFiles} />

        {save.isError ? <Notice tone="error" testID="template-error">{apiErrorMessage(save.error, "Couldn't save the template. Try again.")}</Notice> : null}
        <Button testID="template-save" disabled={!valid || save.isPending} onPress={() => save.mutate()} className="h-12 rounded-xl">
          {save.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text>Save template</Text>
            </>
          )}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function EmailTemplateFormScreen({ navigation, route }: Props) {
  const { templateId, columns, returnToSchedule } = route.params ?? {};
  const templates = useQuery({ queryKey: emailKeys.templates, queryFn: listEmailTemplates, enabled: Boolean(templateId) });
  const initial = templateId ? templates.data?.find((t) => t._id === templateId) : undefined;

  const onSaved = (t: EmailTemplate) => {
    if (returnToSchedule) navigation.popTo('EmailSchedule', { pickedTemplateId: t._id }, { merge: true });
    else navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title={templateId ? 'Edit template' : 'New template'} onBack={() => navigation.goBack()} />
      {templateId && templates.isPending ? (
        <View testID="template-loading" className="gap-3 px-5 pt-1">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </View>
      ) : templateId && !initial ? (
        <ErrorState message={apiErrorMessage(templates.error, "Couldn't find this template. Try again.")} onRetry={() => void templates.refetch()} />
      ) : (
        <TemplateForm key={initial?._id ?? 'new'} initial={initial} columns={columns} onSaved={onSaved} />
      )}
    </SafeAreaView>
  );
}
