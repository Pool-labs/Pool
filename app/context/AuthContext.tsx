import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { getUserByEmail } from '../services/firebase/userService';
import { getAuth } from '../services/firebase/config';

// Define the shape of our auth context
interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userData: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateUserData: (data: any) => void; // Function to update user data in memory
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
  signOut: async () => {},
  updateUserData: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Main authentication provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userChecked, setUserChecked] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Function to sign out
  const signOut = async () => {
    try {
      console.log('Signing out user...');
      const authInstance = getAuth();
      await authInstance.signOut();
      
      // Clear user data
      setUser(null);
      setUserData(null);
      
      // Explicit navigation after logout
      console.log('Redirecting to login after signout...');
      router.replace('/(auth)/login' as any);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Function to update user data in memory
  const updateUserData = (data: any) => {
    setUserData((prevData: any) => ({
      ...prevData,
      ...data
    }));
  };

  // Protected route logic
  useEffect(() => {
    if (!isLoading && userChecked) {
      console.log('Route protection check, user:', user ? 'authenticated' : 'not authenticated');
      console.log('Current segment:', segments[0]);
      console.log('User data exists:', !!userData);
      console.log('Onboarding step:', userData?.onboardingStep);
      
      // Check if user is in auth or onboarding route group
      const isAuthGroup = segments[0] === '(auth)';
      const isOnboardingGroup = segments[0] === '(onboarding)';
      const isTabsGroup = segments[0] === '(tabs)';
      const isMenuPath = segments[0] === 'menu' || segments[0] === 'profile';
      
      if (!user && !isAuthGroup) {
        // If not authenticated and not in auth group, redirect to login
        console.log('Not authenticated and not in auth group, redirecting to login');
        router.replace('/(auth)/login' as any);
      } else if (user && !userData && !isOnboardingGroup && !isAuthGroup && !isMenuPath) {
        // User is authenticated but doesn't exist in Firestore, redirect to onboarding
        console.log('User authenticated but not in Firestore, redirecting to onboarding');
        router.replace('/(onboarding)/step1' as any);
      } else if (user && userData && (userData.onboardingStep === 0 || userData.onboardingStep === undefined) && !isOnboardingGroup && !isAuthGroup && !isMenuPath) {
        // User exists but hasn't started onboarding yet (has default onboarding step value)
        console.log('User exists but needs to start onboarding (step 0), redirecting to step 1');
        router.replace('/(onboarding)/step1' as any);
      } else if (user && userData && isAuthGroup) {
        // User is authenticated and exists in Firestore, redirect to main app
        console.log('User authenticated and in Firestore, redirecting to pools');
        router.replace('/(tabs)/pools' as any);
      } else if (user && userData && userData.onboardingStep === 1 && !isOnboardingGroup && !isTabsGroup && !isMenuPath) {
        // User started but not completed onboarding
        console.log('User started onboarding, redirecting to step 2');
        router.replace('/(onboarding)/step2' as any);
      } else if (user && userData && userData.onboardingStep === 2 && isOnboardingGroup) {
        // User has completed onboarding but is still on onboarding screen
        console.log('Onboarding complete, redirecting to pools');
        router.replace('/(tabs)/pools' as any);
      }
    }
  }, [user, userData, segments, isLoading, userChecked, router]);

  // Firebase auth state listener
  useEffect(() => {
    console.log('Setting up Firebase auth state listener');
    const authInstance = getAuth();
    const unsubscribe = authInstance.onAuthStateChanged(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'user logged in' : 'user logged out');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get the user data from Firestore
          const userDataFromFirestore = await getUserByEmail(firebaseUser.email || '');
          setUserData(userDataFromFirestore);
          
          // Mark that we've checked for user data
          setUserChecked(true);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Even if there's an error, we've checked for user data
          setUserChecked(true);
        }
      } else {
        // User is logged out, ensure userData is cleared
        setUserData(null);
        setUserChecked(true);
      }
      
      setIsLoading(false);
    });

    // Clean up listener on unmount
    return unsubscribe;
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-pool-dark">
        <ActivityIndicator size="large" color="#0074E4" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      isLoading, 
      signOut,
      updateUserData 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 