import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { ErrorState } from '~/components/ErrorState';
import { assignRequest, invalidateAfterRequestChange, listStaff, requestKeys } from '~/api/adminRequests';
import { apiErrorMessage } from '~/utils/errors';
import { cn } from '~/lib/utils';

// Props are the contract other screens rely on; keep them stable.
export interface AssignSheetProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  onAssigned?: () => void;
}

// Every opening mounts a fresh sheet, so no selection or error from the last one is left over.
export function AssignSheet(props: AssignSheetProps) {
  const [openings, setOpenings] = useState(0);
  const [wasVisible, setWasVisible] = useState(props.visible);
  if (props.visible !== wasVisible) {
    setWasVisible(props.visible);
    if (props.visible) setOpenings((n) => n + 1);
  }
  return <Sheet key={openings} {...props} />;
}

function Sheet({ visible, onClose, requestId, onAssigned }: AssignSheetProps) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  // Counts change with every assignment, so always show fresh ones when the sheet opens.
  const staff = useQuery({ queryKey: requestKeys.staff, queryFn: listStaff, enabled: visible, staleTime: 0 });

  const assign = useMutation({
    mutationFn: () => assignRequest(requestId, selected as string),
    // Stay in the pending state until the screens behind the sheet show the new owner.
    onSuccess: async () => {
      await invalidateAfterRequestChange(qc);
      onAssigned?.();
      onClose();
    },
    // A 400 here usually means the request changed under us, so resync as well as show the message.
    onError: () => void invalidateAfterRequestChange(qc),
  });

  const close = () => {
    if (!assign.isPending) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable accessibilityLabel="Close" testID="assign-sheet-backdrop" className="flex-1" onPress={close} />
        <View
          testID="assign-sheet"
          className="max-h-[85%] rounded-t-3xl bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}>
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-300" />
          <Text className="font-manrope text-xl text-gray-900">Assign to staff</Text>
          <Text className="mb-4 mt-1 text-sm text-gray-500">Choose who will handle this request.</Text>

          {staff.isLoading ? (
            <View testID="staff-loading" className="gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </View>
          ) : staff.isError ? (
            <ErrorState
              message={apiErrorMessage(staff.error, "Couldn't load staff. Try again.")}
              onRetry={() => void staff.refetch()}
            />
          ) : staff.data && staff.data.length === 0 ? (
            <Text testID="staff-empty" className="py-6 text-center text-gray-500">
              No active staff to assign. Ask an admin to activate an agent on the web.
            </Text>
          ) : (
            <ScrollView className="grow-0" keyboardShouldPersistTaps="handled">
              <RadioGroup value={selected ?? ''} onValueChange={setSelected} className="gap-2">
                {staff.data?.map((s) => (
                  <Pressable
                    key={s.id}
                    testID={`staff-option-${s.id}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected === s.id }}
                    accessibilityLabel={`${s.name}, ${s.openCount} open`}
                    onPress={() => setSelected(s.id)}
                    disabled={assign.isPending}
                    className={cn(
                      'min-h-14 flex-row items-center gap-3 rounded-2xl border bg-white px-4 py-3',
                      selected === s.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    )}>
                    <View pointerEvents="none">
                      <RadioGroupItem value={s.id} aria-label={s.name} className="size-5" />
                    </View>
                    <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>{s.name}</Text>
                    <Text testID={`staff-open-${s.id}`} className="text-sm text-gray-500">{s.openCount} open</Text>
                  </Pressable>
                ))}
              </RadioGroup>
            </ScrollView>
          )}

          {assign.isError ? (
            <View accessibilityRole="alert" testID="assign-error" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{apiErrorMessage(assign.error, "Couldn't assign this request. Try again.")}</Text>
            </View>
          ) : null}

          <View className="mt-4 gap-2">
            <Button
              testID="assign-confirm"
              disabled={!selected || assign.isPending}
              onPress={() => assign.mutate()}
              className="h-12 rounded-xl bg-black">
              {assign.isPending ? <ActivityIndicator color="#ffffff" /> : <Text className="font-manrope text-base text-white">Confirm assign</Text>}
            </Button>
            <Button variant="ghost" testID="assign-cancel" disabled={assign.isPending} onPress={close} className="h-11 rounded-xl">
              <Text className="text-gray-700">Cancel</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
