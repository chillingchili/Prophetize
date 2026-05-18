import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/context/AuthContext';
import { patch } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setUsername(user?.username ?? '');
      setAvatarUrl(user?.avatar_url ?? '');
      setUsernameError('');
      setError('');
      setSuccess(false);
    }, [user?.username, user?.avatar_url])
  );

  const validate = () => {
    setUsernameError('');
    setError('');
    if (username.trim().length < 2 || username.trim().length > 30) {
      setUsernameError('Username must be 2–30 characters.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    const response = await patch('/auth/profile', {
      username: username.trim(),
      avatar_url: avatarUrl.trim() || null,
    });

    setLoading(false);

    if (!response.ok) {
      const msg =
        response.data && typeof response.data === 'object'
          ? (response.data as Record<string, unknown>).error
          : 'Failed to update profile';
      setError(typeof msg === 'string' ? msg : 'Failed to update profile');
      return;
    }

    const data = response.data as Record<string, unknown>;
    const profile = data?.profile as Record<string, unknown> | undefined;

    if (profile) {
      updateUser({
        username: typeof profile.username === 'string' ? profile.username : username.trim(),
        avatar_url:
          typeof profile.avatar_url === 'string' ? profile.avatar_url : avatarUrl.trim() || null,
      });
    } else {
      updateUser({ username: username.trim(), avatar_url: avatarUrl.trim() || null });
    }

    setSuccess(true);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <Stack.Screen options={{ title: 'Edit Profile', headerShown: false }} />

      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="chevron-left" size={28} color={theme.textPrimary} />
        </Pressable>
        <Text className="font-grotesk-bold text-[18px] ml-2" style={{ color: theme.textPrimary }}>
          Edit Profile
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        {/* Username */}
        <View className="mt-2">
          <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
            Username
          </Text>
          <TextInput
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (usernameError) setUsernameError('');
            }}
            placeholder="Your username"
            placeholderTextColor={theme.textMuted}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              marginTop: 8,
              backgroundColor: theme.surfaceElevated,
              borderColor: usernameError ? theme.danger : theme.border,
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              color: theme.textPrimary,
              fontFamily: 'Inter',
            }}
          />
          {usernameError ? (
            <Text className="font-inter text-[12px] mt-2" style={{ color: theme.danger }}>
              {usernameError}
            </Text>
          ) : null}
        </View>

        {/* Avatar URL */}
        <View className="mt-5">
          <Text className="font-jetbrain text-[12px] uppercase" style={{ color: theme.textMuted }}>
            Avatar URL
          </Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              marginTop: 8,
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              color: theme.textPrimary,
              fontFamily: 'Inter',
            }}
          />
        </View>

        {/* Error / Success messages */}
        {error ? (
          <Text className="font-inter text-[13px] mt-4" style={{ color: theme.danger }}>
            {error}
          </Text>
        ) : null}
        {success ? (
          <Text className="font-inter text-[13px] mt-4" style={{ color: theme.success }}>
            Profile updated successfully
          </Text>
        ) : null}

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="mt-8 mb-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Save Changes"
          style={{
            width: '100%',
            height: 52,
            borderRadius: 10,
            backgroundColor: theme.accent,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-grotesk-bold text-[15px]" style={{ color: theme.surface }}>
              Save Changes
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
