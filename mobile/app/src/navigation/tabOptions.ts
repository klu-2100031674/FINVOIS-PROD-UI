import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_ACTIVE = '#7c3aed';
const TAB_INACTIVE = '#6b7280';

/**
 * The app draws edge to edge, so the tab bar must sit above the phone's own navigation: about 48 dp for the
 * 3-button bar, a thin strip for gesture navigation, 0 on phones without one. A fixed height hid the tabs
 * behind the 3-button bar.
 */
export function useTabOptions() {
  const { bottom } = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: TAB_ACTIVE,
    tabBarInactiveTintColor: TAB_INACTIVE,
    tabBarStyle: { height: 66 + bottom, paddingTop: 8, paddingBottom: bottom + 8, borderTopColor: '#e5e7eb' },
    tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  };
}
