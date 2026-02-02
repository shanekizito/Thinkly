import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Thinkly",
  slug: "thinkly",
  version: "1.0.7",
  orientation: "portrait",
  icon: "./assets/images/applogo.png",
  scheme: "com.anonymous.thinkly",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.thinkly",
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true
      },
      NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you.",
      SKAdNetworkItems: [
        {
          SKAdNetworkIdentifier: "v9wttpbfk9.skadnetwork"
        },
        {
          SKAdNetworkIdentifier: "n38lu8286q.skadnetwork"
        }
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/applogo.png",
      backgroundColor: "#ffffff"
    },
    package: "com.anonymous.thinkly",
    googleServicesFile: "./google-services.json",
    intentFilters: [
      {
        action: "VIEW",
        data: {
          scheme: "com.anonymous.thinkly",
          host: "oauthredirect"
        },
        category: [
          "BROWSABLE",
          "DEFAULT"
        ]
      }
    ],
    permissions: [
      "INTERNET",
      "android.permission.INTERNET"
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ],
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.23",
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0",
          enableCoreLibraryDesugaring: true
        }
      }
    ],
    "./plugins/withReactNativeIAPFlavor.js",
    [
      "react-native-fbsdk-next",
      {
        appID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "738296122093162",
        clientToken: "3e6aaccb31ff980f8911ed68b9d4a311", 
        displayName: "Thinkly",
        scheme: `fb${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "738296122093162"}`,
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: true,
        iosUserTrackingPermission: "This identifier will be used to deliver personalized ads to you."
      }
    ],
    "expo-font"
  ],
  experiments: {
    typedRoutes: true
  },
  platforms: [
    "ios",
    "android",
    "web"
  ],
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "41388235-add1-436c-bac3-ef037b3d2267"
    },
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  androidStatusBar: {
    backgroundColor: "#ffffff"
  },
  owner: "swivelo33"
});
