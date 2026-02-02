import { useLocalization } from "@/src/contexts/LocalizationContext";
import { ResponsiveSizeWp } from "@/src/utility/responsive";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import auth from '@react-native-firebase/auth';
import useFacebookSignIn from "@utility/FacebookSignIn";
import useGoogleSignIn from "@utility/GoogleSignIn";
import { Redirect, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/hooks/useTheme";
import LoadingModal from "./components/LoadingModal";

export default function Login() {

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const themedStyles = styles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { promptAsync, request } = useGoogleSignIn();
  const { handleFacebookLogin, loading: facebookLoading, error } = useFacebookSignIn();
  const [showAnimation, setShowAnimation] = useState(true); // Add this state
  const { t } = useLocalization();

  // if (user) return <Redirect href="/topicselection" />;
  const { user, loading } = useAuth();

  if (user) {
    console.log("User is already logged in:");
    return <Redirect href="/mainlayout" />;
  }

  if (loading) {
    return (
      <View style={themedStyles.container}>
        <ActivityIndicator size="large" color="#0f2b46" />
      </View>
    );
  }

  const handleLogin = async () => {
    console.log("🚀 [Login] Starting login process...");
    console.log("📧 [Login] Email:", email);

    setIsLoading(true);

    if (!email || !password) {
      console.log("❌ [Login] Validation failed: Missing email or password");
      Alert.alert("Email and password required.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔐 [Login] Attempting Firebase signInWithEmailAndPassword...");
      console.log("🔑 [Login] Firebase Auth instance:", auth().app.name);

      await auth().signInWithEmailAndPassword(email, password);

      console.log("✅ [Login] Sign in successful!");

      const currentUser = auth().currentUser;
      console.log("🔍 [Login] Current user check:", currentUser?.email);

      if (!currentUser) {
        console.error("❌ [Login] User not found after login");
        Alert.alert(t?.error, t?.userNotFoundAfterLogin);
        setIsLoading(false);
        return;
      }

      console.log("🆔 [Login] User UID:", currentUser.uid);
      console.log("✅ [Login] Login completed successfully");

      Alert.alert(t?.success, t?.logedInMessage, [{ text: t?.cancel }])
    } catch (error: any) {
      console.error("❌ [Login] Error occurred during login:");
      console.error("❌ [Login] Error code:", error.code);
      console.error("❌ [Login] Error message:", error.message);
      console.error("❌ [Login] Full error:", JSON.stringify(error, null, 2));

      let message = error.message;

      if (error.code === "auth/invalid-api-key") {
        message = "Firebase configuration error. Please check your API key.";
        console.error("🔴 [Login] INVALID API KEY ERROR - Check google-services.json and Firebase config");
      } else if (error.code === "auth/user-not-found") {
        message = "No account found with this email.";
        console.log("⚠️ [Login] User not found");
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
        console.log("⚠️ [Login] Wrong password");
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address format.";
        console.log("⚠️ [Login] Invalid email format");
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
        console.error("🌐 [Login] Network request failed");
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
        console.log("⚠️ [Login] Too many requests");
      }

      Alert.alert("Login failed", message);
    } finally {
      console.log("🏁 [Login] Login process completed");
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert(t?.error, t?.enterEmailForPasswordReset);
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        t?.success,
        t?.passwordResetMailSent,
        [{ text: t?.ok }]
      );
    } catch (error: any) {
      Alert.alert(t?.error, error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!request) {
      console.warn("⚠️ Auth request is not ready yet");
      return;
    }
    try {
      console.log("🔁 Starting Google sign-in...");
      const result = await promptAsync();
      // router.replace("topicselection" as any); // Navigate after user presses OK
      console.log("🔁 Sign-in result:", result);
    } catch (e) {
      console.log("❌ Sign-in failed:", e);
    }
  };

  return (
    <View style={themedStyles.container}>
      {/* Logo */}

      {showAnimation && (
        <View style={themedStyles.animationContainer}>
          <LottieView
            autoPlay
            loop={false}
            source={require("../assets/welcome-animation.json")}
            style={themedStyles.animation}
            resizeMode="cover"
            onAnimationFinish={() => {
              console.log("Animation completed!");
              setShowAnimation(false); // Hide after completion
            }}
          />
        </View>
      )}
      {!showAnimation && (
        <>
          <Image source={theme.backgroundColor === '#121212' ? require("../assets/logo-dark.png") : require("../assets/logo.png")} style={themedStyles.logo} />

          <Text style={themedStyles.title}>{t?.appName}{"\n"}{t?.logIn}</Text>

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

          {/* Login Button */}
          <TouchableOpacity style={themedStyles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={themedStyles.buttonText}>{t?.logIn}</Text>
            )}
          </TouchableOpacity>

          {/* Social Login */}
          <Text style={themedStyles.or}>{t?.signInWith}</Text>
          <View style={themedStyles.socialRow}>
            <TouchableOpacity
              style={[themedStyles.socialButton,]}
              onPress={handleFacebookLogin}
              disabled={facebookLoading}
            >
              <FontAwesome name="facebook" size={ResponsiveSizeWp(24)} color="#3b5998" />
            </TouchableOpacity>
            <TouchableOpacity
              style={themedStyles.socialButton}
              onPress={() => handleGoogleSignIn()}
              disabled={!request}
            >
              <Image
                source={require("../assets/google.png")}
                style={{ width: ResponsiveSizeWp(24), height: ResponsiveSizeWp(24) }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Links */}
          <View style={themedStyles.linksRow}>
            <TouchableOpacity onPress={handlePasswordReset}>
              <Text style={themedStyles.linkText}>{t?.forgotPassword}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("signup" as any)}>
              <Text style={[themedStyles.linkText, { fontWeight: "bold" }]}>{t?.signUp}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {facebookLoading && <LoadingModal />}
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
    resizeMode: 'contain',
    marginBottom: ResponsiveSizeWp(10),
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
    color: theme.nameTextColor,
    borderColor: theme.borderColor
  },
  input: {
    color: theme.nameTextColor,
    flex: 1,
    marginLeft: ResponsiveSizeWp(8),
    fontSize: ResponsiveSizeWp(16),
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
    marginBottom: ResponsiveSizeWp(8),
    fontSize: ResponsiveSizeWp(14),
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ResponsiveSizeWp(16),
    marginVertical: ResponsiveSizeWp(10),
  },
  socialButton: {
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: ResponsiveSizeWp(50),
    padding: ResponsiveSizeWp(12),
    marginHorizontal: ResponsiveSizeWp(8),
    elevation: 2,
    aspectRatio: 1 / 1,
    width: ResponsiveSizeWp(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ResponsiveSizeWp(10),
    marginTop: ResponsiveSizeWp(5),
  },
  animation: {
    width: ResponsiveSizeWp(250),
    height: ResponsiveSizeWp(250),
    marginBottom: Platform.OS === 'ios' ? ResponsiveSizeWp(20) : 0,
  },
  animationContainer: {
    ...StyleSheet.absoluteFillObject, // Covers entire screen
    backgroundColor: theme.backgroundColor, // Match your background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100 // Ensures it appears above everything
  },
  linkText: {
    color: theme.nameTextColor,
    fontWeight: "600",
    fontSize: ResponsiveSizeWp(14),
  },
});
