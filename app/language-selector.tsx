// app/(app)/language-selector.tsx
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../src/contexts/SettingsContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'da', name: 'Dansk' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

export default function LanguageSelector() {
  const router = useRouter();
  const topSpace = useSafeAreaInsets().top;
  const { language, setLanguage, theme } = useSettings();

  return (
    <View style={[styles.container, theme === 'dark' && styles.darkContainer,{paddingTop:topSpace + ResponsiveSizeWp(10)}]}>
      <FlatList
        data={languages}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.languageItem,
              theme === 'dark' && styles.darkItem,
              language === item.code && styles.selectedItem
            ]}
            onPress={() => {
              setLanguage(item.code);
              router.back();
            }}
          >
            <Text style={[styles.languageText, theme === 'dark' && styles.darkText]}>
              {item.name}
            </Text>
            {language === item.code && (
              <MaterialIcons name="check" size={ResponsiveSizeWp(24)} color="#0f2b46" />
            )}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.code}
        style={{overflow:'visible', flex: 1,}}
        contentContainerStyle={{overflow:'visible', padding: ResponsiveSizeWp(16),}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f0e8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ResponsiveSizeWp(12),
    padding: ResponsiveSizeWp(16),
    marginBottom: ResponsiveSizeWp(8),
    elevation: 2,
  },
  darkItem: {
    backgroundColor: '#1e1e1e',
  },
  selectedItem: {
    borderWidth: ResponsiveSizeWp(2),
    borderColor: '#0f2b46',
  },
  languageText: {
    fontSize: ResponsiveSizeWp(16),
    color: '#0f2b46',
  },
  darkText: {
    color: '#fff',
  },
});