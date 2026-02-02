// src/contexts/SettingsContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { useLocalization } from './LocalizationContext';

type SettingsType = {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
};

type SettingsContextType = {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  toggleNotifications: () => void;
};

const defaultSettings: SettingsType = {
  theme:  Appearance.getColorScheme() ?? 'light',
  language: 'da',
  notifications: true,
};

const SettingsContext = createContext<SettingsContextType>({
  ...defaultSettings,
  toggleTheme: () => {},
  setLanguage: () => {},
  toggleNotifications: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const { changeLanguage }=useLocalization();
  // Load settings from storage on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('@thinkly_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.log('Failed to load settings', error);
      }
    };
    loadSettings();
  }, []);

  // Save settings to storage when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('@thinkly_settings', JSON.stringify(settings));
      } catch (error) {
        console.log('Failed to save settings', error);
      }
    };
    saveSettings();
  }, [settings]);

  const toggleTheme = () => {
    setSettings(prev => {
      const theme = prev.theme === 'light' ? 'dark' : 'light'
      Appearance.setColorScheme(theme);
      return {
        ...prev,
        theme: theme
      }
    });
  };

  const setLanguage = (lang: string) => {
    changeLanguage(lang);
    setSettings(prev => ({ ...prev, language: lang }));
  };

  const toggleNotifications = () => {
    setSettings(prev => ({ ...prev, notifications: !prev.notifications }));
  };

  return (
    <SettingsContext.Provider
      value={{
        theme: settings.theme,
        language: settings.language,
        notifications: settings.notifications,
        toggleTheme,
        setLanguage,
        toggleNotifications,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);