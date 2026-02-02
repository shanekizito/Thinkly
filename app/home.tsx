
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useBadges } from '@/src/hooks/useBadges';
import { ResponsiveSizeWp, screenWidth } from '@/src/utility/responsive';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { generatePersonalizedChallenge } from '../src/features/dailyChallenge';
import { useTheme } from '../src/hooks/useTheme';

type Challenge = {
  id: string;
  question: string;
  options: string[];
  reward: number;
  completed?: boolean;
  answer?: string;
};

type HomeProps = {
  userData: any;
  courses: { id: string;[key: string]: any }[];
  onCoursePress: (topic: string) => void;
};


export default function Home({ userData, courses, onCoursePress }: HomeProps) {
  const topSpace = useSafeAreaInsets().top;
  const { t } = useLocalization();
  const { achivedBadges, addBadge } = useBadges();
  const router = useRouter();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const { user } = useAuth();
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // Fetch user data and courses
  useEffect(() => {
    if (!user) return;
    // Fetch daily challenge (mock data)
    const loadChallenge = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const challengeRef = db.collection('challenges').doc(`${user.uid}_${today}`);
        // Check for existing challenge first
        const existing = await challengeRef.get();
        if (existing.exists) {
          setDailyChallenge(existing.data() as Challenge);
        } else {
          // Generate and save new personalized challenge
          const newChallenge = await generatePersonalizedChallenge();
          console.log("No existing challenge found, generating a new one.");
          await challengeRef.set({
            ...newChallenge,
            userId: user.uid, // <-- required by your rules
            topic: newChallenge.topic || "General Knowledge", // <-- required by your rules
          });
          setDailyChallenge(newChallenge);
        }
      } catch (error) {
        console.log("Challenge error:", error);
      }
    };
    loadChallenge();
  }, [user]);

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 600) + 1;
  };

  const handleAnswerSubmit = async (option: string) => {
    if (!dailyChallenge || dailyChallenge.completed) return;
    if (!user) return;

    setSelectedOption(option);
    const isCorrect = dailyChallenge.answer === option;

    // Fetch user data for streak logic
    const userRef = db.collection('users').doc(user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    let newStreak = 1;
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    if (userData?.lastCompleted) {
      const lastDate = userData.lastCompleted;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === yesterday) {
        newStreak = (userData.streak || 0) + 1;
      } else if (lastDate === today) {
        newStreak = userData.streak || 1;
      }
    }
    setDailyChallenge(prev => prev ? { ...prev, completed: true } : null);
    Alert.alert(
      isCorrect ? t?.correct : t?.tryAgain,
      isCorrect
        ? `${t?.youEarned} ${dailyChallenge.reward} XP!`
        : t?.theCorrectAnswerWas + " " + dailyChallenge.answer
    );
    var streak = 0;
    var xp = 0;
    const days = userData?.days ? (userData?.days + 1) : 1;
    if (isCorrect) {
      streak = newStreak;
      xp = dailyChallenge.reward;
    }
    await userRef.update({
      xp: firestore.FieldValue.increment(xp),
      streak: streak,
      lastCompleted: today,
      days: days,
    });
    const challengeRef = db.collection('challenges').doc(`${user.uid}_${today}`);
    await challengeRef.update({ completed: true });

    if (!achivedBadges.some(badge => badge == 'week-one') && days >= 7) addBadge('week-one');
    if (!achivedBadges.some(badge => badge == 'streak-starter') && streak >= 3) addBadge('streak-starter');
    if (!achivedBadges.some(badge => badge == 'dedicated') && streak >= 7) addBadge('dedicated');
  };

  return (
    <ScrollView
      style={themedStyles.container}
      contentContainerStyle={[themedStyles.contentContainer, { paddingTop: topSpace + ResponsiveSizeWp(15) }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* User Status Section */}
      <View style={themedStyles.statusCard}>
        <Image
          source={{ uri: userData?.photoURL || user?.photoURL || 'https://ui-avatars.com/api/?name=Thinker&background=0D8ABC&color=fff&size=128' }}
          style={themedStyles.avatar}
        />
        <View style={themedStyles.statusText}>
          <Text style={themedStyles.username}>{user?.displayName || 'Thinker'}</Text>

          {/* Streak Display */}
          <View style={themedStyles.streakContainer}>
            <Ionicons name="flame" size={ResponsiveSizeWp(20)} style={themedStyles.streakIcon} />
            <Text style={themedStyles.streakText}>
              {userData?.streak || 0} {t?.dayStreak}
            </Text>
          </View>

          <Text style={themedStyles.level}>{t?.level} {calculateLevel(userData?.xp || 0)}</Text>
          <View style={themedStyles.xpBar}>
            <View style={[themedStyles.xpFill, { width: `${(userData?.xp % 600) / 6}%` }]} />
          </View>
          <Text style={themedStyles.xpText}>{userData?.xp || 0} XP</Text>
        </View>
      </View>

      {/* Ongoing Courses */}
      <Text style={themedStyles.sectionTitle}>{t?.yourCourses}</Text>

      <View style={themedStyles.coursesContainer}>
        <FlatList
          horizontal
          data={courses?.filter(course => course?.progress < 100)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={themedStyles.courseCard}
              onPress={() => onCoursePress(item.title)}
            >
              <Text style={themedStyles.courseTitle} numberOfLines={2} ellipsizeMode='middle'>{item.title}</Text>
              <View style={{ flex: 1 }} />
              <Text style={themedStyles.courseProgress}>{item.progress}% {t?.completed}</Text>
              <View style={themedStyles.courseProgressBar}>
                <View style={[themedStyles.courseProgressFill, { width: `${item.progress || 0}%` }]} />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          style={{ width: screenWidth, left: -ResponsiveSizeWp(16), marginVertical: -ResponsiveSizeWp(5) }}
          contentContainerStyle={[themedStyles.coursesContainer, { paddingHorizontal: ResponsiveSizeWp(16), paddingVertical: ResponsiveSizeWp(5), }]}
          showsHorizontalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          scrollEnabled={courses?.filter(course => course?.progress < 100)?.length > 2 || Platform.OS === 'ios'}
        />
      </View>

      <TouchableOpacity
        style={themedStyles.emptyCourseCard}
        onPress={() => router.push('/topicselection')}
      >
        <Text style={themedStyles.emptyCourseText}>+ {t?.createNewCourse}</Text>
      </TouchableOpacity>

      {/* Daily Challenge Section */}
      <Text style={themedStyles.sectionTitle}>{t?.dailyChallenge}</Text>
      <View style={themedStyles.challengeCard}>
        {dailyChallenge ? (
          <>
            <Text style={themedStyles.challengeQuestion}>{dailyChallenge.question}</Text>

            {dailyChallenge.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  themedStyles.optionButton,
                  dailyChallenge.completed && {
                    borderWidth: ResponsiveSizeWp(1),
                    borderColor: option === dailyChallenge.answer ? '#4CAF50' : '#FF5252',
                  },
                  selectedOption === option && {
                    borderWidth: ResponsiveSizeWp(2),
                    borderColor: selectedOption === dailyChallenge.answer ? '#4CAF50' : '#FF5252'
                  }
                ]}
                onPress={() => !dailyChallenge.completed && handleAnswerSubmit(option)}
                disabled={dailyChallenge.completed || !!selectedOption}
              >
                <Text style={themedStyles.optionText}>{option}</Text>
                {dailyChallenge.completed && option === dailyChallenge.answer && option === selectedOption && (
                  <Text style={themedStyles.correctMark}>✓</Text>
                )}
                {dailyChallenge.completed && option !== dailyChallenge.answer && option === selectedOption && (
                  <Text style={themedStyles.incorrectMark}>X</Text>
                )}
              </TouchableOpacity>
            ))}

            {!dailyChallenge.completed ? (
              <Text style={themedStyles.challengeReward}>+{dailyChallenge.reward} XP</Text>
            ) : (
              <Text style={themedStyles.completedText}>{t?.completed} ✓</Text>
            )}
          </>
        ) : (
          <ActivityIndicator color={theme.xpFillColor} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  contentContainer: {
    padding: ResponsiveSizeWp(16),
    gap: ResponsiveSizeWp(16),
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    alignItems: 'center',
    elevation: ResponsiveSizeWp(2),
    gap: ResponsiveSizeWp(16),
  },
  avatar: {
    width: ResponsiveSizeWp(60),
    aspectRatio: 1 / 1,
    borderRadius: ResponsiveSizeWp(60),
  },
  statusText: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: ResponsiveSizeWp(18),
    fontWeight: 'bold',
    color: theme.nameTextColor,
  },
  level: {
    fontSize: ResponsiveSizeWp(14),
    color: theme.levelTextColor,
    marginTop: ResponsiveSizeWp(4),
  },
  xpBar: {
    height: ResponsiveSizeWp(6),
    backgroundColor: theme.xpBarColor,
    borderRadius: ResponsiveSizeWp(3),
    marginTop: ResponsiveSizeWp(8),
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: theme.xpFillColor,
  },
  xpText: {
    fontSize: ResponsiveSizeWp(12),
    color: theme.nameTextColor,
    marginTop: ResponsiveSizeWp(4),
  },
  sectionTitle: {
    fontSize: ResponsiveSizeWp(18),
    fontWeight: 'bold',
    color: theme.nameTextColor,
    marginBottom: -ResponsiveSizeWp(7),
  },
  coursesContainer: {
    gap: ResponsiveSizeWp(12),
  },
  courseCard: {
    width: ResponsiveSizeWp(160),
    height: ResponsiveSizeWp(100),
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(12),
    elevation: ResponsiveSizeWp(2),
  },
  emptyCourseCard: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(14),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: ResponsiveSizeWp(2),
  },
  emptyCourseText: {
    color: theme.nameTextColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  courseTitle: {
    fontSize: ResponsiveSizeWp(15),
    fontWeight: 'bold',
    color: theme.nameTextColor,
    marginBottom: ResponsiveSizeWp(8),
  },
  courseProgress: {
    fontSize: ResponsiveSizeWp(14),
    color: theme.levelTextColor,
    textTransform: 'lowercase',
  },
  challengeCard: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    elevation: ResponsiveSizeWp(2),
  },
  challengeQuestion: {
    fontSize: ResponsiveSizeWp(16),
    color: theme.nameTextColor,
    marginBottom: ResponsiveSizeWp(12),
  },
  optionText: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(14),
  },
  challengeReward: {
    color: theme.successColor,
    fontWeight: 'bold',
    marginTop: ResponsiveSizeWp(8),
    textAlign: 'right',
    fontSize: ResponsiveSizeWp(14)
  },
  courseProgressBar: {
    height: ResponsiveSizeWp(6),
    backgroundColor: theme.xpBarColor,
    borderRadius: ResponsiveSizeWp(3),
    marginTop: ResponsiveSizeWp(6),
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: theme.xpFillColor,
    borderRadius: ResponsiveSizeWp(3),
  },
  optionButton: {
    backgroundColor: theme.optionColor,
    borderRadius: ResponsiveSizeWp(8),
    padding: ResponsiveSizeWp(12),
    marginBottom: ResponsiveSizeWp(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  correctMark: {
    color: theme.successColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  incorrectMark: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  completedText: {
    color: theme.successColor,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: ResponsiveSizeWp(8),
    fontSize: ResponsiveSizeWp(14),
  },
  // Add to your StyleSheet
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ResponsiveSizeWp(4),
  },
  streakIcon: {
    color: theme.streakColor,
    marginRight: ResponsiveSizeWp(6),
  },
  streakText: {
    color: theme.streakColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  xpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ResponsiveSizeWp(8),
  },
});