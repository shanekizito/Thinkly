// React Native Firebase - automatically initialized via google-services.json
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

console.log("🔥 [FirebaseConfig] Initializing Firebase...");

// Export auth and firestore instances
export { auth };
export const db = firestore();

// Log Firebase configuration after initialization
try {
  console.log("✅ [FirebaseConfig] Firebase initialized successfully");
  console.log("🔥 [FirebaseConfig] Firebase app name:", auth().app.name);
  console.log("🔥 [FirebaseConfig] Firebase app options:", JSON.stringify(auth().app.options, null, 2));
} catch (error: any) {
  console.error("❌ [FirebaseConfig] Error accessing Firebase configuration:");
  console.error("❌ [FirebaseConfig] Error:", error);
  console.error("❌ [FirebaseConfig] Error message:", error.message);
}