import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gift, KeyRound, LogOut } from 'lucide-react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '~/navigation/types';
import { ChangePasswordSheet } from '~/components/ChangePasswordSheet';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { sessionStore } from '~/auth/sessionStore';
import { useSession } from '~/auth/useSession';
import { APP_VERSION } from '~/config';
import { NotificationStatusRow } from '~/notifications/NotificationStatusRow';
import { BiometricToggleRow } from '~/security/BiometricToggleRow';

const ROLE_LABEL = { admin: 'CA / Super admin', customer_service: 'Customer service agent' } as const;

export default function ProfileScreen() {
  const session = useSession();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [busy, setBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  if (session.status !== 'signedIn') return null;
  const { user } = session;

  const signOut = async () => {
    setBusy(true);
    await sessionStore.logout();
  };

  const confirm = () => {
    if (Platform.OS === 'web') {
      // Alert.alert has no web implementation
      if (window.confirm('Sign out of Finvois?')) void signOut();
      return;
    }
    Alert.alert('Sign out', 'Sign out of Finvois?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 gap-6 px-5 pt-6">
        <Text className="font-manrope text-2xl text-gray-900">Profile</Text>
        <View className="gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Text className="text-lg font-semibold text-gray-900" testID="profile-name">{user.name}</Text>
          <Text className="text-gray-600" testID="profile-email">{user.email}</Text>
          <Text className="mt-1 text-sm text-purple-600" testID="profile-role">{ROLE_LABEL[user.role]}</Text>
        </View>
        <NotificationStatusRow />
        <BiometricToggleRow />
        {user.role === 'admin' ? (
          <Button variant="outline" onPress={() => navigation.navigate('FreeCredits')} testID="free-credits" className="h-12 rounded-xl">
            <Gift size={18} color="#111827" />
            <Text className="text-gray-900">Free credits</Text>
          </Button>
        ) : null}
        <Button variant="outline" onPress={() => setPasswordOpen(true)} testID="change-password" className="h-12 rounded-xl">
          <KeyRound size={18} color="#111827" />
          <Text className="text-gray-900">Change password</Text>
        </Button>
        <Button variant="outline" onPress={confirm} disabled={busy} testID="sign-out" className="h-12 rounded-xl">
          <LogOut size={18} color="#111827" />
          <Text className="text-gray-900">Sign out</Text>
        </Button>
        <Text className="text-center text-xs text-gray-400">Version {APP_VERSION}</Text>
      </View>
      <ChangePasswordSheet visible={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </SafeAreaView>
  );
}
