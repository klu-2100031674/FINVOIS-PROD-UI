import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';

// Native stand-in for the web login's blurred purple / pink / yellow blobs.
export function AuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <LinearGradient
      colors={['#e9d5ff', '#fdf2f8', '#fef3c7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}>
      <View className="flex-1">{children}</View>
    </LinearGradient>
  );
}
