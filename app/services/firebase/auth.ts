// Modify app/services/firebase/auth.ts to add wallet creation

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import googleServices from '../../../google-services.json';
import { getAuth } from './config';
import { useFirebaseService } from './serviceHandler';
import firestore from '@react-native-firebase/firestore';


import { createUserWallet } from '../WalletService';

GoogleSignin.configure({
  webClientId: googleServices.client[0].oauth_client[0].client_id,
});

export interface AuthError {
  code: string;
  message: string;
}

// Base auth functions - no error toast handling

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<any> => {
  try {
    const authInstance = getAuth();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    
    // Create a Firestore document for the new user
    const db = firestore();
    // Set initial user data
    await db.collection('users').doc(userCredential.user.uid).set({
      email: email,
      createdAt: new Date().toISOString(),
      // Add any other user fields needed
    });
    
    // Create wallet for the new user (non-blocking)
    createUserWallet(userCredential.user.uid, email)
      .catch(err => console.error(`Failed to create wallet: ${err.message}`));
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<any> => {
  try {
    const authInstance = getAuth();
    return await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<any> => {
  try {
    // Ensure Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in and get the user's ID token
    const result = await GoogleSignin.signIn();

    const idToken = (result as any).idToken ?? (result as any).data?.idToken;

    if (!idToken) {
      throw new Error('No ID token found in Google sign-in result');
    }

    // Create a Firebase credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    // Sign in to Firebase with the credential
    const authInstance = getAuth();
    const userCredential = await signInWithCredential(authInstance, googleCredential);
    
    // Check if this is a new user by querying Firestore
    const db = firestore();
    const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
    
    if (!userDoc.exists) {
      // This is a new user - create their document
      await db.collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        createdAt: new Date().toISOString(),
        // Add any other user fields needed
      });
      
      // Create wallet for the new Google user (non-blocking)
      createUserWallet(userCredential.user.uid, userCredential.user.email || '')
        .catch(err => console.error(`Failed to create wallet: ${err.message}`));
    }
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const authInstance = getAuth();
    await signOut(authInstance);
  } catch (error) {
    throw error;
  }
};

/**
 * Hook to provide authentication functions with error handling and toast notifications
 */
export const useAuthService = () => {
  const { executeOperation } = useFirebaseService();

  /**
   * Sign up with email and password with error handling
   */
  const signUp = async (email: string, password: string): Promise<any | null> => {
    return executeOperation(
      () => signUpWithEmail(email, password),
      {
        operationName: 'Sign up',
        successMessage: 'Account created successfully',
        errorMessage: 'Failed to create account',
      }
    );
  };

  /**
   * Sign in with email and password with error handling
   */
  const signIn = async (email: string, password: string): Promise<any | null> => {
    return executeOperation(
      () => signInWithEmail(email, password),
      {
        operationName: 'Sign in',
        successMessage: 'Signed in successfully',
        errorMessage: 'Failed to sign in',
      }
    );
  };

  /**
   * Sign in with Google with error handling
   */
  const googleSignIn = async (): Promise<any | null> => {
    return executeOperation(
      () => signInWithGoogle(),
      {
        operationName: 'Google sign in',
        successMessage: 'Signed in with Google successfully',
        errorMessage: 'Failed to sign in with Google',
      }
    );
  };

  /**
   * Logout with error handling
   */
  const signOut = async (): Promise<void | null> => {
    return executeOperation(
      () => logout(),
      {
        operationName: 'Sign out',
        successMessage: 'Signed out successfully',
        errorMessage: 'Failed to sign out',
      }
    );
  };

  return {
    signUp,
    signIn,
    googleSignIn,
    signOut,
  };
};