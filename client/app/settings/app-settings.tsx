import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useFocusEffect } from '@react-navigation/native';

const PUSH_KEY = '@app_settings_push_notifications';
const COMPACT_KEY = '@app_settings_compact_numbers';

export default function AppSettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [compactEnabled, setCompactEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const push = await AsyncStorage.getItem(PUSH_KEY);
          const compact = await AsyncStorage.getItem(COMPACT_KEY);
          setPushEnabled(push !== 'false');
          setCompactEnabled(compact === 'true');
        } catch {
          // ignore
        }
      };
      load();
    }, [])
  );

  const togglePush = async (value: boolean) => {
    setPushEnabled(value);
    try {
      await AsyncStorage.setItem(PUSH_KEY, String(value));
    } catch {
      // ignore
    }
  };

  const toggleCompact = async (value: boolean) => {
    setCompactEnabled(value);
    try {
      await AsyncStorage.setItem(COMPACT_KEY, String(value));
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Preferences?',
      'This will clear all app settings and restore defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setPushEnabled(true);
            setCompactEnabled(false);
            try {
              await AsyncStorage.removeItem(PUSH_KEY);
              await AsyncStorage.removeItem(COMPACT_KEY);
            } catch {
              // ignore
            }
          },
        },
      ]
    );
  };

  const renderToggleRow = (
    label: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View className="flex-row items-center justify-between py-3 px-4">
      <Text className="text-base font-inter" style={{ color: theme.textPrimary }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.border}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <Stack.Screen options={{ title: 'App Settings', headerShown: false }} />

      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="chevron-left" size={28} color={theme.textPrimary} />
        </Pressable>
        <Text className="font-grotesk-bold text-[18px] ml-2" style={{ color: theme.textPrimary }}>
          App Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-5">
        {/* Notifications */}
        <View className="mt-2">
          <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
            Notifications
          </Text>
          <View
            className="mt-2 rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.surfaceElevated }}
          >
            {renderToggleRow('Push Notifications', pushEnabled, togglePush)}
          </View>
        </View>

        {/* Display */}
        <View className="mt-6">
          <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
            Display
          </Text>
          <View
            className="mt-2 rounded-xl overflow-hidden"
            style={{ backgroundColor: theme.surfaceElevated }}
          >
            {renderToggleRow('Compact Numbers', compactEnabled, toggleCompact)}
          </View>
        </View>

        {/* Reset */}
        <Pressable
          onPress={handleReset}
          className="mt-10 mb-10 items-center justify-center"
          style={{
            width: '100%',
            height: 52,
            borderRadius: 10,
            backgroundColor: theme.danger + '18',
            borderWidth: 1,
            borderColor: theme.danger,
          }}
        >
          <Text className="font-grotesk-bold text-[15px]" style={{ color: theme.danger }}>
            Reset All Preferences
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
