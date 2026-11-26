import { View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View testID="error-state" accessibilityRole="alert" className="items-center gap-3 px-6 py-16">
      <AlertCircle size={36} color="#dc2626" />
      <Text className="text-center text-gray-700">{message}</Text>
      {onRetry ? (
        <Button variant="outline" onPress={onRetry} testID="retry-button" className="rounded-xl">
          <Text>Retry</Text>
        </Button>
      ) : null}
    </View>
  );
}
