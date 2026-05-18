import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse
} from '@react-native-google-signin/google-signin'
import { supabase } from '@/utils/supabase'
import { Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/utils/api';
import { UI_COLORS } from '@/constants/ui-tokens';

const googleID = process.env.EXPO_PUBLIC_GOOGLECLIENT_ID as string;

type Props = {
  disabled?: boolean;
  colors?: {
    surface?: string;
    surfaceMuted?: string;
    border?: string;
    text?: string;
    icon?: string;
  };
}


export default function GoogleLogin({disabled, colors}:Props) {
  const { login } = useAuth();
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleID,
    });
  }, []);

  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const palette = {
    surface: UI_COLORS.surface,
    surfaceMuted: UI_COLORS.surfaceMuted,
    border: UI_COLORS.border,
    text: UI_COLORS.textPrimary,
    icon: UI_COLORS.textPrimary,
    ...colors,
  };
  return (
      <Pressable
        disabled={disabled}
        onPressIn={()=>setPressed(true)}
        onPressOut={()=>setPressed(false)}
        className={`flex-row items-center justify-center p-4 rounded-full gap-[8px]`}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        style={{
            opacity: disabled ? 0.6 : (pressed ? 0.9 : 1),
            backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
            borderWidth: 1,
            borderColor: palette.border,
            transform: [{ scale: pressed ? 0.98 : 1 }],
        }}
        onPress={async () => {
          try {
            await GoogleSignin.hasPlayServices()
            const response = await GoogleSignin.signIn()
            if (isSuccessResponse(response)) {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.data.idToken as string,
              })
              if (error || !data.session) {
                Alert.alert('Error', error?.message ?? 'No session returned');
                return;
              }
              await login(data.user, data.session.access_token, data.session.refresh_token);
              const { ok, data: syncData } = await api.post('/auth/google-sync', {});
              if (!ok) {
                console.error('google-sync failed:', syncData);
                Alert.alert('Error', 'Failed to sync profile with server');
              }
                          
            }
          } catch (error: any) {
            if (error.code === statusCodes.IN_PROGRESS) {
              // operation (e.g. sign in) is in progress already
              Alert.alert('Already in progress!');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
              // play services not available or outdated
              Alert.alert('Google Play services outdated! Cannot proceed with Google login.');
            } else {
              // some other error happened
              console.error("Google Sign-In Error Detail:", error); 
              Alert.alert('Error', error.message || 'Something went wrong');
            }
          }
        }}>
        <AntDesign name="google" size={24} color={palette.icon} />
        <Text className="font-grotesk-bold text-[16px]" style={{ color: palette.text }}>
              Continue with Google
        </Text>
      </Pressable>
  )
}

