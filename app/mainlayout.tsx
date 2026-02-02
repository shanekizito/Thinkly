import { useTopic } from '@/src/contexts/TopicContext';
import { useBadges } from '@/src/hooks/useBadges';
import { BOTTOM_TAB_HEIGHT } from '@/src/utility/responsive';
import BottomBar from '@components/BottomBar';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/hooks/useTheme';
import CourseOverview from './courseoverview';
import Home from './home';
import Profile from './profile';

export default function MainLayout() {
  const { topic } = useTopic();
  const [active, setActive] = useState<'home' | 'overview' | 'profile'>('home');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { user } = useAuth();
  const { achivedBadges, addBadge } = useBadges();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const [courses, setCourses] = useState<{ id: string;[key: string]: any }[]>([]);
  const [userData, setUserData] = useState<FirebaseFirestoreTypes.DocumentData | undefined>(undefined);

  let Content;

  // Fetch user data and courses
  useEffect(() => {
    if (!user) return;
    // User data listener
    const userRef = db.collection('users').doc(user.uid);
    const unsubscribeUser = userRef.onSnapshot((doc) => {
      if (doc?.data()?.customeCoursesCreated == undefined || doc?.data()?.customeCoursesCreated == null) {
        userRef.update({ customeCoursesCreated: 0 });
      }
      if (!doc?.data()?.badges?.some((badge: string) => badge == 'curious-mind') && doc?.data()?.customeCoursesCreated >= 3) addBadge('curious-mind');
      setUserData(doc.data());
    });

    // Courses listener
    const unsubscribeCourses = db.collection('courses')
      .where('userId', '==', user.uid)
      .onSnapshot((snapshot) => {
        const completedCourses = snapshot?.docs?.filter(data => data.data().progress >= 100)?.length ?? 0;
        if (!achivedBadges.some((badge: string) => badge == 'super-learner') && completedCourses >= 5) addBadge('super-learner');
        setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) ?? []);
      });

    return () => {
      unsubscribeUser();
      unsubscribeCourses();
    };
  }, [user]);

  useEffect(() => {
    if (topic && topic != null) {
      setSelectedTopic(topic);
      setActive('overview');
    }
  }, [topic]);

  if (active === 'home') Content = <Home userData={userData} courses={courses} onCoursePress={(topic) => { setSelectedTopic(topic); setActive('overview'); }} />;
  else if (active === 'overview') Content = <CourseOverview topic={selectedTopic ? selectedTopic : courses[0]?.title} onCourseCreated={setSelectedTopic} onBack={() => setActive('home')} onCourseRemoved={() => { setSelectedTopic(null) }} />;
  else Content = <Profile userData={userData} courses={courses} onCoursePress={(topic) => { setSelectedTopic(topic); setActive('overview'); }} />;

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.content}>
        {Content}
      </View>
      <View style={themedStyles.bottomBarWrapper}>
        <BottomBar active={active} onTabPress={setActive} />
      </View>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: BOTTOM_TAB_HEIGHT },
  bottomBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.cardBackgroundColor,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
});