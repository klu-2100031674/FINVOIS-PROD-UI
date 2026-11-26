import { View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Text } from '~/components/ui/text';

interface Props {
  visible: boolean;
  onAllow: () => void;
  /** Also fires when the dialog is dismissed with the close button or a tap outside it. */
  onNotNow: () => void;
}

/** One-time explanation shown before the system permission prompt. */
export function RationaleModal({ visible, onAllow, onNotNow }: Props) {
  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onNotNow()}>
      <DialogContent testID="push-rationale" className="gap-5 rounded-3xl border-gray-200 bg-white">
        <DialogHeader className="items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
            <Bell size={24} color="#7c3aed" />
          </View>
          <DialogTitle className="text-center font-manrope text-xl text-gray-900">Turn on notifications</DialogTitle>
          <DialogDescription className="text-center text-base text-gray-600">
            Get alerts when work is assigned or a report is approved.
          </DialogDescription>
        </DialogHeader>
        <View className="gap-2">
          <Button onPress={onAllow} testID="push-allow" className="h-12 rounded-xl">
            <Text>Allow</Text>
          </Button>
          <Button variant="outline" onPress={onNotNow} testID="push-not-now" className="h-12 rounded-xl">
            <Text className="text-gray-900">Not now</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
}
