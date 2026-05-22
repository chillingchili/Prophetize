import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import * as api from '../utils/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type PushNotificationContextType = {
  expoPushToken: string | null;
};

const PushNotificationContext = createContext<PushNotificationContextType>({
  expoPushToken: null,
});

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { token: authToken } = useAuth();
  const expoPushTokenRef = useRef<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const setup = async () => {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    };
    setup();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('push received', notification.request.content.data);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.targetPath && typeof data.targetPath === 'string') {
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (authToken) {
      const registerToken = async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('push permission not granted');
          return;
        }

        try {
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
          if (!projectId) {
            console.log('push: no projectId found');
            return;
          }

          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
          const pushToken = tokenData.data;
          expoPushTokenRef.current = pushToken;

          const platform = Platform.OS === 'ios' ? 'ios' : 'android';
          await api.post('/notifications/register-push-token', {
            token: pushToken,
            platform,
          });
        } catch (e) {
          console.log('push token registration failed', e);
        }
      };

      registerToken();
    } else {
      if (expoPushTokenRef.current) {
        api.post('/notifications/unregister-push-token', {
          token: expoPushTokenRef.current,
        }).catch(() => {});
        expoPushTokenRef.current = null;
      }
    }
  }, [authToken]);

  return (
    <PushNotificationContext.Provider value={{ expoPushToken: expoPushTokenRef.current }}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationContext);
}
