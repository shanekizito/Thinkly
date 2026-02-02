// app/profile.tsx
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useSettings } from '@/src/contexts/SettingsContext';
import { createNotificationChannels, requestNotificationPermissions, scheduleStreakReminder } from '@/src/utility/notifications';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/hooks/useTheme';

const API_URL = 'https://europe-central2-thinkly-firebase-app-85965.cloudfunctions.net/api';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'da', name: 'Dansk' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

const tabs = ['onging', 'completed'];

interface ProfileProps {
  userData: FirebaseFirestoreTypes.DocumentData | undefined;
  courses: { id: string;[key: string]: any }[];
  onCoursePress: (topic: string) => void;
}

export default function Profile({ userData, courses, onCoursePress }: ProfileProps) {
  const topSpace = useSafeAreaInsets().top;
  const { t } = useLocalization();
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const [uploading, setUploading] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [activeTabs, setActiveTabs] = useState([tabs[0]]);


  const {
    theme: themeMode,
    language,
    notifications,
    toggleTheme,
    setLanguage,
    toggleNotifications
  } = useSettings();

  useEffect(() => {
    Appearance.setColorScheme(themeMode);
  }, [themeMode])

  const timeCalculation = (date: Date) => {
    const lastSubscriptionDate = date;
    const now = new Date();

    const diffMs = now - lastSubscriptionDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const isOlderThan30Days = diffDays > 30;
    return isOlderThan30Days;
  }

  const subsciptionEnd = userData?.lastSubscriptionTime ? timeCalculation(userData?.lastSubscriptionTime?.toDate()) : false;
  const isPlanActive = userData?.subscriptionStatus === 'active' && !subsciptionEnd;

  const handleLogout = async () => {
    try {
      await auth().signOut();
      router.replace('/');
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const unsubscribePlan = async () => {
    try {
      setLoading(true);
      const user = userData;

      const response = await fetch(`${API_URL}/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user?.stripeCustomerId }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(t?.success, t?.unsubscribePlanSuccess);
      } else {
        Alert.alert(t?.error, data.error);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(t?.error, t?.unsubscribePlanFailed);
    } finally {
      setLoading(false);
    }
  }

  const handleUnsubscribePlan = async () => {
    Alert.alert(
      t?.unsubscribePlanTitle,
      t?.unsubscribePlanDesc,
      [
        { text: t?.no },
        { text: t?.yes, onPress: unsubscribePlan }
      ]
    );
  }

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


  const handleAvatarChange = async () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7 },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(t?.error, response.errorMessage || t?.imagePickerError);
          return;
        }
        const uri = response.assets?.[0]?.uri;
        if (!uri || !user) return;

        setUploading(true);
        try {
          // Save local URI to Firestore
          const userDoc = db.collection('users').doc(user.uid);
          await userDoc.update({ photoURL: uri });

          // Optionally update auth user profile (if needed)
          if (auth().currentUser) {
            await auth().currentUser.updateProfile({ photoURL: uri });
          }

          Alert.alert(t?.success, t?.avatarUpdated);
        } catch (error) {
          Alert.alert(t?.error, t?.failedToUpdateAvatar);
          console.log(error);
        }
        setUploading(false);
      }
    );
  };


  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 600) + 1;
  };

  const stats = {
    xp: userData?.xp || 0,
    level: calculateLevel(userData?.xp || 0),
    ongoingCourses: courses.filter(course => course.progress !== 100).length,
    completedCourses: courses.filter(course => course.progress === 100).length,
    badges: userData?.badges?.length || 0,
  };

  const showPicker = () => {
    setShowTimePicker(true);
  };

  const hidePicker = () => {
    setShowTimePicker(false);
  };

  const handleConfirm = (datetime: Date) => {
    if (datetime) {
      const newTime = `${datetime.getHours()}:${datetime.getMinutes().toString().padStart(2, '0')}`;
      updateReminderTime(newTime);
      const [hours, minutes] = newTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      setTempTime(date);
      hidePicker();
    }
  };

  const filteredCourse = activeTabs.length === 1 ?
    activeTabs[0] === tabs[1] ?
      courses.filter((course) => course.progress === 100) :
      courses.filter((course) => course.progress < 100) :
    courses;

  const handleTabSelection = (tab: string) => {
    if (activeTabs.some(value => value === tab)) {
      setActiveTabs(pre => pre.filter(value => value !== tab));
    } else {
      setActiveTabs(pre => ([...pre, tab]));
    }
  }

  return (
    <View style={[themedStyles.container, { paddingTop: topSpace }]}>
      {/* Header */}
      <View style={themedStyles.header}>
        <Image
          source={theme.backgroundColor === '#121212' ? require('../assets/logo-dark.png') : require('../assets/logo.png')}
          style={themedStyles.logo}
        />
        <Text style={themedStyles.appName}>{t?.appName}</Text>
        <TouchableOpacity style={themedStyles.settingsButton} onPress={() => router.push('/settings')}>
          <MaterialIcons name="settings" size={ResponsiveSizeWp(30)} color={theme.nameTextColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={themedStyles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <View style={themedStyles.profileSection}>
          <TouchableOpacity
            style={themedStyles.avatarContainer}
            onPress={handleAvatarChange}
            disabled={uploading}
          >
            <Image
              source={{ uri: userData?.photoURL || user?.photoURL || 'https://ui-avatars.com/api/?name=Thinker&background=0D8ABC&color=fff&size=128' }}
              style={themedStyles.avatar}
            />
            <View style={themedStyles.cameraIcon}>
              <FontAwesome name="camera" size={ResponsiveSizeWp(16)} color="#fff" />
            </View>
            {uploading && (
              <ActivityIndicator
                style={{ position: 'absolute', top: ResponsiveSizeWp(40), left: ResponsiveSizeWp(40) }}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          <Text style={themedStyles.userName}>{user?.displayName ?? 'James Martin'}</Text>

          <View style={themedStyles.levelContainer}>
            <Text style={themedStyles.levelText}>{stats.xp} XP</Text>
            <Text style={themedStyles.levelBadge}>{t?.level} {stats.level}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={themedStyles.statsContainer}>
          <TouchableOpacity style={[themedStyles.statCard, activeTabs.some((tab) => tab === tabs[0]) && { borderWidth: ResponsiveSizeWp(1), borderColor: theme.nameTextColor, }]} onPress={() => { handleTabSelection(tabs[0]) }}>
            <Text style={themedStyles.statNumber}>{stats.ongoingCourses}</Text>
            <Text style={themedStyles.statLabel} numberOfLines={1}>{t?.ongoing}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[themedStyles.statCard, activeTabs.some((tab) => tab === tabs[1]) && { borderWidth: ResponsiveSizeWp(1), borderColor: theme.nameTextColor, }]} onPress={() => { handleTabSelection(tabs[1]) }}>
            <Text style={themedStyles.statNumber}>{stats.completedCourses}</Text>
            <Text style={themedStyles.statLabel} numberOfLines={1}>{t?.completed}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={themedStyles.statCard} onPress={() => router.push('/badgesScreen')}>
            <Text style={themedStyles.statNumber}>{stats.badges}</Text>
            <Text style={themedStyles.statLabel} numberOfLines={1}>{t?.badges}</Text>
          </TouchableOpacity>
        </View>

        {/* Courses Section */}
        <Text style={themedStyles.sectionTitle}>{t?.yourCourses}</Text>
        {/* <View style={themedStyles.courseTabs}>
          {
            tabs.map((tab,i)=>
              <TouchableOpacity 
              key={i}
              onPress={()=>{setActiveTab(tab)}}
              activeOpacity={1}
              style={activeTab === tab ? themedStyles.activeTab : themedStyles.tab}
              >
                <Text style={activeTab === tab ? themedStyles.activeTabText : themedStyles.tabText}>
                  {tab}
                </Text>
              </TouchableOpacity>
            )
          }
        </View> */}

        <View style={themedStyles.coursesContainer}>
          {filteredCourse.length === 0 ? (
            <Text style={{ color: '#666', fontSize: ResponsiveSizeWp(14), }}>{t?.noCourses}</Text>
          ) : (
            filteredCourse.map(course => (
              <CoursePill
                key={course.id}
                name={course.title || course.name || 'Untitled'}
                completed={course.progress === 100}
                themedStyles={themedStyles}
                onPress={onCoursePress}
              />
            )))}
        </View>

        {/* Preferences Section */}
        <Text style={themedStyles.sectionTitle}>{t?.preferences}</Text>
        <View style={themedStyles.preferencesContainer}>
          {/* <PreferenceItem icon="notifications" title={t?.notifications} themedStyles={themedStyles} /> */}

          <View style={[themedStyles.settingItem, themeMode === 'dark' && themedStyles.darkItem]}>
            <View style={themedStyles.settingInfo}>
              <MaterialIcons name="notifications" size={ResponsiveSizeWp(24)} color={themeMode === 'dark' ? '#fff' : '#0f2b46'} />
              <View>
                <Text style={[themedStyles.settingText, themeMode === 'dark' && themedStyles.darkText]}>{t?.notifications}</Text>
                {notifications && (
                  <Text style={[themedStyles.subText, themeMode === 'dark' && themedStyles.darkSubText]}>
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

          {
            notifications &&
            <TouchableOpacity
              style={[themedStyles.timePickerButton, themeMode === 'dark' && themedStyles.darkTimePicker]}
              onPress={showPicker}
            >
              <Text style={[themedStyles.timePickerText, themeMode === 'dark' && themedStyles.darkText]}>
                {t?.changeReminderTime}
              </Text>
              <MaterialIcons
                name="schedule"
                size={ResponsiveSizeWp(20)}
                color={themeMode === 'dark' ? '#fff' : '#0f2b46'}
              />
            </TouchableOpacity>
          }

          <DateTimePicker
            value={tempTime}
            isVisible={showTimePicker}
            mode="time"
            display="spinner"
            onConfirm={handleConfirm}
            onCancel={hidePicker}
            buttonTextColorIOS={themeMode === 'dark' ? '#fff' : '#000'}
            themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
          />

          <View style={themedStyles.line} />

          {/* Language */}
          <TouchableOpacity
            style={[themedStyles.settingItem, themeMode === 'dark' && themedStyles.darkItem]}
            onPress={() => { router.push('/language-selector') }}
          >
            <View style={themedStyles.settingInfo}>
              <MaterialIcons name="language" size={ResponsiveSizeWp(24)} color={themeMode === 'dark' ? '#fff' : '#0f2b46'} />
              <Text style={[themedStyles.settingText, themeMode === 'dark' && themedStyles.darkText]}>{t?.language}</Text>
            </View>
            <View
              style={themedStyles.languageButton}
            >
              <Text style={[themedStyles.languageText, themeMode === 'dark' && themedStyles.darkText]}>
                {languages.find(lang => lang.code === language)?.name || 'English'}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={ResponsiveSizeWp(24)}
                color={themeMode === 'dark' ? '#fff' : '#666'}
              />
            </View>
          </TouchableOpacity>

          <View style={themedStyles.line} />

          {/* Theme */}
          <View style={[themedStyles.settingItem, themeMode === 'dark' && themedStyles.darkItem]}>
            <View style={themedStyles.settingInfo}>
              <MaterialIcons name="palette" size={ResponsiveSizeWp(24)} color={themeMode === 'dark' ? '#fff' : '#0f2b46'} />
              <Text style={[themedStyles.settingText, themeMode === 'dark' && themedStyles.darkText]}>{t?.theme}</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              thumbColor={themeMode === 'dark' ? '#0f2b46' : '#f5f5f5'}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>
        </View>

        {/* Unsubscribe Button */}
        {
          isPlanActive &&
          <TouchableOpacity
            style={[themedStyles.logoutButton, { marginTop: 0, flexDirection: 'row', gap: ResponsiveSizeWp(10), alignItems: 'center', justifyContent: 'center', }]}
            onPress={handleUnsubscribePlan}
            disabled={loading}
          >
            <Text style={themedStyles.logoutText}>{t?.unsubscribePlan}</Text>
            {loading && <ActivityIndicator color={'#ff5252'} size={'small'} />}
          </TouchableOpacity>
        }

        {/* Logout Button */}
        <TouchableOpacity style={themedStyles.logoutButton} onPress={handleLogout}>
          <Text style={themedStyles.logoutText}>{t?.logOut}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

type CoursePillProps = {
  completed: boolean;
  name: string;
  themedStyles: ReturnType<typeof styles>;
  onPress: (title: string) => void;
};

const CoursePill: React.FC<CoursePillProps> = ({ name, completed, themedStyles, onPress }) => (
  <TouchableOpacity
    style={[themedStyles.coursePill, completed && themedStyles.completedPill]}
    onPress={() => { onPress(name) }}
  >
    <Text style={[themedStyles.courseName, completed && themedStyles.completedText]}>
      {name}
    </Text>
    {completed && <FontAwesome name="check" size={ResponsiveSizeWp(12)} color="#4CAF50" />}
  </TouchableOpacity>
);

type PreferenceItemProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  themedStyles: ReturnType<typeof styles>;
};

const PreferenceItem: React.FC<PreferenceItemProps> = ({ icon, title, themedStyles }) => (
  <TouchableOpacity style={themedStyles.preferenceItem}>
    <MaterialIcons name={icon} size={ResponsiveSizeWp(24)} style={themedStyles.icon} />
    <Text style={themedStyles.preferenceText}>{title}</Text>
    <MaterialIcons
      name="keyboard-arrow-right"
      size={ResponsiveSizeWp(24)}
      color="#666"
      style={{ marginLeft: 'auto' }}
    />
  </TouchableOpacity>
);

// themedStyles
const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    padding: ResponsiveSizeWp(16),
    paddingBottom: 0, // To avoid content being hidden behind the bottom bar
    paddingTop: ResponsiveSizeWp(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ResponsiveSizeWp(16),
    paddingTop: 0,
    borderBottomWidth: ResponsiveSizeWp(1),
    borderBottomColor: theme.borderColor,
  },
  logo: {
    width: ResponsiveSizeWp(52),
    height: ResponsiveSizeWp(52),
    borderWidth: 0,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: ResponsiveSizeWp(40),
    fontWeight: 'bold',
    color: theme.nameTextColor,
  },
  settingsButton: {
    padding: ResponsiveSizeWp(4),
  },
  scrollContent: {
    padding: ResponsiveSizeWp(16),
    gap: ResponsiveSizeWp(20),
    paddingBottom: ResponsiveSizeWp(40),
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: ResponsiveSizeWp(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatar: {
    width: ResponsiveSizeWp(100),
    height: ResponsiveSizeWp(100),
    borderRadius: ResponsiveSizeWp(50),
    borderWidth: ResponsiveSizeWp(3),
    borderColor: theme.xpFillColor,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.xpFillColor,
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userName: {
    fontSize: ResponsiveSizeWp(24),
    fontWeight: 'bold',
    color: theme.nameTextColor,
    marginBottom: ResponsiveSizeWp(10),
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ResponsiveSizeWp(8),
  },
  levelText: {
    fontSize: ResponsiveSizeWp(16),
    color: theme.levelTextColor,
  },
  levelBadge: {
    backgroundColor: theme.xpFillColor,
    color: '#fff',
    paddingHorizontal: ResponsiveSizeWp(12),
    paddingVertical: ResponsiveSizeWp(4),
    borderRadius: ResponsiveSizeWp(12),
    fontSize: ResponsiveSizeWp(14),
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: ResponsiveSizeWp(16),
  },
  statCard: {
    flex: 1,
    aspectRatio: 1.2 / 1,
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    justifyContent: 'center',
    alignItems: 'center',
    gap: ResponsiveSizeWp(5),
    paddingHorizontal: ResponsiveSizeWp(5),
    elevation: 2,
  },
  statNumber: {
    fontSize: DeviceInfo.isTablet() ? ResponsiveSizeWp(40) : ResponsiveSizeWp(24),
    fontWeight: 'bold',
    color: theme.nameTextColor,
  },
  statLabel: {
    fontSize: ResponsiveSizeWp(12),
    color: theme.levelTextColor,
  },
  sectionTitle: {
    fontSize: ResponsiveSizeWp(18),
    fontWeight: 'bold',
    color: theme.nameTextColor,
    marginBottom: -ResponsiveSizeWp(12),
  },
  coursesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ResponsiveSizeWp(8),
  },
  coursePill: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(20),
    paddingHorizontal: ResponsiveSizeWp(16),
    paddingVertical: ResponsiveSizeWp(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ResponsiveSizeWp(6),
    elevation: 1,
  },
  completedPill: {
    borderWidth: ResponsiveSizeWp(1),
    borderColor: '#4CAF50',
  },
  courseName: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(14)
  },
  completedText: {
    color: '#4CAF50',
    fontSize: ResponsiveSizeWp(14)
  },
  preferencesContainer: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    elevation: 2,
    padding: ResponsiveSizeWp(8),
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ResponsiveSizeWp(16),
    borderBottomWidth: ResponsiveSizeWp(1),
    borderRadius: ResponsiveSizeWp(12),
    borderBottomColor: theme.optionColor,
  },
  preferenceText: {
    marginLeft: ResponsiveSizeWp(16),
    fontSize: ResponsiveSizeWp(16),
    color: theme.nameTextColor,
  },
  logoutButton: {
    backgroundColor: theme.cardBackgroundColor,
    borderWidth: ResponsiveSizeWp(1),
    borderColor: '#ff5252',
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    alignItems: 'center',
    elevation: 2,
    marginTop: ResponsiveSizeWp(20),
  },
  logoutText: {
    color: '#ff5252',
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  icon: {
    color: theme.nameTextColor,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
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
  darkText: {
    color: '#fff',
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
  line: {
    height: ResponsiveSizeWp(1),
    width: '100%',
    borderRadius: ResponsiveSizeWp(12),
    backgroundColor: theme.optionColor,
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
  },
  darkTimePicker: {
    backgroundColor: '#1e1e1e',
  },
  timePickerText: {
    fontSize: ResponsiveSizeWp(16),
    color: '#0f2b46',
  },
  doneButton: {
    backgroundColor: '#007aff',
    marginBottom: ResponsiveSizeWp(15),
    marginTop: -ResponsiveSizeWp(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ResponsiveSizeWp(10),
    width: '70%',
    alignSelf: 'center',
  },
  doneButtonText: {
    padding: ResponsiveSizeWp(10),
    color: '#FFF',
    fontSize: ResponsiveSizeWp(16),
    fontWeight: 'bold',
  },
  courseTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tab: {
    paddingBottom: ResponsiveSizeWp(8),
    marginRight: ResponsiveSizeWp(16),
  },
  activeTab: {
    paddingBottom: ResponsiveSizeWp(8),
    borderBottomWidth: ResponsiveSizeWp(2),
    borderBottomColor: theme.nameTextColor,
    marginRight: ResponsiveSizeWp(16),
  },
  tabText: {
    color: theme.levelTextColor,
    fontSize: ResponsiveSizeWp(14),
    textTransform: 'capitalize',
  },
  activeTabText: {
    fontSize: ResponsiveSizeWp(14),
    color: theme.nameTextColor,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});