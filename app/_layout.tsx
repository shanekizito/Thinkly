import { LocalizationProvider } from '@/src/contexts/LocalizationContext';
import { TopicProvider } from '@/src/contexts/TopicContext';
import { useFirebaseUserTracking } from '@/src/hooks/useFirebaseUserTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { Component, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { withIAPContext } from 'react-native-iap';

import BadgeEarnModal from '@components/BadgeEarnModal';
import LevelUpModal from '@components/LevelUpModal';
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { BadgesProvider, useBadgeEarn } from '../src/contexts/BadgesContext';
import { CourseLengthProvider } from '../src/contexts/CourseLengthContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import {
  requestAndroidNotificationPermission,
  requestNotificationPermissions,
  scheduleStreakReminder,
  setupForegroundHandler
} from '../src/utility/notifications';

// Initialize WebBrowser auth session
WebBrowser.maybeCompleteAuthSession();

// Error Boundary to catch initialization errors
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
          <Text style={styles.errorStack}>{this.state.error?.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// This should ONLY wrap providers
function RootLayout() {
  const colorScheme = useColorScheme();
  useFirebaseUserTracking('Authentication');

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // 0. Request Android 13+ notification permission
        await requestAndroidNotificationPermission();

        // 1. Request permissions
        const { localEnabled } = await requestNotificationPermissions();

        // 2. Load user preference
        const remindersEnabled = await AsyncStorage.getItem('@reminders_enabled');

        // 3. Schedule if enabled
        if (localEnabled && remindersEnabled === 'true') {
          const savedTime = await AsyncStorage.getItem('@reminder_time');
          await scheduleStreakReminder(true, savedTime || '20:00');
        }

        // 4. Set up foreground handler
        setupForegroundHandler();
      } catch (error) {
        console.error('[RootLayout] Notification initialization error:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <LocalizationProvider>
          <SettingsProvider>
            <AuthProvider>
              <CourseLengthProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <BadgesProvider>
                    <TopicProvider>
                      <LayoutContent />
                    </TopicProvider>
                  </BadgesProvider>
                </ThemeProvider>
              </CourseLengthProvider>
            </AuthProvider>
          </SettingsProvider>
        </LocalizationProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default withIAPContext(RootLayout);

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ff0000',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  errorStack: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

// Move layout logic here
function LayoutContent() {
  const { user, loading } = useAuth();
  const { earnedBadge } = useBadgeEarn();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0f2b46" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{
        headerShown: false,
        autoHideHomeIndicator: true,
      }} />

      {earnedBadge?.trim() && <BadgeEarnModal />}
      <LevelUpModal />
    </>
  );
}
