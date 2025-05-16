import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SplashScreen } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './components/ToastProvider';
import '../global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a context for theme management
type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  isUsingSystemTheme: boolean;
  toggleSystemTheme: () => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
  isUsingSystemTheme: true,
  toggleSystemTheme: () => {},
  toggleTheme: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme storage keys
const THEME_PREFERENCE_KEY = 'themePreference';
const SYSTEM_THEME_KEY = 'useSystemTheme';

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isUsingSystemTheme, setIsUsingSystemTheme] = useState(true);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load theme preferences from storage - only once at startup
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const [themePreference, systemThemeSetting] = await Promise.all([
          AsyncStorage.getItem(THEME_PREFERENCE_KEY),
          AsyncStorage.getItem(SYSTEM_THEME_KEY),
        ]);
        
        let newIsDarkMode = systemColorScheme === 'dark';
        let newIsUsingSystemTheme = true;

        if (systemThemeSetting !== null) {
          newIsUsingSystemTheme = systemThemeSetting === 'true';
          setIsUsingSystemTheme(newIsUsingSystemTheme);
        }
        
        if (!newIsUsingSystemTheme && themePreference !== null) {
          newIsDarkMode = themePreference === 'dark';
        }
        
        setIsDarkMode(newIsDarkMode);
        setIsThemeLoaded(true);
      } catch (error) {
        console.log('Error loading theme preferences', error);
        setIsThemeLoaded(true); // Still mark as loaded even if there's an error
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);

  // Save theme preferences when they change
  useEffect(() => {
    if (!isThemeLoaded) return; // Don't save until initial load is complete
    
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, isDarkMode ? 'dark' : 'light');
        await AsyncStorage.setItem(SYSTEM_THEME_KEY, isUsingSystemTheme.toString());
      } catch (error) {
        console.log('Error saving theme preferences', error);
      }
    };
    
    saveThemePreference();
  }, [isDarkMode, isUsingSystemTheme, isThemeLoaded]);

  // Update system UI colors to match theme
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDarkMode ? '#0A1121' : '#F5F7FA');
  }, [isDarkMode]);

  // Update dark mode when system theme changes (but only if using system theme)
  useEffect(() => {
    if (isUsingSystemTheme && isThemeLoaded) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, isUsingSystemTheme, isThemeLoaded]);

  // Optimized handlers for theme toggling
  const toggleSystemTheme = useCallback(() => {
    setIsUsingSystemTheme(prev => {
      const newValue = !prev;
      // If switching to system theme, immediately apply system color scheme
      if (newValue) {
        setIsDarkMode(systemColorScheme === 'dark');
      }
      return newValue;
    });
  }, [systemColorScheme]);

  const toggleTheme = useCallback(() => {
    if (isUsingSystemTheme) {
      // First switch to manual mode, then toggle
      setIsUsingSystemTheme(false);
      setIsDarkMode(prev => !prev);
    } else {
      // Just toggle the theme
      setIsDarkMode(prev => !prev);
    }
  }, [isUsingSystemTheme]);

  // Load fonts from Google Fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter': 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
    'Inter-Bold': 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2',
  });

  // Hide the splash screen after the fonts have loaded
  useEffect(() => {
    if ((fontsLoaded || fontError) && isThemeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isThemeLoaded]);

  // If the fonts haven't loaded yet, return null to continue showing the splash screen
  if ((!fontsLoaded && !fontError) || !isThemeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        isDarkMode, 
        setIsDarkMode, 
        isUsingSystemTheme, 
        toggleSystemTheme,
        toggleTheme
      }}
    >
      <AuthProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Stack 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: {
                  backgroundColor: isDarkMode ? '#0A1121' : '#F5F7FA',
                }
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen 
                name="(auth)" 
                options={{
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen 
                name="(onboarding)" 
                options={{
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen 
                name="menu" 
                options={{ 
                  presentation: 'modal', 
                  animation: 'slide_from_bottom',
                  contentStyle: {
                    backgroundColor: 'transparent',
                  }
                }} 
              />
              <Stack.Screen 
                name="profile" 
                options={{
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
          </ToastProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}
