import { getAuth as firebaseGetAuth } from '@react-native-firebase/auth';
import { getFirestore as firebaseGetFirestore } from '@react-native-firebase/firestore';

// Get the Auth instance using the modular API pattern
export const getAuth = () => {
  return firebaseGetAuth();
};

// Get the Firestore instance using the modular API pattern
export const getFirestore = () => {
  return firebaseGetFirestore();
}; 