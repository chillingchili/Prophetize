import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserStore } from "../../context/useUserStore";
import { useTheme } from '@/context/ThemeContext';
import { FloatingTabBar } from '@/components/common/floating-tab-bar';


export default function TabsLayout(){
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const { fetchUserData } = useUserStore();
  const { colorScheme } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
            router.replace('/');
    } else {
        fetchUserData();
    }
  }, [token, isLoading]);

    if (!token && !isLoading) {
        return <Redirect href="/" />;
    }

    if (!token) return null;

  return (
    <Tabs key={colorScheme} tabBar={(props) => <FloatingTabBar key={`tab-bar-${colorScheme}`} {...props} />}>
        <Tabs.Screen name="home" options={{ title: 'Home', headerShown: false }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore', headerShown: false }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard', headerShown: false }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
    </Tabs>
  );
}
