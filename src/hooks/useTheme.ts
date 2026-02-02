// src/hooks/useTheme.ts
import { useSettings } from '../contexts/SettingsContext';

export const useTheme = () => {
  const { theme } = useSettings();

  const themeStyles = {
    backgroundColor: theme === 'dark' ? '#121212' : '#f2f0e8',
    cardBackgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
    nameTextColor: theme === 'dark' ? '#fff' : '#0f2b46',
    levelTextColor: theme === 'dark' ? '#aaa' : '#666',
    xpBarColor: theme === 'dark' ? '#2a2a2a' : '#eee',
    xpFillColor: theme === 'dark' ? '#90caf9' : '#0f2b46',
    successColor: theme === 'dark' ? '#81c784' : '#4CAF50',
    borderColor: theme === 'dark' ? '#333' : '#ddd',
    streakColor: theme === 'dark' ? '#ff8a50' : '#FF5722',
    shadowColor: theme === 'dark' ? '#000' : '#000',
    selectedOptionColor: theme === 'dark' ? '#263238' : '#e3f2fd',
    dividerBackgroundColor: theme === 'dark' ? '#e0e0e0' : '#e0e0e0',
    conceptTextColor: theme === 'dark' ? '#e0e0e0' : '#333',
    optionColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
    badgeCardBg: theme === 'dark' ? '#2a2a2a' : 'rgba(255, 254, 248, 1)',
    badgesBg: 'rgba(223, 218, 210, 1)',
    selectedCourseType: 'rgba(0, 123, 255, 1)',
    // Add more theme-specific styles
  };

  return themeStyles;
};