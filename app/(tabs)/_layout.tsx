import React from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../_layout';

// Define Ionicons names used in the app
type IconName = 'add-circle' | 'add-circle-outline' | 'water' | 'water-outline' | 'paper-plane' | 'paper-plane-outline' | 'menu' | 'close';

// Tab icons configuration
const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  create: {
    active: 'add-circle',
    inactive: 'add-circle-outline',
  },
  pools: {
    active: 'water',
    inactive: 'water-outline',
  },
  transfer: {
    active: 'paper-plane',
    inactive: 'paper-plane-outline',
  },
};

export default function TabLayout() {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Navigation to hamburger menu
  const openMenu = () => {
    console.log('Opening menu from tabs');
    router.push('/menu' as any);
  };

  return (
    <Tabs
      screenOptions={({ route }) => {
        const routeName = route.name.split('/').pop() || '';
        
        return {
          // Show the header but hide the title
          headerShown: true,
          headerTitle: () => null, // Remove the title
          headerStyle: {
            backgroundColor: isDarkMode ? '#0A1121' : '#F5F7FA', // Light grey for light mode
            borderBottomWidth: isDarkMode ? 0 : 0.5,
            borderBottomColor: '#E5E7EB',
          },
          headerBackground: () => (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDarkMode ? '#0A1121' : '#F5F7FA', // Light grey for light mode
              }}
            />
          ),
          headerShadowVisible: false,
          // Move hamburger menu to left side
          headerLeft: () => (
            <TouchableOpacity 
              onPress={openMenu}
              style={{ marginLeft: 16 }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons 
                name="menu" 
                size={24} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} // Adapt icon color to theme
              />
            </TouchableOpacity>
          ),
          // Remove the right button
          headerRight: () => null,
          tabBarStyle: {
            position: 'absolute',
            height: 70 + Math.max(insets.bottom - 10, 0),
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: 'transparent',
            paddingTop: 5,
          },
          tabBarBackground: () => (
            <BlurView
              tint={isDarkMode ? 'dark' : 'light'}
              intensity={isDarkMode ? 80 : 95}
              className={isDarkMode ? 'bg-pool-dark/90' : 'bg-gray-100/95'}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTopWidth: isDarkMode ? 0 : 0.5,
                borderTopColor: '#E5E5E5',
              }}
            />
          ),
          tabBarIcon: ({ focused, color, size }) => {
            const iconConfig = TAB_ICONS[routeName];
            if (!iconConfig) return null;
            
            const iconName = focused ? iconConfig.active : iconConfig.inactive;
            
            // Use a custom tab bar icon for each tab
            if (routeName === 'pools') {
              // Center tab (Pools) - larger with special styling - always appears active
              return (
                <View style={styles.centerTabContainer}>
                  <View style={[
                    styles.centerTabIconContainer,
                    { backgroundColor: '#0074E4' } // Always use the focused/active background color
                  ]}>
                    <Ionicons 
                      name={iconConfig.active} // Always use the active icon
                      size={28} 
                      color="#FFFFFF" // Always use the focused/active icon color
                    />
                  </View>
                </View>
              );
            } else {
              // Side tabs (Create and Transfer)
              return (
                <View style={styles.sideTabContainer}>
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={color} 
                  />
                </View>
              );
            }
          },
          tabBarLabel: ({ focused, color }) => {
            // Custom label styling
            if (routeName === 'pools') {
              return (
                <Text style={[
                  styles.tabLabel, 
                  styles.poolsTabLabel,
                  { 
                    color: focused ? (isDarkMode ? '#FFFFFF' : '#0074E4') : (isDarkMode ? '#A3BFFA' : '#8A8A8A'),
                    fontWeight: focused ? '600' : '500'
                  }
                ]}>
                  Pools
                </Text>
              );
            } else {
              return (
                <Text style={[
                  styles.tabLabel, 
                  { 
                    color: focused ? (isDarkMode ? '#FFFFFF' : '#0074E4') : (isDarkMode ? '#A3BFFA' : '#8A8A8A'),
                    fontWeight: focused ? '600' : '500'
                  }
                ]}>
                  {routeName.charAt(0).toUpperCase() + routeName.slice(1)}
                </Text>
              );
            }
          },
          tabBarIconStyle: {
            // Adjust the size of the icon container
            marginTop: routeName === 'pools' ? -18 : 0, // Raise the center tab icon
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter',
            fontWeight: '500',
            paddingBottom: 5,
          },
          tabBarItemStyle: {
            paddingVertical: routeName === 'pools' ? 0 : 5,
          },
          tabBarActiveTintColor: isDarkMode ? '#FFFFFF' : '#0074E4',
          tabBarInactiveTintColor: isDarkMode ? '#A3BFFA' : '#8A8A8A',
        };
      }}
    >
      <Tabs.Screen
        name="create"
        options={{
          title: "Create"
        }}
      />
      <Tabs.Screen
        name="pools"
        options={{
          title: "Pools"
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: "Transfer"
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50, // Set to 0 to align with other tabs
  },
  centerTabIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  sideTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  poolsTabLabel: {
    marginTop: 20, // Increased to drop the Pools label further down to match lowered button
  }
}); 