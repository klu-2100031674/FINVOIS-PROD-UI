import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useMutation } from '@tanstack/react-query';
import { Paperclip, Plus, X } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { fetchEmailAttachmentBytes, uploadEmailAttachment, type EmailAttachment } from '~/api/emailAutomation';
import { discardPicked, pickEmailAttachments } from '~/lib/documentPicker';
import { removePdf, savePdf } from '~/lib/pdfCache';
import { MAX_ATTACHMENTS, attachmentProblem, formatBytes } from '~/utils/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';
import { Notice } from './Notice';

// A download stays in the app cache like a report PDF, reaches another app only through the share sheet on the user's tap,
// and is removed when the chip goes away and on sign-out. The name comes from whoever uploaded it, so it is cleaned first.
const cacheName = (file: EmailAttachment) =>
  `email-${file._id.replace(/[^A-Za-z0-9]/g, '')}-${file.filename.replace(/[^\w.-]+/g, '_')}`;

export function AttachmentChip({ file, note, onRemove }: { file: EmailAttachment; note?: string; onRemove?: () => void }) {
  const saved = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (saved.current) removePdf(saved.current);
    },
    []
  );

  const open = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      const bytes = await fetchEmailAttachmentBytes(file._id);
      const name = cacheName(file);
      const cached = savePdf(name, bytes, file.content_type);
      saved.current = name;
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = cached.uri;
        a.download = file.filename;
        a.click();
        return;
      }
      await Sharing.shareAsync(cached.uri, { mimeType: file.content_type, dialogTitle: 'Open attachment' });
    },
  });

  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white pl-3">
        <Paperclip size={16} color="#6b7280" />
        <Pressable
          testID={`attachment-${file._id}`}
          accessibilityRole="button"
          accessibilityLabel={`Open ${file.filename}`}
          disabled={open.isPending}
          onPress={() => open.mutate()}
          className="min-h-11 min-w-0 flex-1 justify-center py-2">
          <Text testID={`attachment-name-${file._id}`} className="text-sm text-gray-900" numberOfLines={1}>{file.filename}</Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>{[formatBytes(file.size), note].filter(Boolean).join(' · ')}</Text>
        </Pressable>
        {open.isPending ? <ActivityIndicator color="#7c3aed" /> : null}
        {onRemove ? (
          <Pressable
            testID={`attachment-remove-${file._id}`}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${file.filename}`}
            onPress={onRemove}
            className="h-11 w-11 items-center justify-center">
            <X size={16} color="#6b7280" />
          </Pressable>
        ) : null}
      </View>
      {open.isError ? (
        <Notice tone="error" testID={`attachment-error-${file._id}`}>{apiErrorMessage(open.error, "The file couldn't be opened. Try again.")}</Notice>
      ) : null}
    </View>
  );
}

interface Props {
  label: string;
  files: EmailAttachment[];
  onChange: (update: (files: EmailAttachment[]) => EmailAttachment[]) => void;
  /** Files already on the email from the template: shown and counted in the limits, not removable here. */
  locked?: EmailAttachment[];
}

export function AttachmentPicker({ label, files, onChange, locked = [] }: Props) {
  const [problem, setProblem] = useState<string | null>(null);
  const all = [...locked, ...files];
  const total = all.reduce((n, f) => n + f.size, 0);

  const add = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      const picked = await pickEmailAttachments();
      if (!picked.length) return;
      try {
        const tooMany = attachmentProblem(picked, all);
        if (tooMany) {
          setProblem(tooMany);
          return;
        }
        for (const f of picked) {
          const saved = await uploadEmailAttachment(f);
          onChange((prev) => [...prev, saved]);
        }
      } finally {
        discardPicked(picked);
      }
    },
    onError: (err) => setProblem(apiErrorMessage(err, "Couldn't upload the file. Try again.")),
  });

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-medium text-gray-700">{label}</Text>
        <Text testID="attachment-totals" className="text-xs text-gray-500">{all.length}/{MAX_ATTACHMENTS} · {formatBytes(total)} of 10 MB</Text>
      </View>
      {locked.map((f) => (
        <AttachmentChip key={`locked-${f._id}`} file={f} note="From template" />
      ))}
      {files.map((f) => (
        <AttachmentChip key={f._id} file={f} onRemove={() => onChange((prev) => prev.filter((x) => x._id !== f._id))} />
      ))}
      <Button
        testID="add-attachment"
        variant="outline"
        disabled={add.isPending || all.length >= MAX_ATTACHMENTS}
        onPress={() => {
          setProblem(null);
          add.mutate();
        }}
        className="h-11 rounded-xl">
        {add.isPending ? (
          <ActivityIndicator color="#7c3aed" />
        ) : (
          <>
            <Plus size={16} color="#7c3aed" />
            <Text className="text-gray-900">Add file</Text>
          </>
        )}
      </Button>
      {problem ? <Notice tone="error" testID="attachment-problem">{problem}</Notice> : null}
      <Text className="text-xs text-gray-500">
        Every recipient gets the same files. PDF, images, Word, Excel, CSV, PowerPoint or TXT, up to {MAX_ATTACHMENTS} files and 10 MB in total per email.
      </Text>
    </View>
  );
}
