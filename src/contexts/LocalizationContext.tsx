import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Import all language files
import { label as da } from '../localization/danish';
import { label as en } from '../localization/english';
import { label as fr } from '../localization/french';
import { label as de } from '../localization/german';
import { label as es } from '../localization/spanish';

const LANG_KEY = 'app_language';

// Define the type for the translation object based on one of the imported labels
type TranslationType = typeof en;

// Available languages
const languages: Record<string, TranslationType> = { en, es, fr, de, da };

interface LocalizationContextType {
    t: TranslationType;
    language: string;
    changeLanguage: (lng: string) => void;
}

// Create Context
const LocalizationContext = createContext<LocalizationContextType>({
    t: en,            // default translation (English)
    language: 'en',   // default language
    changeLanguage: (lng: string) => { }
});

// Provider Component
export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<string>('da');
    const [t, setT] = useState<TranslationType>(da);

    // Load saved language from AsyncStorage
    useEffect(() => {
        (async () => {
            try {
                const savedLang = await AsyncStorage.getItem(LANG_KEY);
                if (savedLang && languages[savedLang]) {
                    setLanguage(savedLang);
                    setT(languages[savedLang]);
                }
            } catch (error) {
                console.log('Error loading language:', error);
            }
        })();
    }, []);

    // Function to change language
    const changeLanguage = async (lang: string) => {
        if (!languages[lang]) return;
        setLanguage(lang);
        setT(languages[lang]);
        await AsyncStorage.setItem(LANG_KEY, lang);
    };

    return (
        <LocalizationContext.Provider value={{ t, language, changeLanguage }}>
            {children}
        </LocalizationContext.Provider>
    );
};

// Custom hook for easy usage
export const useLocalization = () => useContext(LocalizationContext);
