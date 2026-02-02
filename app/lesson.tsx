// app/lesson-screen.tsx
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useBadges } from '@/src/hooks/useBadges';
import { ResponsiveSizeWp, screenHeight } from '@/src/utility/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';

type LessonPage = {
  type: 'explanation' | 'example' | 'video' | 'quiz';
  subtitle?: string;
  content: string;
  videoUrl?: string;
  quiz?: QuizQuestion[];
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export default function LessonScreen() {
  const { t } = useLocalization();
  const { addBadge, achivedBadges } = useBadges();
  const { lessonId, courseId } = useLocalSearchParams();
  const topSpace = useSafeAreaInsets().top;
  const router = useRouter();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const [currentPage, setCurrentPage] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [quizScore, setQuizScore] = useState(0);
  const [lessonPages, setLessonPages] = useState<LessonPage[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);

  // Fetch course data on mount
  useEffect(() => {
    const fetchCourse = async () => {
      const courseRef = db.collection('courses').doc(courseId as string);
      const courseSnap = await courseRef.get();
      if (courseSnap.exists) {
        const courseData = courseSnap.data();
        const lessons = courseData?.lessons || [];
        const currentLesson = lessons.find((lesson: any) => lesson.id === lessonId);
        const pages: LessonPage[] = [];
        if (currentLesson?.content) {
          currentLesson.content.forEach((content: any) => {
            pages.push({
              type: "explanation",
              subtitle: content.subtitle,
              content: content.explain
            });
          });
        }
        if (currentLesson?.quiz?.questions) {
          pages.push({
            type: "quiz",
            content: 'Test Your Understanding',
            quiz: currentLesson.quiz.questions.map((question: any) => ({
              question: question.question,
              options: question.options,
              answer: question.answer
            }))
          });
        }
        setLessonPages(pages);
      }
    };
    fetchCourse();
  }, [courseId, lessonId]);

  const handleNext = async () => {
    setIsNextLoading(true);
    try {
      const user = auth().currentUser;
      if (user) {
        // 1. Read the course document
        const courseRef = db.collection('courses').doc(courseId as string);
        const courseSnap = await courseRef.get();
        if (courseSnap.exists) {
          const courseData = courseSnap.data();
          const lessons = courseData?.lessons || [];
          // 2. Find the lesson by id and update progress
          const totalPages = lessonPages.length;
          // If on last page, set progress to 100, else calculate percentage
          const newProgress =
            currentPage === totalPages - 1
              ? 100
              : Math.round(((currentPage + 1) / totalPages) * 100);

          const updatedLessons = lessons.map((lesson: any) =>
            lesson.id === lessonId ? { ...lesson, progress: newProgress } : lesson
          );

          // Calculate course progress as the average of all lesson progresses
          const totalProgress = updatedLessons.reduce(
            (sum: number, lesson: any) => sum + (lesson.progress || 0),
            0
          );
          const courseProgress = Math.round(totalProgress / updatedLessons.length);

          if (!achivedBadges.some(badge => badge == 'first-lesson') && newProgress >= 100) await addBadge('first-lesson');

          // Update both lessons and course progress in Firestore
          await courseRef.update({
            lessons: updatedLessons,
            progress: courseProgress,
          });
        }
      }

      if (currentPage < lessonPages.length - 1) {
        setCurrentPage(currentPage + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {

        const userRef = db.collection('users').doc(user.uid);
        await userRef.update({
          xp: firestore.FieldValue.increment(quizScore * 10), // Assuming 10 XP per correct answer
        });
        setShowModal(true);
      }
    } finally {
      setIsNextLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, answer: string) => {
    const newAnswers = { ...userAnswers, [questionIndex]: answer };
    setUserAnswers(newAnswers);

    // Calculate score
    if (lessonPages[currentPage].type === 'quiz') {
      const correct = lessonPages[currentPage].quiz?.filter(
        (q, i) => q.answer === newAnswers[i]
      ).length || 0;
      setQuizScore(correct);
    }
  };

  // Now renderPage is a regular function
  const renderPage = () => {
    const page = lessonPages[currentPage];
    if (!page) return null;
    switch (page.type) {
      case 'explanation':
        return (
          <View style={themedStyles.card}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={ResponsiveSizeWp(36)} color="#FFD600" style={{ alignSelf: 'center', marginBottom: ResponsiveSizeWp(8) }} />
            <Text style={themedStyles.conceptTitle}>
              {page.subtitle}
            </Text>
            <View style={themedStyles.divider} />
            <Text style={themedStyles.conceptBody}>
              {page.content}
            </Text>
          </View>
        );
      case 'example':
        return (
          <View style={themedStyles.pageContainer}>
            <Text style={themedStyles.content}>{page.content}</Text>
          </View>
        );

      case 'quiz':
        return (
          <View style={themedStyles.quizCard}>
            <Text style={themedStyles.quizTitle}>{page.content}</Text>
            {page.quiz?.map((q, i) => (
              <View key={i} style={themedStyles.questionBlock}>
                <Text style={themedStyles.questionNumber}>{t?.question} {i + 1}</Text>
                <Text style={themedStyles.questionText}>{q.question}</Text>
                {q.options.map((opt, j) => {
                  const isSelected = userAnswers[i] === opt;
                  const isCorrect = userAnswers[i] && opt === q.answer;
                  const isIncorrect = isSelected && opt !== q.answer;
                  return (
                    <TouchableOpacity
                      key={j}
                      style={[
                        themedStyles.quizOption,
                        isSelected ? themedStyles.selectedQuizOption : null,
                        isCorrect ? themedStyles.correctQuizOption : null,
                        isIncorrect ? themedStyles.incorrectQuizOption : null,
                      ]}
                      onPress={() => handleAnswer(i, opt)}
                      disabled={!!userAnswers[i]} // Disable after answer
                    >
                      <Text style={[
                        themedStyles.quizOptionText,
                        isCorrect ? themedStyles.correctQuizOptionText : undefined,
                        isIncorrect ? themedStyles.incorrectQuizOptionText : undefined,
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {userAnswers[i] && (
                  <Text style={[
                    themedStyles.feedbackText,
                    userAnswers[i] === q.answer ? themedStyles.correctText : themedStyles.incorrectText
                  ]}>
                    {userAnswers[i] === q.answer ? t?.correct : `${t?.incorrectAnswer}: ${q.answer}`}
                  </Text>
                )}
              </View>
            ))}
            <Text style={themedStyles.quizScore}>
              {t?.score}: {quizScore}/{page.quiz?.length || 0}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const quizSuccess = quizScore >= (lessonPages[currentPage]?.quiz?.length || 0) / 2;

  return (
    <View style={[themedStyles.container, { paddingTop: topSpace + ResponsiveSizeWp(10) }]}>

      {/* Lesson Content */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, }}
        contentContainerStyle={{
          minHeight: screenHeight - (topSpace + ResponsiveSizeWp(10)) * 2 - ResponsiveSizeWp(88),
          justifyContent: 'center',
          padding: ResponsiveSizeWp(20),
          paddingBottom: ResponsiveSizeWp(30),
        }}
        bounces={false}
      >
        {renderPage()}
      </ScrollView>

      {/* Navigation */}
      <TouchableOpacity
        style={themedStyles.nextButton}
        onPress={handleNext}
        disabled={isNextLoading}
      >
        <Text style={themedStyles.nextButtonText}>
          {isNextLoading
            ? t?.loading
            : currentPage === lessonPages.length - 1
              ? t?.completeLesson
              : t?.next}
        </Text>
      </TouchableOpacity>
      {/* Progress Bar */}
      <View style={themedStyles.progressContainer}>
        <View style={[themedStyles.progressBar, {
          width: `${(currentPage + 1) / lessonPages.length * 100}%`
        }]} />
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: ResponsiveSizeWp(20),
            padding: ResponsiveSizeWp(32),
            alignItems: 'center',
            width: ResponsiveSizeWp(300)
          }}>
            {/* Emotion Icon */}
            {quizSuccess ? (
              <MaterialCommunityIcons name="emoticon-happy-outline" size={ResponsiveSizeWp(64)} color="#4CAF50" />
            ) : (
              <MaterialCommunityIcons name="emoticon-sad-outline" size={ResponsiveSizeWp(64)} color="#FF5252" />
            )}
            <Text style={{ fontSize: ResponsiveSizeWp(22), fontWeight: 'bold', marginTop: ResponsiveSizeWp(16) }}>
              {quizSuccess
                ? t?.congratulations
                : t?.lessonComplete}
            </Text>
            <Text style={{ fontSize: ResponsiveSizeWp(16), marginTop: ResponsiveSizeWp(8), color: '#0f2b46' }}>
              {t?.youEarned} <Text style={{ fontWeight: 'bold' }}>{quizScore * 10} XP</Text>
            </Text>
            <TouchableOpacity
              style={{
                marginTop: ResponsiveSizeWp(24),
                backgroundColor: theme.xpFillColor,
                paddingVertical: ResponsiveSizeWp(12),
                paddingHorizontal: ResponsiveSizeWp(32),
                borderRadius: ResponsiveSizeWp(8)
              }}
              onPress={() => {
                setShowModal(false);
                router.back();
              }}
            >
              <Text style={themedStyles.nextButtonText}>{t?.continue}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  progressContainer: {
    height: ResponsiveSizeWp(4),
    backgroundColor: theme.dividerBackgroundColor,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.xpFillColor,
  },
  contentContainer: {
    padding: ResponsiveSizeWp(20),
  },
  pageContainer: {
  },
  content: {
    fontSize: ResponsiveSizeWp(16),
    lineHeight: ResponsiveSizeWp(24),
  },
  quizTitle: {
    fontSize: ResponsiveSizeWp(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveSizeWp(20),
    color: theme.nameTextColor,
  },
  questionContainer: {
    marginBottom: ResponsiveSizeWp(15),
  },
  question: {
    fontWeight: '600',
    marginBottom: ResponsiveSizeWp(10),
  },
  option: {
    padding: ResponsiveSizeWp(12),
    borderWidth: ResponsiveSizeWp(1),
    borderColor: theme.borderColor,
    borderRadius: ResponsiveSizeWp(8),
    marginBottom: ResponsiveSizeWp(8),
  },
  selectedOption: {
    backgroundColor: theme.selectedOptionColor,
    borderColor: theme.xpFillColor,
  },
  score: {
    fontWeight: 'bold',
    marginTop: ResponsiveSizeWp(15),
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: theme.xpFillColor,
    padding: ResponsiveSizeWp(15),
    margin: ResponsiveSizeWp(20),
    borderRadius: ResponsiveSizeWp(8),
    alignItems: 'center',
  },
  nextButtonText: {
    color: theme.cardBackgroundColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(14),
  },
  card: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(16),
    padding: ResponsiveSizeWp(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  conceptTitle: {
    fontSize: ResponsiveSizeWp(22),
    fontWeight: 'bold',
    color: theme.nameTextColor,
    marginBottom: ResponsiveSizeWp(8),
    textAlign: 'center',
  },
  divider: {
    height: ResponsiveSizeWp(2),
    backgroundColor: theme.dividerBackgroundColor,
    marginVertical: ResponsiveSizeWp(12),
    borderRadius: ResponsiveSizeWp(1),
  },
  conceptBody: {
    fontSize: ResponsiveSizeWp(16),
    color: theme.conceptTextColor,
    lineHeight: ResponsiveSizeWp(26),
    textAlign: 'left',
  },
  quizCard: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(16),
    padding: ResponsiveSizeWp(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionBlock: {
    marginBottom: ResponsiveSizeWp(24),
  },
  questionNumber: {
    fontSize: ResponsiveSizeWp(14),
    color: theme.nameTextColor,
    marginBottom: ResponsiveSizeWp(4),
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: ResponsiveSizeWp(16),
    fontWeight: '600',
    marginBottom: ResponsiveSizeWp(12),
    color: theme.nameTextColor,
  },
  quizOption: {
    padding: ResponsiveSizeWp(14),
    borderWidth: ResponsiveSizeWp(1),
    borderColor: theme.borderColor,
    borderRadius: ResponsiveSizeWp(8),
    marginBottom: ResponsiveSizeWp(8),
    backgroundColor: theme.optionColor,
  },
  selectedQuizOption: {
    borderColor: theme.xpFillColor,
    backgroundColor: theme.selectedOptionColor,
  },
  correctQuizOption: {
    borderColor: theme.successColor,
    backgroundColor: '#e8f5e9',
  },
  incorrectQuizOption: {
    borderColor: '#ff5252',
    backgroundColor: '#ffebee',
  },
  quizOptionText: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(15),
  },
  correctQuizOptionText: {
    color: '#388e3c',
    fontWeight: 'bold',
  },
  incorrectQuizOptionText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  feedbackText: {
    marginTop: ResponsiveSizeWp(6),
    fontSize: ResponsiveSizeWp(14),
    fontWeight: 'bold',
  },
  correctText: {
    color: '#388e3c',
  },
  incorrectText: {
    color: '#d32f2f',
  },
  quizScore: {
    fontWeight: 'bold',
    marginTop: ResponsiveSizeWp(10),
    fontSize: ResponsiveSizeWp(16),
    textAlign: 'center',
    color: theme.nameTextColor,
  },
});