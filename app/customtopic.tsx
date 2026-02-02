// app/custom-topic.tsx
import { useCourseLength } from '@/src/contexts/CourseLengthContext';
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useTopic } from '@/src/contexts/TopicContext';
import { ResponsiveSizeWp, screenHeight, useTopPadding } from '@/src/utility/responsive';
import firestore from '@react-native-firebase/firestore';
import { auth, db } from '@services/firebaseConfig';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../src/hooks/useTheme'; // Custom hook for theme styles

export default function CustomTopic() {
  const { t } = useLocalization();
  const { courseLength: length } = useCourseLength();
  const { setTopic } = useTopic();
  const [desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const topSpace = useTopPadding();
  const router = useRouter();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const handleSubmit = async () => {
    if (!desc.trim()) {
      Alert.alert(t?.error, t?.enterTopic);
      return;
    }

    setIsLoading(true);
    try {
      // Save to Firestore
      const user = auth().currentUser;
      if (user) {
        await db.collection('userTopics').doc(`${user.uid}_${Date.now()}`).set({
          topic: desc.trim(),
          length: length,
          userId: user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          status: 'pending' // For backend processing
        });
        setTopic(desc.trim());
        // router.replace({ pathname: "/mainlayout", params: { topic: desc } });
        router.replace({ pathname: "/mainlayout" });
      }
    } catch (error) {
      Alert.alert(t?.error, t?.failedToSaveTopic);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[themedStyles.container, { paddingTop: topSpace + ResponsiveSizeWp(10), }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1, }}
          contentContainerStyle={{ minHeight: screenHeight - (topSpace + ResponsiveSizeWp(10)) * 2, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={themedStyles.logoContainer}>
            <Image source={theme.backgroundColor === '#121212' ? require("../assets/logo-dark.png") : require("../assets/logo.png")} style={themedStyles.logo} />
            <Text style={themedStyles.title}>{t?.appName}</Text>
          </View>
          <Text style={themedStyles.screentitle}>{t?.customCourse}</Text>
          {/* <Text style={themedStyles.label}>Choose length</Text>
          <Picker
            selectedValue={length}
            style={themedStyles.picker}
            onValueChange={(itemValue) => setLength(itemValue)}
          >
            <Picker.Item label="Short" value="short"/>
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="Long" value="long" />
          </Picker> */}
          <Text style={themedStyles.label}>{t?.customCoursePlaceholder}</Text>
          <TextInput
            placeholder={t?.customCoursePlaceholder}
            style={themedStyles.input}
            value={desc}
            onChangeText={setDesc}
            autoFocus
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={theme.nameTextColor}
          />

          <TouchableOpacity
            style={themedStyles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={themedStyles.buttonText}>
              {isLoading ? t?.creating : t?.createCourse}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: ResponsiveSizeWp(20),
    backgroundColor: theme.backgroundColor,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ResponsiveSizeWp(10),
  },
  screentitle: {
    fontSize: ResponsiveSizeWp(35),
    fontWeight: 'bold',
    marginBottom: ResponsiveSizeWp(20),
    textAlign: 'center',
    color: theme.nameTextColor,
  },
  label: {
    fontSize: ResponsiveSizeWp(18),
    marginBottom: ResponsiveSizeWp(10),
    textAlign: 'left',
    color: theme.nameTextColor,
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
  logo: {
    width: ResponsiveSizeWp(90),
    aspectRatio: 1 / 1,
    alignSelf: 'center',
    marginBottom: ResponsiveSizeWp(10),
    resizeMode: 'contain',
  },
  title: {
    fontSize: ResponsiveSizeWp(64),
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'serif',
    color: theme.nameTextColor,
  },
  input: {
    backgroundColor: theme.cardBackgroundColor,
    padding: ResponsiveSizeWp(15),
    borderRadius: ResponsiveSizeWp(10),
    marginBottom: ResponsiveSizeWp(20),
    fontSize: ResponsiveSizeWp(16),
    height: ResponsiveSizeWp(150),
    color: theme.nameTextColor,
    paddingTop: ResponsiveSizeWp(15),
  },
  button: {
    backgroundColor: theme.xpFillColor,
    padding: ResponsiveSizeWp(15),
    borderRadius: ResponsiveSizeWp(10),
    alignItems: 'center',
    marginTop: ResponsiveSizeWp(20),
  },
  buttonText: {
    color: theme.cardBackgroundColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(16)
  }
});