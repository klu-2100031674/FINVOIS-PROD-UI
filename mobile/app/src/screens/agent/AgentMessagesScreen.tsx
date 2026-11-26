import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Send } from 'lucide-react-native';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { MAX_MESSAGE_LENGTH, type RequestMessage } from '~/api/agentRequests';
import { useSession } from '~/auth/useSession';
import { useRequestMessages } from '~/hooks/useRequestMessages';
import type { RootStackParamList } from '~/navigation/types';
import { cn } from '~/lib/utils';
import { ACCESS_DENIED_MESSAGE, isAccessDenied } from '~/utils/agentRequest';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate, formatTime } from '~/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AgentMessages'>;

const ROLE_LABEL: Record<string, string> = { customer: 'Applicant', customer_service: 'Support', admin: 'CA', department: 'Department' };

function Bubble({ message, mine }: { message: RequestMessage; mine: boolean }) {
  const label = mine ? 'You' : message.senderName || ROLE_LABEL[message.senderRole ?? ''] || 'User';
  const role = !mine && message.senderRole ? ROLE_LABEL[message.senderRole] : undefined;
  return (
    <View testID={`bubble-${message.id}`} className={cn('max-w-[85%] gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
      <View className={cn('rounded-2xl px-4 py-2.5', mine ? 'rounded-br-md bg-purple-600' : 'rounded-bl-md bg-gray-100', message.pending && 'opacity-60')}>
        <Text className={cn('text-base', mine ? 'text-white' : 'text-gray-900')}>{message.body}</Text>
      </View>
      <Text className="text-xs text-gray-500">
        {label}
        {role && role !== label ? ` · ${role}` : ''}
        {' · '}
        {message.pending ? 'Sending' : `${formatDate(message.createdAt)} ${formatTime(message.createdAt)}`}
      </Text>
    </View>
  );
}

export default function AgentMessagesScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : '';
  const focused = useIsFocused();
  const { thread, send } = useRequestMessages(requestId, userId, focused);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<RequestMessage>>(null);

  const messages = thread.data?.messages ?? [];
  const canPost = thread.data?.canPost ?? false;
  const denied = thread.isError && isAccessDenied(thread.error);
  const body = draft.trim();

  const submit = () => {
    if (!body || send.isPending || !canPost) return;
    setDraft('');
    // The rolled-back message must not be lost: put the text back for another try, unless the user already typed more.
    send.mutate(body, { onError: () => setDraft((current) => current || body) });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScreenHeader title="Messages" onBack={() => navigation.goBack()} />

        {thread.isPending ? (
          <View testID="messages-loading" className="gap-3 px-5 pt-1">
            <Skeleton className="h-14 w-3/4 rounded-2xl" />
            <Skeleton className="h-14 w-2/3 self-end rounded-2xl" />
            <Skeleton className="h-14 w-3/4 rounded-2xl" />
          </View>
        ) : denied ? (
          <View testID="access-denied" accessibilityRole="alert" className="flex-1 items-center gap-2 px-6 py-16">
            <Text className="text-center font-manrope text-lg text-gray-900">{ACCESS_DENIED_MESSAGE}</Text>
          </View>
        ) : thread.isError && !thread.data ? (
          <View className="flex-1">
            <ErrorState message={apiErrorMessage(thread.error, "Couldn't load the messages. Try again.")} onRetry={() => void thread.refetch()} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            testID="messages-list"
            className="flex-1"
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <Bubble message={item} mine={Boolean(userId) && item.senderId === userId} />}
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerClassName="px-5 pb-4 pt-1 grow"
            // Newest at the bottom, like every chat: the list opens on, and follows, the latest message.
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              thread.isError ? (
                <Text testID="refresh-error" accessibilityRole="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiErrorMessage(thread.error, "Couldn't refresh the messages.")} It will try again shortly.
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                title="No messages yet"
                body={canPost ? 'Send the first message to the applicant.' : 'Messages between you and the applicant show up here.'}
              />
            }
          />
        )}

        {!denied && thread.data ? (
          <View className="gap-2 border-t border-gray-200 bg-white px-5 pb-3 pt-3">
            {send.isError ? (
              <Text testID="send-error" accessibilityRole="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {apiErrorMessage(send.error, "Couldn't send your message. Try again.")} Your text is still in the box.
              </Text>
            ) : null}
            {canPost ? (
              <View className="flex-row items-end gap-2">
                <Textarea
                  testID="message-input"
                  accessibilityLabel="Message"
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Write a message"
                  maxLength={MAX_MESSAGE_LENGTH}
                  numberOfLines={3}
                  className="max-h-32 min-h-12 flex-1 rounded-xl"
                />
                <Button
                  testID="send-message"
                  accessibilityLabel="Send message"
                  disabled={!body || send.isPending}
                  onPress={submit}
                  className="h-12 w-12 rounded-xl bg-black px-0">
                  {send.isPending ? <ActivityIndicator color="#ffffff" /> : <Send size={18} color="#ffffff" />}
                </Button>
              </View>
            ) : (
              <Text testID="messages-locked" className="text-center text-sm text-gray-500">
                You can message the applicant once you claim this request.
              </Text>
            )}
            {canPost && draft.length > MAX_MESSAGE_LENGTH - 200 ? (
              <Text testID="message-count" className="text-right text-xs text-gray-500">
                {draft.length} / {MAX_MESSAGE_LENGTH}
              </Text>
            ) : null}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
