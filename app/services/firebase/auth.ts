import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import googleServices from '../../../google-services.json';

GoogleSignin.configure({
  webClientId: googleServices.client[0].oauth_client[0].client_id,
});

export interface AuthError {
  code: string;
  message: string;
}

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<any> => {
  try {
    const auth = getAuth();
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<any> => {
  try {
    const auth = getAuth();
    return await signInWithEmailAndPassword(auth, email, password);
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
    const auth = getAuth();
    return signInWithCredential(auth, googleCredential);
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const auth = getAuth();
    await signOut(auth);
  } catch (error) {
    throw error;
  }
}; 