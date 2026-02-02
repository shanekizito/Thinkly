// app/(app)/settings.tsx
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../src/contexts/SettingsContext';
import { createNotificationChannels, requestNotificationPermissions, scheduleStreakReminder } from '../src/utility/notifications';

export default function Settings() {
  // ...existing hooks
  const topSpace = useSafeAreaInsets().top;
  const { t } = useLocalization();
  // Function to send a local notification
  const handleSendTestNotification = async () => {
    // On iOS, permissions must be checked/requested
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: requestStatus } = await Notifications.requestPermissionsAsync();
      if (requestStatus !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in settings');
        return;
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test!',
        sound: true,
      },
      trigger: null,
    });
  };

  const router = useRouter();
  const {
    theme,
    language,
    notifications,
    toggleTheme,
    setLanguage,
    toggleNotifications
  } = useSettings();
  
  const [reminderTime, setReminderTime] = useState('20:00');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'da', name: 'Dansk' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

    // Load saved reminder time
  useEffect(() => {
    createNotificationChannels();
    // Request notification permissions on mount
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
    const loadReminderTime = async () => {
      const savedTime = await AsyncStorage.getItem('@reminder_time');
      if (savedTime) {
        setReminderTime(savedTime);
        const [hours, minutes] = savedTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        setTempTime(date);
      }
    };
    loadReminderTime();
  }, []);

    // Enhanced notifications toggle
  const handleNotificationsToggle = async (value: boolean) => {
    setIsLoading(true);
    try {
      if (value) {
        const { localEnabled } = await requestNotificationPermissions();
        if (!localEnabled) {
          Alert.alert(t?.permissionRequired, t?.permissionRequiredDesc);
          return;
        }
      }
      
      await scheduleStreakReminder(value, reminderTime);
      toggleNotifications();
      await AsyncStorage.setItem('@notifications_enabled', String(value));
    } catch (error) {
      console.log('Notification toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time change (Android)
  const showAndroidTimePicker = () => {
    if (Platform.OS !== 'android') return;
    setShowTimePicker(true);
  };

    // Handle time change (iOS)
  const handleIosTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      Platform.OS === 'android' && setShowTimePicker(false);
      const newTime = `${selectedTime.getHours()}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      updateReminderTime(newTime);
      const [hours, minutes] = newTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      setTempTime(date);
    }
  };

  const updateReminderTime = async (newTime: string) => {
    setReminderTime(newTime);
    await AsyncStorage.setItem('@reminder_time', newTime);
    if (notifications) {
      await scheduleStreakReminder(true, newTime);
    }
  };

  // Format time for display
  const formatDisplayTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container,theme === 'dark' && styles.darkContainer,{paddingTop: topSpace + ResponsiveSizeWp(5)}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={ResponsiveSizeWp(24)} color={theme === 'dark' ? '#fff' : '#0f2b46'} />
        </TouchableOpacity>
        <Text style={[styles.title, theme === 'dark' && styles.darkText]}>{t?.settings}</Text>
        <View style={{ width: ResponsiveSizeWp(24) }} />
      </View>

      {/* Theme Setting */}
      <View style={[styles.settingItem, theme === 'dark' && styles.darkItem]}>
        <View style={styles.settingInfo}>
          <MaterialIcons name="palette" size={ResponsiveSizeWp(24)} color={theme === 'dark' ? '#fff' : '#0f2b46'} />
          <Text style={[styles.settingText, theme === 'dark' && styles.darkText]}>{t?.darkMode}</Text>
        </View>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          thumbColor={theme === 'dark' ? '#0f2b46' : '#f5f5f5'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>

      {/* Notifications */}
      <View style={[styles.settingItem, theme === 'dark' && styles.darkItem]}>
        <View style={styles.settingInfo}>
          <MaterialIcons name="notifications" size={ResponsiveSizeWp(24)} color={theme === 'dark' ? '#fff' : '#0f2b46'} />
          <View>
            <Text style={[styles.settingText, theme === 'dark' && styles.darkText]}>{t?.dailyReminders}</Text>
            {notifications && (
              <Text style={[styles.subText, theme === 'dark' && styles.darkSubText]}>
                {formatDisplayTime(reminderTime)}
              </Text>
            )}
          </View>
        </View>
        <Switch
          value={notifications}
          onValueChange={handleNotificationsToggle}
          disabled={isLoading}
          thumbColor={notifications ? '#0f2b46' : '#f5f5f5'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>

      {/* Time Picker (visible when notifications are enabled) */}
      {notifications && (
        <TouchableOpacity 
          style={[styles.timePickerButton, theme === 'dark' && styles.darkTimePicker]}
          onPress={() => Platform.OS === 'android' ? showAndroidTimePicker() : setShowTimePicker(true)}
        >
          <Text style={[styles.timePickerText, theme === 'dark' && styles.darkText]}>
            {t?.changeReminderTime}
          </Text>
          <MaterialIcons 
            name="schedule" 
            size={ResponsiveSizeWp(20)} 
            color={theme === 'dark' ? '#fff' : '#0f2b46'} 
          />
        </TouchableOpacity>
      )}

      {/* iOS Time Picker Modal */}
      {showTimePicker && (
        <>
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="spinner"
          onChange={handleIosTimeChange}
          textColor={theme === 'dark' ? '#fff' : '#000'}
          themeVariant={theme === 'dark' ? 'dark' : 'light'}
        />
        {
          Platform.OS === 'ios' &&
          <TouchableOpacity style={styles.doneButton} onPress={()=>{ setShowTimePicker(false); }}>
            <Text style={styles.doneButtonText}>{t?.done}</Text>
          </TouchableOpacity>
        }
        </>
      )}

      {/* Language Selection */}
      <TouchableOpacity
        style={[styles.settingItem, theme === 'dark' && styles.darkItem]}
        onPress={() => {router.push('/language-selector')}}
      >
        <View style={styles.settingInfo}>
          <MaterialIcons name="language" size={ResponsiveSizeWp(24)} color={theme === 'dark' ? '#fff' : '#0f2b46'} />
          <Text style={[styles.settingText, theme === 'dark' && styles.darkText]}>{t?.language}</Text>
        </View>
        <View 
          style={styles.languageButton}
        >
          <Text style={[styles.languageText, theme === 'dark' && styles.darkText]}>
            {languages.find(lang => lang.code === language)?.name || 'English'}
          </Text>
          <MaterialIcons 
            name="keyboard-arrow-right" 
            size={ResponsiveSizeWp(24)} 
            color={theme === 'dark' ? '#fff' : '#666'} 
          />
        </View>
      </TouchableOpacity>

      {/* Test Notification (for development) */}
      <TouchableOpacity
        style={[styles.testNotificationButton, theme === 'dark' && styles.darkButton]}
        onPress={handleSendTestNotification}
      >
        <Text style={[styles.testNotificationText, theme === 'dark' && styles.darkText]}>
          {t?.sendTestNotification}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f0e8',
    padding: ResponsiveSizeWp(16),
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ResponsiveSizeWp(24),
  },
  title: {
    fontSize: ResponsiveSizeWp(20),
    fontWeight: 'bold',
    color: '#0f2b46',
  },
  darkText: {
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    marginBottom: ResponsiveSizeWp(12),
    elevation: 2,
  },
  darkItem: {
    backgroundColor: '#1e1e1e',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ResponsiveSizeWp(16),
  },
  settingText: {
    fontSize: ResponsiveSizeWp(16),
    color: '#0f2b46',
  },
  subText: {
    fontSize: ResponsiveSizeWp(12),
    color: '#666',
    marginTop: ResponsiveSizeWp(4),
  },
  darkSubText: {
    color: '#aaa',
  },
  timePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    marginBottom: ResponsiveSizeWp(12),
    elevation: 2,
  },
  darkTimePicker: {
    backgroundColor: '#1e1e1e',
  },
  timePickerText: {
    fontSize: ResponsiveSizeWp(16),
    color: '#0f2b46',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: ResponsiveSizeWp(16),
    color: '#666',
    marginRight: ResponsiveSizeWp(8),
  },
  testNotificationButton: {
    backgroundColor: '#0f2b46',
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    alignItems: 'center',
    marginTop: ResponsiveSizeWp(24),
  },
  darkButton: {
    backgroundColor: '#007aff',
  },
  testNotificationText: {
    color: '#fff',
    fontSize: ResponsiveSizeWp(16),
    fontWeight: 'bold',
  },
  doneButton:{
    backgroundColor: '#007aff',
    marginBottom:ResponsiveSizeWp(15),
    marginTop:-ResponsiveSizeWp(10),
    alignItems:'center',
    justifyContent:'center',
    borderRadius:ResponsiveSizeWp(10),
    width:'70%',
    alignSelf:'center',
  },
  doneButtonText:{
    padding:ResponsiveSizeWp(10),
    color:'#FFF',
    fontSize: ResponsiveSizeWp(16),
    fontWeight: 'bold',
  },
});