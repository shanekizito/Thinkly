import { useLocalization } from "@/src/contexts/LocalizationContext";
import { ResponsiveSizeWp } from "@/src/utility/responsive";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../src/hooks/useTheme";

export default function SignUp() {
  const router = useRouter();
  const { t } = useLocalization();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const themedStyles = styles(theme);
  const handleSignUp = async () => {
    console.log("🚀 [SignUp] Starting signup process...");
    console.log("📧 [SignUp] Email:", email);
    console.log("👤 [SignUp] Name:", name);

    setIsLoading(true);

    if (!name || !email || !password) {
      console.log("❌ [SignUp] Validation failed: Missing fields");
      Alert.alert('', t?.allFieldsRequire);
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔐 [SignUp] Attempting Firebase createUserWithEmailAndPassword...");
      console.log("🔑 [SignUp] Firebase Auth instance:", auth().app.name);

      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log("✅ [SignUp] User created successfully!");
      console.log("🆔 [SignUp] User UID:", user.uid);
      console.log("📧 [SignUp] User email:", user.email);

      console.log("📝 [SignUp] Updating user profile...");
      await user.updateProfile({ displayName: name });
      console.log("✅ [SignUp] Profile updated");

      console.log("💾 [SignUp] Creating Firestore user document...");
      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        name,
        email,
        authProvider: "email",
        createdAt: firestore.FieldValue.serverTimestamp(),
        xp: 0,
        streak: 0,
        activeCourse: null,
        lastChallengeDate: null,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff&size=128`,
        coursesCreated: 0,
        customeCoursesCreated: 0,
        days: 0,
        level: 1,
        lastCourseCreatedAt: null,
        subscriptionStatus: 'none',
        stripeCustomerId: null
      });
      console.log("✅ [SignUp] Firestore document created");

      console.log("🔍 [SignUp] Current user check:", auth().currentUser?.email);
      if (auth().currentUser) {
        console.log("🧭 [SignUp] Navigating to main layout...");
        router.replace('/mainlayout');
      }

      Alert.alert(t?.success, t?.accountCreated, [
        {
          text: t?.ok,
          onPress: () => {
            console.log("✅ [SignUp] Account created successfully - Alert dismissed");
          },
        },
      ]);
    } catch (error: any) {
      console.error("❌ [SignUp] Error occurred during signup:");
      console.error("❌ [SignUp] Error code:", error.code);
      console.error("❌ [SignUp] Error message:", error.message);
      console.error("❌ [SignUp] Full error:", JSON.stringify(error, null, 2));

      let message = error.message;

      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered. Try logging in instead.";
        console.log("⚠️ [SignUp] Email already in use");
      } else if (error.code === "auth/invalid-api-key") {
        message = "Firebase configuration error. Please check your API key.";
        console.error("🔴 [SignUp] INVALID API KEY ERROR - Check google-services.json and Firebase config");
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
        console.error("🌐 [SignUp] Network request failed");
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address format.";
        console.log("⚠️ [SignUp] Invalid email format");
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Please use a stronger password.";
        console.log("⚠️ [SignUp] Weak password");
      }

      Alert.alert(t?.signUpFailed, message);
    } finally {
      console.log("🏁 [SignUp] Signup process completed");
      setIsLoading(false);
    }
  };

  return (
    <View style={themedStyles.container}>
      {/* Logo */}
      <Image source={theme.backgroundColor === '#121212' ? require("../assets/logo-dark.png") : require("../assets/logo.png")} style={themedStyles.logo} />

      <Text style={themedStyles.title}>{t?.appName}{"\n"}{t?.signUp}</Text>

      {/* Name Input */}
      <View style={themedStyles.inputWrapper}>
        <AntDesign name="user" size={ResponsiveSizeWp(20)} color={theme.conceptTextColor} />
        <TextInput
          placeholder={t?.name}
          style={themedStyles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor={theme.levelTextColor}
        />
      </View>

      {/* Email Input */}
      <View style={themedStyles.inputWrapper}>
        <MaterialIcons name="email" size={ResponsiveSizeWp(20)} color={theme.conceptTextColor} />
        <TextInput
          placeholder={t?.email}
          style={themedStyles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={theme.levelTextColor}
        />
      </View>

      {/* Password Input */}
      <View style={themedStyles.inputWrapper}>
        <MaterialIcons name="lock" size={ResponsiveSizeWp(20)} color={theme.conceptTextColor} />
        <TextInput
          placeholder={t?.password}
          style={themedStyles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={theme.levelTextColor}
        />
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity style={themedStyles.button} onPress={handleSignUp} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={themedStyles.buttonText}>{t?.signUp}</Text>
        )}
      </TouchableOpacity>

      {/* Link to login */}
      <View style={themedStyles.linksRow}>
        <Text style={themedStyles.linkText}>{t?.alreadyHaveAnAccount}</Text>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={[themedStyles.linkText, { fontWeight: "bold" }]}>{t?.logIn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: ResponsiveSizeWp(24),
    justifyContent: "center",
    backgroundColor: theme.backgroundColor
  },
  logo: {
    height: ResponsiveSizeWp(150),
    aspectRatio: 1 / 1,
    alignSelf: "center",
    marginBottom: ResponsiveSizeWp(10),
    resizeMode: 'contain',
  },
  title: {
    color: theme.nameTextColor,
    fontSize: ResponsiveSizeWp(42),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: ResponsiveSizeWp(24),
    fontFamily: "serif"
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(12),
    paddingHorizontal: ResponsiveSizeWp(12),
    paddingVertical: ResponsiveSizeWp(10),
    marginBottom: ResponsiveSizeWp(12),
  },
  input: {
    color: theme.levelTextColor,
    flex: 1,
    marginLeft: ResponsiveSizeWp(8),
    fontSize: ResponsiveSizeWp(16)
  },
  button: {
    backgroundColor: theme.xpFillColor,
    paddingVertical: ResponsiveSizeWp(14),
    borderRadius: ResponsiveSizeWp(12),
    marginTop: ResponsiveSizeWp(10),
    marginBottom: ResponsiveSizeWp(20),
  },
  buttonText: {
    color: theme.cardBackgroundColor,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: ResponsiveSizeWp(16)
  },
  or: {
    textAlign: "center",
    color: theme.conceptTextColor,
    marginBottom: ResponsiveSizeWp(8)
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ResponsiveSizeWp(16)
  },
  socialButton: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(50),
    padding: ResponsiveSizeWp(12),
    marginHorizontal: ResponsiveSizeWp(8),
    elevation: 2,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: ResponsiveSizeWp(16),
    gap: ResponsiveSizeWp(2),
  },
  linkText: {
    color: theme.nameTextColor,
    fontWeight: "600",
    fontSize: ResponsiveSizeWp(14),
  }
});
