import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import * as Facebook from 'expo-auth-session/providers/facebook';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Platform } from "react-native";
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';

export default function useFacebookSignIn() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID || '738296122093162';

    const [request, response, promptAsync] = Facebook.useAuthRequest({
        clientId: facebookAppId,
        scopes: ['public_profile', 'email'],
    });

    const getAndroidAccessToken = async () => {
        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        if (result.isCancelled) {
            setLoading(false);
            setError('Facebook login was cancelled');
            return;
        }
        const data = await AccessToken.getCurrentAccessToken();
        return data?.accessToken;
    }

    const getiOSAccessToken = async () => {
        const result = await promptAsync();

        if (!result || result.type !== 'success') {
            console.log('Facebook login was cancelled');
            return;
        }

        return result?.authentication?.accessToken;
    }

    const handleFacebookLogin = async () => {
        // setLoading(true);
        setError(null);
        try {
            const accessToken = Platform.OS === 'android' ? await getAndroidAccessToken() : await getiOSAccessToken();
            console.log('Facebook access token:', accessToken);
            if (!accessToken) {
                setLoading(false);
                setError('Failed to get Facebook access token');
                console.log('❌ Facebook access token missing or invalid:');
                return;
            }

            setLoading(true);

            const facebookCredential = auth.FacebookAuthProvider.credential(accessToken);

            // Sign in with Firebase
            const authResult = await auth().signInWithCredential(facebookCredential);
            const user = authResult.user;
            const userRef = db.collection('users').doc(user.uid);
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                await userRef.set({
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    authProvider: 'facebook',
                    createdAt: firestore.FieldValue.serverTimestamp(),
                    xp: 0,
                    streak: 0,
                    activeCourse: null,
                    lastChallengeDate: null,
                    coursesCreated: 0,
                    customeCoursesCreated: 0,
                    days: 0,
                    level: 1,
                    lastCourseCreatedAt: null,
                    subscriptionStatus: 'none',
                    stripeCustomerId: null,
                });
            }
        } catch (err: any) {
            setError(err.message);
            console.log('🔥 Facebook sign-in error:', err.message);
        } finally {
            setLoading(false);
        }
    }

    return { handleFacebookLogin, loading, error };

}
