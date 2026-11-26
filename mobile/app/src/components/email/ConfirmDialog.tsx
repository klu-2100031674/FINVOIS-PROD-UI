import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Text } from '~/components/ui/text';

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirm: string;
  cancel?: string;
  onConfirm: () => void;
  onClose: () => void;
  testID: string;
}

export function ConfirmDialog({ open, title, body, confirm, cancel = 'Go back', onConfirm, onClose, testID }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent testID={testID}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel testID={`${testID}-cancel`}><Text>{cancel}</Text></AlertDialogCancel>
          <AlertDialogAction testID={`${testID}-confirm`} onPress={onConfirm}><Text>{confirm}</Text></AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
