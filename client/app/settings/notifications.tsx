import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <Stack.Screen options={{ title: 'Notifications', headerShown: false }} />
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="chevron-left" size={28} color={theme.textPrimary} />
        </Pressable>
        <Text className="font-grotesk-bold text-[18px] ml-2" style={{ color: theme.textPrimary }}>
          Notifications
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-base font-inter" style={{ color: theme.textSecondary }}>
          This screen is coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
