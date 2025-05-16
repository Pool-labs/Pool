import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getAuth } from './services/firebase/config';

// Ensure we import the CSS file at the root of the app
import '../global.css';

export default function Index() {
  const router = useRouter();
  const { user, userData, isLoading } = useAuth();
  
  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load
    
    // If user is authenticated but not in database, log them out
    if (user && !userData) {
      console.log('Initial app load: User authenticated but not in database, logging out');
      const authInstance = getAuth();
      authInstance.signOut().then(() => {
        router.replace('/(auth)/login' as any);
      });
    } else if (user) {
      // Authenticated user with database presence - redirect to pools tab
      router.replace('/(tabs)/pools' as any);
    } else {
      // Not authenticated - redirect to login
      router.replace('/(auth)/login' as any);
    }
  }, [router, user, userData, isLoading]);

  // Return null as this component will not render anything
  return null;
}
