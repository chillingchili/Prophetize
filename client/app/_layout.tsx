import "../global.css";
import { useFonts } from 'expo-font';
import { SpaceGrotesk_700Bold, SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk';
import { InterTight_400Regular, InterTight_700Bold } from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { usePathname, useRootNavigationState, useRouter, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoadingScreen from '@/components/common/loading-screen';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import * as api from '@/utils/api';

export default function Layout() {
    return (
        
      <AuthProvider>
        <RootLayout />
      </AuthProvider>
  
    );
}

function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const rootNavState = useRootNavigationState();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if(isLoading) return;
    if(!rootNavState?.key) return;
    const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signUp';
    if(!token && !isPublicRoute){
      router.replace('/');
      return;
    }
    // Only auto-forward authenticated users from the landing page.
    // Keep /login and /signUp reachable to avoid unexpected route jumps.
    if(token && pathname === '/'){
      router.replace('/tabs/home');
    }
  }, [token, isLoading, pathname, router, rootNavState?.key]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const platform: api.NotificationPlatform = Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
      ? 'android'
      : 'web';

    const channelToken = `local-${platform}-${token.slice(0, 12)}`;
    void api.registerNotificationChannel(channelToken, platform);
  }, [token]);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
    InterTight_400Regular,
    InterTight_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if(isLoading || !fontsLoaded){
    return <LoadingScreen />
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Prophetize', headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="signUp" options={{ title: 'signUp', headerShown: false }} />
      <Stack.Screen name="marketDetails" options={{ title: 'marketDetails', headerShown: false }}/>
      <Stack.Screen name="explore-details" options={{ title: 'Explore', headerShown: false, presentation: 'modal' }}/>
      <Stack.Screen name="categories" options={{ title: 'Categories', headerShown: false }}/>
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerShown: false }}/>
      <Stack.Screen name="tabs" options={{ title: 'tabs', headerShown: false }}/>
      <Stack.Screen name="settings/edit-profile" options={{ title: 'Edit Profile', headerShown: false }} />
      <Stack.Screen name="settings/notifications" options={{ title: 'Notifications', headerShown: false }} />
      <Stack.Screen name="settings/app-settings" options={{ title: 'App Settings', headerShown: false }} />
      <Stack.Screen name="settings/security" options={{ title: 'Security', headerShown: false }} />
      <Stack.Screen name="settings/support" options={{ title: 'Support', headerShown: false }} />
      <Stack.Screen name="settings/about" options={{ title: 'About', headerShown: false }} />
    </Stack>
  );
}
