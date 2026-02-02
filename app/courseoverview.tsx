// app/course-overview.tsx
import { useCourseLength } from '@/src/contexts/CourseLengthContext';
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useTopic } from '@/src/contexts/TopicContext';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { Octicons } from '@expo/vector-icons';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '@services/firebaseConfig';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme'; // Custom hook for theme styles
import { generateCourseContent } from '../src/utility/openai'; // We'll create this next
import CourseGeneratingMessage from './components/CourseGeneratingMessage';

type CourseOverviewProps = {
  topic: string | null;
  onBack: () => void;
  onCourseCreated: (topic: string) => void;
  onCourseRemoved: () => void;
};

const premitivTopics = ['investing', 'mental health', 'relationships'];

export default function CourseOverview({ topic, onCourseCreated, onBack, onCourseRemoved }: CourseOverviewProps) {
  // const { topic } = useLocalSearchtopic();
  const { setTopic, topic: contextTopic } = useTopic();
  const topSpace = useSafeAreaInsets().top;
  const { t, language } = useLocalization();
  const { courseLength } = useCourseLength();
  const router = useRouter();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const [course, setCourse] = useState<FirebaseFirestoreTypes.DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  // const topicStr = Array.isArray(topic) ? topic[0] : topic;
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [topicStr, setTopicStr] = useState<string | null>(null);
  const user = auth().currentUser;
  const fetchCourse = async () => {
    let topicValue: string | null = null;

    // 1. Try to get topic from topic
    if (topic) {
      topicValue = Array.isArray(topic) ? topic[0] : topic;
      console.log("Using provided topic:", topicValue);
    }
    // else {
    //   // 2. Fallback: get user's topic from Firestore
    //   if (user) {
    //     // console.log("Fetching user topic from Firestore for user:", user.uid);
    //     // const userDoc = await getDoc(doc(db, 'userTopics', user.uid));
    //     // if (userDoc.exists()) {
    //     //   topicValue = userDoc.data().topic || null;
    //     //   console.log("Fetched topic from user document:", topicValue);
    //     // }

    //     const q = query(
    //       collection(db, 'userTopics'),
    //       where('userId', '==', user.uid),
    //       orderBy('createdAt', 'desc'),
    //       limit(1)
    //     );
    //     const querySnap = await getDocs(q);
    //     if (!querySnap.empty) {
    //       topicValue = querySnap.docs[0].data().topic;
    //       console.log("Fetched topic from user document:", topicValue);
    //     }
    //   }
    // }

    setTopicStr(topicValue);

    // If no topic, do nothing
    if (!topicValue) {
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Check if course exists in Firestore
      const courseRef = db.collection('courses').doc(`${user.uid}_${topicValue}`);
      const docSnap = await courseRef.get();
      if (docSnap.exists) {
        setCourse(docSnap.data());
      } else {
        setGenerating(true);
        const isCustomTopic = !premitivTopics.some(data => data?.toLowerCase() == topic?.toLowerCase());
        console.log("Course not found, generating new content for topic:", topicValue);
        const aiContent = await generateCourseContent(topicValue, courseLength, language);
        console.log("Generated AI content:", aiContent);
        const title = aiContent?.title ?? topicValue;
        const courseRef = db.collection('courses').doc(`${user.uid}_${title}`);
        // 3. Save to Firestore
        await courseRef.set({
          title: title,
          lessons: aiContent.lessons,
          progress: 0,
          createdAt: new Date(),
          userId: user.uid
        });

        // Increment `coursesCreated`
        const userRef = db.collection('users').doc(user.uid);
        if (isCustomTopic) {
          await userRef.update({
            coursesCreated: firestore.FieldValue.increment(1),
            customeCoursesCreated: firestore.FieldValue.increment(1),
          });
        } else {
          await userRef.update({
            coursesCreated: firestore.FieldValue.increment(1)
          });
        }
        setCourse(aiContent);
        onCourseCreated(title);
        setTopicStr(title);
      }
    } catch (error) {
      console.log("Error loading course:", error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCourse();
    }, [topic])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (contextTopic) setTopic(null);
    }, [contextTopic])
  );

  if (loading) {
    return (
      <View style={themedStyles.loadingcontainer}>
        <ActivityIndicator size="large" color={theme.xpFillColor} />
        {generating && <CourseGeneratingMessage />}
      </View>
    );
  }

  const lessons = Array.isArray(course?.lessons)
    ? course.lessons.filter(l => typeof l === 'object' && l !== null)
    : [];

  const filteredLessons =
    activeTab === 'ongoing'
      ? lessons.filter(l => l.progress !== 100)
      : lessons.filter(l => l.progress === 100);

  const allLessonCompleted = lessons?.length === lessons.filter(l => l.progress === 100)?.length;

  const onCourseRemove = async () => {
    try {
      Alert.alert(
        t.removeCourse,
        `${t?.removeCourseDesc} "${topicStr}" ${t?.course}.`,
        [
          { text: t?.no },
          {
            text: t?.yes, onPress: async () => {
              onBack();
              const courseRef = db.collection('courses').doc(`${user.uid}_${topicStr}`);
              await courseRef.delete();
              onCourseRemoved();
            }
          }
        ]
      )
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={[themedStyles.container, { paddingTop: topSpace }]}>
      {/* Header */}
      <TouchableOpacity onPress={onBack}>
        <Text style={themedStyles.backButton}>‹ {t?.back}</Text>
      </TouchableOpacity>
      <View style={themedStyles.header}>
        <Text style={themedStyles.title}>{t?.courseOverview}</Text>
        {
          topic && topic !== null &&
          <View style={themedStyles.topicContainer}>
            <Text style={themedStyles.topic} numberOfLines={2}>{topicStr}</Text>
            <TouchableOpacity style={{ paddingHorizontal: ResponsiveSizeWp(10), }} onPress={onCourseRemove}>
              <Octicons name="trash" size={ResponsiveSizeWp(25)} color={'#ff5252'} />
            </TouchableOpacity>
          </View>
        }
      </View>
      {/* Dashboard Tabs */}
      <View style={themedStyles.tabs}>
        {
          topic && topic !== null &&
          <>
            <TouchableOpacity
              activeOpacity={1}
              style={activeTab === 'ongoing' ? themedStyles.activeTab : themedStyles.tab}
              onPress={() => setActiveTab('ongoing')}
            >
              <Text style={activeTab === 'ongoing' ? themedStyles.activeTabText : themedStyles.tabText}>{t?.ongoing}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              style={activeTab === 'completed' ? themedStyles.activeTab : themedStyles.tab}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={activeTab === 'completed' ? themedStyles.activeTabText : themedStyles.tabText}>{t?.completed}</Text>
            </TouchableOpacity>
          </>
        }
      </View>

      {/* Course List */}
      {
        filteredLessons.length > 0 ?
          <FlatList
            data={filteredLessons}
            renderItem={({ item }) => {
              if (!item || typeof item !== 'object') return null;
              return (
                <TouchableOpacity
                  style={themedStyles.courseCard}
                  onPress={() => router.push({
                    pathname: '/lesson',
                    params: {
                      lessonId: item.id,
                      courseId: `${user?.uid}_${topicStr}`
                    }
                  })}
                  activeOpacity={1}
                  disabled={item?.progress >= 100}
                >
                  <View style={themedStyles.courseHeader}>
                    <Text style={themedStyles.courseTitle}>
                      {item.title ? String(item.title) : "Untitled"}
                    </Text>
                    <Text style={themedStyles.completion}>
                      {typeof item.progress === "number"
                        ? `${item.progress}% ${t?.completed}`
                        : `0% ${t?.completed}`}
                    </Text>
                  </View>
                  <View style={themedStyles.progressBar}>
                    <View
                      style={[
                        themedStyles.progressFill,
                        {
                          width:
                            typeof item.progress === "number" && !isNaN(item.progress)
                              ? `${item.progress}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <View style={themedStyles.continueButton}>
                    <Text style={themedStyles.continueText}>
                      {item.progress && item.progress > 0 ? item?.progress >= 100 ? t?.completed : t?.continue : t?.start}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item, index) => (item && item.id ? String(item.id) : `lesson-${index}`)}
            contentContainerStyle={{ paddingBottom: ResponsiveSizeWp(20), gap: ResponsiveSizeWp(20) }}
            style={{ flex: 1, }}
            showsVerticalScrollIndicator={false}
          />
          :
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: '10%', }}>
            {
              (topic && topic !== null) ?
                allLessonCompleted &&
                <>
                  <Text style={themedStyles.placeHolderText}>
                    {allLessonCompleted && t?.allLessonsAreFinished}
                  </Text>
                  <TouchableOpacity
                    style={themedStyles.emptyCourseCard}
                    onPress={() => router.push('/topicselection')}
                  >
                    <Text style={themedStyles.emptyCourseText}>{t?.createNewCourse}</Text>
                  </TouchableOpacity>
                </>
                :
                <>
                  <Text style={themedStyles.placeHolderText}>
                    {t?.noCourse}
                  </Text>
                  <TouchableOpacity
                    style={themedStyles.emptyCourseCard}
                    onPress={() => router.push('/topicselection')}
                  >
                    <Text style={themedStyles.emptyCourseText}>{t?.createNewCourse}</Text>
                  </TouchableOpacity>
                </>
            }
          </View>
      }
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  loadingcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ResponsiveSizeWp(20),
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    padding: ResponsiveSizeWp(16),
    paddingBottom: 0,
  },
  header: {
    marginBottom: ResponsiveSizeWp(24),
    marginTop: ResponsiveSizeWp(15),
  },
  backButton: {
    fontSize: ResponsiveSizeWp(22),
    color: theme.nameTextColor,
  },
  title: {
    fontSize: ResponsiveSizeWp(40),
    fontWeight: 'bold',
    color: theme.nameTextColor,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: ResponsiveSizeWp(20),
    borderBottomWidth: ResponsiveSizeWp(1),
    borderBottomColor: theme.borderColor,
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
  },
  activeTabText: {
    fontSize: ResponsiveSizeWp(14),
    color: theme.nameTextColor,
    fontWeight: 'bold',
  },
  courseCard: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
  },
  courseHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: ResponsiveSizeWp(8),
  },
  courseTitle: {
    fontSize: ResponsiveSizeWp(16),
    fontWeight: 'bold',
    color: theme.nameTextColor,
  },
  completion: {
    color: theme.levelTextColor,
    fontSize: ResponsiveSizeWp(14),
    textTransform: 'lowercase',
  },
  progressBar: {
    height: ResponsiveSizeWp(6),
    backgroundColor: theme.xpBarColor,
    borderRadius: ResponsiveSizeWp(3),
    marginBottom: ResponsiveSizeWp(16),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.xpFillColor,
    borderRadius: ResponsiveSizeWp(3),
  },
  continueButton: {
    backgroundColor: theme.xpFillColor,
    paddingVertical: ResponsiveSizeWp(10),
    borderRadius: ResponsiveSizeWp(8),
    alignItems: 'center',
  },
  continueText: {
    color: theme.cardBackgroundColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: ResponsiveSizeWp(1),
    paddingTop: ResponsiveSizeWp(5),
    borderTopColor: theme.borderColor,
  },
  navText: {
    color: theme.levelTextColor,
    fontSize: ResponsiveSizeWp(14)
  },
  activeNav: {
    color: theme.nameTextColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14)
  },
  topic: {
    fontSize: ResponsiveSizeWp(24),
    color: theme.nameTextColor,
    flex: 1,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeHolderText: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(14),
    opacity: 0.7,
  },
  emptyCourseCard: {
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(10),
    paddingHorizontal: ResponsiveSizeWp(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ResponsiveSizeWp(5),
    marginBottom: ResponsiveSizeWp(40),
  },
  emptyCourseText: {
    color: theme.nameTextColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(13),
  },
});