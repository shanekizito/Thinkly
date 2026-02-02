import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '@services/firebaseConfig';
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔥 [AuthContext] Setting up auth listener...");
    console.log("🔥 [AuthContext] Firebase app name:", auth().app.name);

    try {
      const unsubscribe = auth().onAuthStateChanged((currentUser) => {
        console.log("👤 [AuthContext] Auth state changed");
        if (currentUser) {
          console.log("✅ [AuthContext] User is authenticated");
          console.log("🆔 [AuthContext] User UID:", currentUser.uid);
          console.log("📧 [AuthContext] User email:", currentUser.email);
          console.log("👤 [AuthContext] User display name:", currentUser.displayName);
        } else {
          console.log("❌ [AuthContext] No user authenticated");
        }
        setUser(currentUser);
        setLoading(false);
      });

      return () => {
        console.log("🧹 [AuthContext] Cleaning up auth listener");
        unsubscribe();
      };
    } catch (error: any) {
      console.error("❌ [AuthContext] Error setting up auth listener:");
      console.error("❌ [AuthContext] Error code:", error.code);
      console.error("❌ [AuthContext] Error message:", error.message);
      console.error("❌ [AuthContext] Full error:", JSON.stringify(error, null, 2));
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);