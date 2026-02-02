import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Redirect() {
  
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      // Add a slight delay if needed for stability on iOS
      await new Promise((res) => setTimeout(res, 500));
      router.replace("/mainlayout");
    };
    handleRedirect();
  }, [router]);

  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor:'#f2f0e8' }}>
        <ActivityIndicator size="large" />
      </View>
  );
}
