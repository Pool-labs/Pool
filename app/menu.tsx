import React, { useEffect } from 'react';
import { View, Text, Pressable, Switch, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './_layout';
import { useAuth } from './context/AuthContext';
import Constants from 'expo-constants';

type MenuItemProps = {
  icon: string;
  label: string;
  onPress: () => void;
  isDarkMode: boolean;
};

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, isDarkMode }) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center py-4 px-6 border-b border-gray-200 dark:border-gray-700"
    style={styles.menuItem}
  >
    <Ionicons name={icon as any} size={24} color={isDarkMode ? 'white' : '#1A2526'} />
    <Text className={`ml-4 text-base ${isDarkMode ? 'text-white' : 'text-pool-dark'}`}>
      {label}
    </Text>
    <View className="ml-auto">
      <Ionicons name="chevron-forward" size={20} color={isDarkMode ? 'white' : '#1A2526'} />
    </View>
  </Pressable>
);

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    isDarkMode, 
    isUsingSystemTheme,
    toggleTheme,
    toggleSystemTheme
  } = useTheme();
  const { signOut, userData } = useAuth();

  // Log that the menu screen is rendering for debugging
  useEffect(() => {
    console.log('Menu screen is rendering');
  }, []);
  
  // Close menu and go back to tabs
  const closeMenu = () => {
    console.log('Closing menu');
    // Check if onboarding is complete (step 2) or if we have valid userData
    if (userData && (userData.onboardingStep === 2 || userData.id)) {
      // User has completed onboarding, go to pools tab
      router.replace('/(tabs)/pools' as any);
    } else {
      // Otherwise just go back
      router.back();
    }
  };

  // Navigate to profile screen (we've created this)
  const goToProfile = () => {
    router.push('/profile' as any);
  };

  // Handle navigation to screens that don't exist yet
  const navigateTo = (path: string) => {
    console.log(`Navigating to ${path}`);
    
    // For the join-pool screen, navigate directly to it
    if (path === '/join-pool') {
      router.push(path as any);
      return;
    }
    
    // For other screens that don't exist yet, redirect to pools tab
    router.replace('/(tabs)/pools' as any);
    // In a real app, you'd create these screens and navigate to them:
    // router.navigate(path as any);
  };

  // Handle sign out
  const handleSignOut = async () => {
    console.log('Signing out from menu...');
    try {
      // Navigate directly to login screen first
      router.replace('/(auth)/login' as any);
      
      // Then sign out
      setTimeout(async () => {
        await signOut();
      }, 100);
    } catch (error) {
      console.error('Error in sign out process:', error);
    }
  };

  const themeClass = isDarkMode ? 'bg-pool-dark' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-pool-dark';

  return (
    <View className={`flex-1 ${themeClass}`} style={StyleSheet.absoluteFill}>
      <SafeAreaView className="flex-1">
        {/* Header with close button */}
        <View 
          className={`flex-row items-center justify-between px-4 h-16 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ paddingTop: insets.top > 0 ? 0 : 8 }}
        >
          <Pressable 
            onPress={closeMenu} 
            className="p-2"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="close" size={28} color={isDarkMode ? 'white' : '#1A2526'} />
          </Pressable>
          <Text className={`text-lg font-bold ${textClass}`}>
            Menu
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* User profile summary */}
        <View className={`px-6 py-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-pool-blue justify-center items-center">
              <Text className="text-white text-2xl font-bold">
                {userData?.firstName && userData?.lastName 
                  ? `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`
                  : userData?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View className="ml-4">
              <Text className={`text-lg font-bold ${textClass}`}>
                {userData?.firstName && userData?.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : 'User'}
              </Text>
              <Text className="text-gray-500">{userData?.email || ''}</Text>
            </View>
            <Pressable 
              onPress={goToProfile}
              className="ml-auto"
            >
              <Text className="text-pool-blue">Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Menu items */}
        <ScrollView className="flex-1">
          <MenuItem
            icon="person"
            label="My Profile"
            onPress={goToProfile}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="people"
            label="Join Pool"
            onPress={() => navigateTo('/join-pool')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="card"
            label="Payment Methods"
            onPress={() => navigateTo('/payment-methods')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="receipt"
            label="Transaction History"
            onPress={() => navigateTo('/transactions')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="repeat"
            label="Manage Subscriptions"
            onPress={() => navigateTo('/subscriptions')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="notifications"
            label="Notifications"
            onPress={() => navigateTo('/notifications')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="shield-checkmark"
            label="Security"
            onPress={() => navigateTo('/security')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="settings"
            label="Account Settings"
            onPress={() => navigateTo('/settings')}
            isDarkMode={isDarkMode}
          />
          <MenuItem
            icon="help-circle"
            label="Help & Support"
            onPress={() => navigateTo('/support')}
            isDarkMode={isDarkMode}
          />

          {/* Theme settings */}
          <View className="pt-6 px-6">
            <Text className={`text-lg font-bold mb-4 ${textClass}`}>
              Appearance
            </Text>
            
            {/* Dark mode toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={24} 
                  color={isDarkMode ? 'white' : '#1A2526'} 
                />
                <Text className={`ml-4 text-base ${textClass}`}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                disabled={isUsingSystemTheme}
                trackColor={{ false: '#767577', true: '#0074E4' }}
              />
            </View>
            
            {/* System theme toggle */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <Ionicons 
                  name="phone-portrait" 
                  size={24} 
                  color={isDarkMode ? 'white' : '#1A2526'} 
                />
                <Text className={`ml-4 text-base ${textClass}`}>
                  Use Device Settings
                </Text>
              </View>
              <Switch
                value={isUsingSystemTheme}
                onValueChange={toggleSystemTheme}
                trackColor={{ false: '#767577', true: '#0074E4' }}
              />
            </View>
          </View>

          {/* Sign out button */}
          <View className="p-6 mb-8">
            <Pressable 
              onPress={handleSignOut}
              className="py-3 rounded-full border border-red-500 items-center"
            >
              <Text className="text-red-500 font-semibold">Sign Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    width: '100%',
  },
}); 