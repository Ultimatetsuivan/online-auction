/**
 * Push notification registration.
 * Requests permission, gets the device FCM/APNs token, and registers it with the backend.
 * Called once after login and on every app start when the user is already authenticated.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '../api';

const TOKEN_STORAGE_KEY = 'push_token_registered';

export async function registerPushToken(): Promise<void> {
  try {
    // Only on physical devices — simulators can't receive push notifications
    if (!Constants.isDevice) return;

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied — skipping token registration');
      return;
    }

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AuctionHub',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    // Get device token — this is the native FCM token (Android) / APNs token (iOS)
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = deviceToken.data;

    if (!token) {
      console.log('[Push] No device token received');
      return;
    }

    // Avoid re-registering the same token on every startup
    const lastToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (lastToken === token) return;

    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) return;

    await api.post(
      '/api/auth/fcm-token',
      { token },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    console.log('[Push] Token registered successfully');
  } catch (err: any) {
    // Non-fatal — app works fine without push
    console.warn('[Push] Token registration failed:', err?.message);
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;

    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) return;

    await api.delete(
      `/api/auth/fcm-token/${encodeURIComponent(token)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log('[Push] Token unregistered');
  } catch (err: any) {
    console.warn('[Push] Token unregister failed:', err?.message);
  }
}

/** Configure how notifications behave while the app is in the foreground */
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
