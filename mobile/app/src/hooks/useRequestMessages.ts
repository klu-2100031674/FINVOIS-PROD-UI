import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentKeys, listMessages, postMessage, type RequestMessage } from '~/api/agentRequests';

export const MESSAGES_POLL_MS = 30_000;

type Thread = Awaited<ReturnType<typeof listMessages>>;

/**
 * The request's message thread, oldest first. Polls every 30 s while `focused` (no websockets in v1).
 * `send` shows the message at once and removes it again if the server refuses it, so the thread never lies.
 */
export function useRequestMessages(requestId: string, senderId: string, focused: boolean) {
  const qc = useQueryClient();
  const key = agentKeys.messages(requestId);

  const thread = useQuery({
    queryKey: key,
    queryFn: () => listMessages(requestId),
    refetchInterval: focused ? MESSAGES_POLL_MS : false,
    staleTime: 0,
    networkMode: 'always',
    retry: false,
  });

  const send = useMutation({
    mutationFn: (body: string) => postMessage(requestId, body),
    onMutate: async (body) => {
      // A poll landing now would overwrite the optimistic message with a list that does not have it yet.
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Thread>(key);
      const optimistic: RequestMessage = {
        id: `pending-${Date.now()}`,
        body,
        senderId,
        senderRole: 'customer_service',
        createdAt: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<Thread>(key, {
        canPost: previous?.canPost ?? true,
        messages: [...(previous?.messages ?? []), optimistic],
      });
      return { previous };
    },
    onError: (_err, _body, context) => {
      qc.setQueryData(key, context?.previous);
    },
    // Success or failure, the server's list is the truth.
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });

  return { thread, send };
}
