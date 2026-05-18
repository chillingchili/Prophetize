import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import ConfirmModal from '@/components/common/confirm-modal';

export default function SecurityScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  const validate = () => {
    setError('');
    setSuccess('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogoutAll = () => {
    setShowLogoutAllModal(true);
  };

  const handleConfirmLogoutAll = async () => {
    setShowLogoutAllModal(false);
    await logout();
  };

  const inputStyle = {
    marginTop: 8,
    backgroundColor: theme.surfaceElevated,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: theme.textPrimary,
    fontFamily: 'Inter',
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <Stack.Screen options={{ title: 'Security', headerShown: false }} />

      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="chevron-left" size={28} color={theme.textPrimary} />
        </Pressable>
        <Text className="font-grotesk-bold text-[18px] ml-2" style={{ color: theme.textPrimary }}>
          Security
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        {/* Change Password */}
        <View className="mt-2">
          <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
            Change Password
          </Text>

          <View className="mt-3">
            <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
              Current Password
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              style={inputStyle}
            />
          </View>

          <View className="mt-4">
            <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
              New Password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              style={inputStyle}
            />
          </View>

          <View className="mt-4">
            <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
              Confirm New Password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              style={inputStyle}
            />
          </View>

          {error ? (
            <Text className="font-inter text-[13px] mt-4" style={{ color: theme.danger }}>
              {error}
            </Text>
          ) : null}
          {success ? (
            <Text className="font-inter text-[13px] mt-4" style={{ color: theme.success }}>
              {success}
            </Text>
          ) : null}

          <Pressable
            onPress={handleUpdatePassword}
            disabled={loading}
            className="mt-6 items-center justify-center"
            style={{
              width: '100%',
              height: 52,
              borderRadius: 10,
              backgroundColor: theme.accent,
              opacity: loading ? 0.7 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Updating password' : 'Update Password'}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-grotesk-bold text-[15px]" style={{ color: theme.surface }}>
                Update Password
              </Text>
            )}
          </Pressable>
        </View>

        {/* Sessions */}
        <View className="mt-10">
          <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
            Sessions
          </Text>
          <Pressable
            onPress={handleLogoutAll}
            className="mt-3 items-center justify-center"
            style={{
              width: '100%',
              height: 52,
              borderRadius: 10,
              backgroundColor: theme.danger + '18',
              borderWidth: 1,
              borderColor: theme.danger,
            }}
            accessibilityRole="button"
            accessibilityLabel="Log Out All Devices"
          >
            <Text className="font-grotesk-bold text-[15px]" style={{ color: theme.danger }}>
              Log Out All Devices
            </Text>
          </Pressable>
        </View>

        <View className="mb-10" />
      </ScrollView>

      <ConfirmModal
        visible={showLogoutAllModal}
        title="Log Out All Devices?"
        message="You will be signed out everywhere."
        confirmLabel="Log Out"
        destructive
        onConfirm={handleConfirmLogoutAll}
        onCancel={() => setShowLogoutAllModal(false)}
      />
    </SafeAreaView>
  );
}
