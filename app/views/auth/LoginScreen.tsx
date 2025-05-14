import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../../services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        className="flex-1 px-6 pt-12"
      >
        <View className="flex-1 justify-center">
          <Text className="text-4xl font-bold text-white mb-8">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>

          <View className="space-y-4">
            <TextInput
              className="bg-white/10 text-white p-4 rounded-xl"
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              className="bg-white/10 text-white p-4 rounded-xl"
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              onPress={handleAuth}
              disabled={isLoading}
              className="bg-white p-4 rounded-xl items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#4F46E5" />
              ) : (
                <Text className="text-indigo-600 font-bold text-lg">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              className="bg-white/10 p-4 rounded-xl items-center flex-row justify-center space-x-2"
            >
              <Text className="text-white font-bold text-lg">Continue with Google</Text>
            </Pressable>

            <Pressable
              onPress={() => setIsSignUp(!isSignUp)}
              className="items-center mt-4"
            >
              <Text className="text-white">
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
} 