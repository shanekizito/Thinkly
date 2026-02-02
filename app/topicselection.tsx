import { useCourseLength } from "@/src/contexts/CourseLengthContext";
import { useLocalization } from "@/src/contexts/LocalizationContext";
import { useTopic } from "@/src/contexts/TopicContext";
import { ResponsiveSizeWp } from "@/src/utility/responsive";
import CourseSelection from "@components/CourseSelection";
import { Entypo, FontAwesome, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import firestore from '@react-native-firebase/firestore';
import { auth, db } from '@services/firebaseConfig';
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/hooks/useTheme";

export default function TopicSelection() {
  const { t } = useLocalization();
  const { setTopic } = useTopic();
  const { courseLength, setCourseLength } = useCourseLength();
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const themedStyles = styles(theme);
  if (loading) return null; // Show loading spinner
  if (!user) return <Redirect href="/" />; // Redirect to login if not authenticated

  const [numberOfActiveCourses, setNumberOfActiveCourses] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Courses listener
    const unsubscribeCourses = db.collection('courses')
      .where('userId', '==', user.uid)
      .where('progress', '<', 100)
      .onSnapshot((snapshot) => {
        setNumberOfActiveCourses(snapshot?.docs?.length ?? 0);
      });

    return () => { unsubscribeCourses(); };
  }, [user]);

  const checkCourseLimit = async () => {
    const user = auth().currentUser;

    const userDoc = await db.collection('users').doc(user?.uid).get();
    const userData = userDoc.data();
    const coursesCreated = userData?.coursesCreated ?? 0;
    const subscriptionStatus = userData?.subscriptionStatus ?? 'none';

    const subsciptionEnd = userData?.lastSubscriptionTime ? timeCalculation(userData?.lastSubscriptionTime.toDate()) : false;

    if (subsciptionEnd && subscriptionStatus === 'active') {
      if (user?.uid) await db.collection('users').doc(user.uid).update({ subscriptionStatus: 'end' });
      return true;
    }

    if (coursesCreated >= 1 && subscriptionStatus !== 'active') {
      Alert.alert(
        t?.courseLimitReached,
        t?.subscribeTo,
        [
          { text: t?.cancel },
          { text: t?.subscribe, onPress: () => router.push('/paymentscreen' as any) }
        ]
      );
      return false;
    }
    return true;
  };

  const timeCalculation = (date: Date) => {
    const lastSubscriptionDate = date;
    const now = new Date();

    const diffMs = now.getTime() - lastSubscriptionDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const isOlderThan30Days = diffDays > 30;
    return isOlderThan30Days;
  }


  const handleTopicSelect = async (topic: string) => {
    if (numberOfActiveCourses >= 3) {
      Alert.alert(t?.ongoingCourseLimitReached, t?.ongoingCourseLimitReachedDesc);
      return;
    }
    console.log("Selected topic:", topic);
    const canProceed = await checkCourseLimit();
    if (!canProceed) return;
    if (topic === 'other') {
      router.push("customtopic" as any);
      return;
    }
    try {
      // Save to Firestore
      const user = auth().currentUser;
      if (user) {
        await db.collection('userTopics').doc(`${user.uid}_${Date.now()}`).set({
          topic: topic.trim(),
          length: "short",
          userId: user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          status: 'pending' // For backend processing
        });
        setTopic(topic.trim());
        // router.replace({ pathname: "/mainlayout", params: { topic: topic } });
        router.replace({ pathname: "/mainlayout" });
      }
    } catch (error) {
      Alert.alert(t?.error, t?.failedToSaveTopic);
    }
  };

  return (
    <View style={themedStyles.container}>
      <Image source={theme.backgroundColor === '#121212' ? require("../assets/logo-dark.png") : require("../assets/logo.png")} style={themedStyles.logo} />
      <Text style={themedStyles.title}>{t?.appName}</Text>
      <Text style={themedStyles.subtitle}>{t?.whatDoYouWantToLearn}</Text>

      {/* <Picker
        selectedValue={courseLength}
        style={themedStyles.picker}
        onValueChange={(itemValue) => setCourseLength(itemValue)}
      >
        <Picker.Item label={t?.short} value="short"/>
        <Picker.Item label={t?.medium} value="medium" />
        <Picker.Item label={t?.long} value="long" />
      </Picker> */}

      <CourseSelection selected={courseLength} onSelect={setCourseLength} />

      <TouchableOpacity style={themedStyles.option} onPress={() => handleTopicSelect("Investing")}>
        <View style={themedStyles.iconContainer}>
          <FontAwesome5 name="chart-line" size={ResponsiveSizeWp(20)} color={theme.nameTextColor} />
        </View>
        <Text style={themedStyles.optionText}>{t?.investing}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={themedStyles.option} onPress={() => handleTopicSelect("Mental Health")}>
        <View style={themedStyles.iconContainer}>
          <MaterialIcons name="self-improvement" size={ResponsiveSizeWp(25)} color={theme.nameTextColor} />
        </View>
        <Text style={themedStyles.optionText}>{t?.mentalHealth}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={themedStyles.option} onPress={() => handleTopicSelect("Relationships")}>
        <View style={themedStyles.iconContainer}>
          <FontAwesome name="heart" size={ResponsiveSizeWp(19)} color={theme.nameTextColor} />
        </View>
        <Text style={themedStyles.optionText}>{t?.relationships}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={themedStyles.option} onPress={() => handleTopicSelect('other')}>
        <View style={themedStyles.iconContainer}>
          <Entypo name="arrow-right" size={ResponsiveSizeWp(25)} color={theme.nameTextColor} />
        </View>
        <Text style={themedStyles.optionText}>{t?.other}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.backgroundColor,
    paddingHorizontal: ResponsiveSizeWp(24)
  },
  logo: {
    height: ResponsiveSizeWp(130),
    aspectRatio: 1 / 1,
    alignSelf: "center",
    marginBottom: ResponsiveSizeWp(10),
    resizeMode: 'contain',
  },
  iconContainer: {
    width: ResponsiveSizeWp(25),
    aspectRatio: 1 / 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(42),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: ResponsiveSizeWp(24),
    fontFamily: "serif"
  },
  subtitle: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(35),
    marginBottom: ResponsiveSizeWp(24),
    textAlign: "center",
    fontFamily: "serif"
  },
  option: {
    backgroundColor: theme.cardBackgroundColor,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: ResponsiveSizeWp(14),
    paddingHorizontal: ResponsiveSizeWp(18),
    borderRadius: ResponsiveSizeWp(14),
    marginBottom: ResponsiveSizeWp(14),
    width: "100%",
    gap: ResponsiveSizeWp(12),
    elevation: 2,
  },
  optionText: {
    fontSize: ResponsiveSizeWp(16),
    color: theme.nameTextColor,
    fontWeight: "600"
  },
  picker: {
    height: ResponsiveSizeWp(50),
    width: '100%',
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(10),
    marginBottom: ResponsiveSizeWp(20),
    color: theme.nameTextColor,
    overflow: 'hidden',
    justifyContent: 'center',
  },
});
