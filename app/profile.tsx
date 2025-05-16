import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  const goBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-pool-dark' : 'bg-white'}`}>
      {/* Header */}
      <View className={`flex-row items-center h-16 px-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <Pressable 
          onPress={goBack} 
          className="p-2" 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? 'white' : '#1A2526'} 
          />
        </Pressable>
        <Text className={`ml-4 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-pool-dark'}`}>
          Profile
        </Text>
      </View>
      
      {/* Content */}
      <View className="flex-1 justify-center items-center p-6">
        <Text className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-pool-dark'}`}>
          Profile Screen
        </Text>
        <Text className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          This is a placeholder for the profile screen.
        </Text>
      </View>
    </SafeAreaView>
  );
} 