// utils/googleSignIn.ts
// import { makeRedirectUri } from "expo-auth-session";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import * as AuthSession from 'expo-auth-session';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google'; // ✅ CORRECT
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect } from "react";

export default function useGoogleSignIn() {

  // const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const redirectUri = AuthSession.makeRedirectUri({
    native: "com.anonymous.thinkly:/oauthredirect",
  });

  // Access env vars - works for both local dev and EAS builds
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;

  console.log("🔗 Redirect URI:", redirectUri, androidClientId);

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
    expoClientId,
    redirectUri,
    scopes: ['openid', 'email', 'profile']
  });

  useEffect(() => {
    const handleGoogleLogin = async () => {
      if (response?.type === "success") {
        // setIsLoading(true);
        const idToken = response.params?.id_token;

        if (!idToken) {
          console.log("❌ No ID token found in response");
          return;
        }

        const credential = auth.GoogleAuthProvider.credential(idToken);

        try {
          const result = await auth().signInWithCredential(credential);
          const user = result.user;

          // Save user to Firestore
          const userRef = db.collection("users").doc(user.uid);
          const userSnap = await userRef.get();

          if (!userSnap.exists) {
            await userRef.set({
              uid: user.uid,
              name: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              authProvider: "google",
              createdAt: firestore.FieldValue.serverTimestamp(),
              xp: 0,
              streak: 0,
              activeCourse: null,
              lastChallengeDate: null,
              coursesCreated: 0,
              customeCoursesCreated: 0,
              days: 0,
              level: 1,
              lastCourseCreatedAt: null, // to reset count monthly
              subscriptionStatus: 'none',
              stripeCustomerId: null        // Stripe customer ID
            });
            console.log("✅ New Google user saved to Firestore");
            // router.replace("topicselection" as any);
          } else {
            console.log("ℹ️ Existing user logged in successfully");
            // router.replace('/mainlayout');
          }

          console.log("Post-signin user state:", auth().currentUser?.email);

        } catch (error: any) {
          console.log("🔥 Google sign-in error:", error.message);
          throw new Error(error.message);
          // } finally {
          //   setIsLoading(false);
        }
      } else if (response?.type === "error") {
        console.log("❌ Authentication error:", response.error);
      }
    };

    handleGoogleLogin();
  }, [response, router]);

  return { promptAsync, request };
}
