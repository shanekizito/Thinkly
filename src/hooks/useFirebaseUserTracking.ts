// useFirebaseUserTracking.ts
import { getAnalytics, logEvent, logLogin, setUserId, setUserProperty } from "@react-native-firebase/analytics";
import { useEffect } from "react";
import { Platform } from "react-native";
import { auth } from "../services/firebaseConfig";

const getProviderName = (providerId: string) => {
    switch (providerId) {
        case "password":
            return "Email/Password";
        case "google.com":
            return "Google";
        case "facebook.com":
            return "Facebook";
        case "apple.com":
            return "Apple";
        default:
            return providerId;
    }
};

export const useFirebaseUserTracking = (operation: string) => {
    const analytics = getAnalytics();

    useEffect(() => {
        const unsubscribe =
            auth().onAuthStateChanged(async (user) => {
                if (user) {

                    const providerData = user.providerData[0];

                    const dump = {
                        provider: getProviderName(providerData?.providerId ?? "unknown"),
                        userUid: user.uid,
                        email: user.email,
                        createdAt: user.metadata.creationTime,
                        lastSignedInAt: user.metadata.lastSignInTime,
                        displayName: user.displayName,
                        // dumpTime: serverTimestamp(),
                        os: Platform.OS,
                        operation: operation,
                    };

                    await logLogin(analytics, { method: getProviderName(providerData?.providerId ?? "unknown") });
                    await logEvent(analytics, 'users', dump);

                    console.log("🔹 Firebase User Dump:", dump);

                    // Set user in Analytics
                    await setUserId(analytics, user.uid)

                    if (user.displayName) {
                        await setUserProperty(analytics, 'user_name', user.displayName);
                    }

                    if (user.email) {
                        await setUserProperty(analytics, 'email', user.email);
                    }

                    if (providerData?.providerId) {
                        await setUserProperty(analytics, 'provider', getProviderName(providerData.providerId));
                    }
                }
            });

        return () => unsubscribe();
    }, []);
};
