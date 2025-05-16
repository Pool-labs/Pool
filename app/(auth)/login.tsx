import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useAuthService } from '../services/firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user } = useAuth();
  const authService = useAuthService();
  
  // Add debug log to check if this component mounts
  useEffect(() => {
    console.log('LOGIN SCREEN MOUNTED');
  }, []);
  
  // If user is already authenticated, redirect to main app
  useEffect(() => {
    if (user) {
      console.log('User already authenticated, redirecting to main app');
      router.replace('/(tabs)/pools' as any);
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) {
      // This will be handled by our toast notifications from the hook
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        console.log('Signing up with email:', email);
        await authService.signUp(email, password);
        // Toast notification handled by service
      } else {
        console.log('Signing in with email:', email);
        await authService.signIn(email, password);
        // Toast notification handled by service
      }
    } catch (error) {
      // Error already handled by the authService
      console.error('Auth error handled by service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log('Signing in with Google');
      await authService.googleSignIn();
      // Toast notification handled by service
    } catch (error) {
      // Error already handled by the authService
      console.error('Google sign-in error handled by service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#0074E4']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Pressable
                onPress={handleAuth}
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0074E4" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                style={styles.googleButton}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsSignUp(!isSignUp)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#0074E4',
    fontWeight: 'bold',
    fontSize: 18,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    color: 'white',
    fontSize: 16,
  },
}); 