import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';

// Set notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const messaging = getMessaging(getApp());
/* ------------------- */
/* 1. PERMISSIONS      */
/* ------------------- */
export const requestNotificationPermissions = async () => {
  // Firebase permissions (for push)
  try {
    const authStatus = await requestPermission(messaging);
    // AuthorizationStatus values: 0 = NOT_DETERMINED, 1 = DENIED, 2 = AUTHORIZED, 3 = PROVISIONAL
    const pushEnabled = authStatus === 2 || authStatus === 3; // AUTHORIZED or PROVISIONAL

    // Local notification permissions (handled automatically on Android, iOS needs explicit request)
    let localEnabled = true;

    return { pushEnabled, localEnabled };
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return { pushEnabled: false, localEnabled: false };
  }
};

/* ------------------- */
/* 2. TOKEN MANAGEMENT */
/* ------------------- */
export const getFcmToken = async () => {
  try {
    return await getToken(messaging);
  } catch (error) {
    console.log('FCM token error:', error);
    return null;
  }
};

/* ------------------- */
/* 3. SCHEDULING       */
/* ------------------- */
export const scheduleStreakReminder = async (enabled: boolean, time?: string) => {
  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  const [hours, minutes] = (time || '20:00').split(':').map(Number);

  // Cancel previous reminders before scheduling a new one
  await Notifications.cancelAllScheduledNotificationsAsync();
  // const triggerDate = getNextTriggerDate(hours, minutes);
  const triggerDate = new Date();
  triggerDate.setMinutes(triggerDate.getMinutes() + 1);

  console.log(triggerDate);

  console.log('Scheduling notification for:', triggerDate);
  console.log('Scheduling notification for (local):', triggerDate.toString());

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Keep Your Streak Alive!",
      body: "Complete today's lesson to maintain your progress",
      sound: true,
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
};

// Helper to get the next trigger date for the notification
function getNextTriggerDate(hours: number, minutes: number) {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
}

/* ------------------- */
/* 4. HANDLERS         */
/* ------------------- */
// For foreground messages (show local notification)
export const setupForegroundHandler = () => {
  return messaging.onMessage(async remoteMessage => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title ?? 'New Message',
        body: remoteMessage.notification?.body ?? '',
        sound: true,
      },
      trigger: null,
    });
  });
};

// For background/quit state messages
messaging.setBackgroundMessageHandler(async remoteMessage => {
  // Handle background messages (e.g. sync data)
  // You can also schedule a local notification here if needed
});

// Channel creation (call this once, e.g. at app startup)
export const createNotificationChannels = () => {
  // PushNotification.createChannel(
  //   {
  //     channelId: 'default',
  //     channelName: 'Default Channel',
  //     importance: 4,
  //     vibrate: true,
  //   },
  //   (created) => console.log(`createChannel 'default' returned '${created}'`)
  // );
  // PushNotification.createChannel(
  //   {
  //     channelId: 'streak-reminder',
  //     channelName: 'Streak Reminder',
  //     importance: 4,
  //     vibrate: true,
  //   },
  //   (created) => console.log(`createChannel 'streak-reminder' returned '${created}'`)
  // );
};

export const requestAndroidNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: "Thinkly Notification Permission",
        message: "We need permission to send you updates.",
        buttonPositive: "OK",
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Notification permission granted.");
    }
  }
  return true;
};
