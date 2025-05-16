// app/services/firebase/userService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot
} from '@react-native-firebase/firestore';
import { User, createUser } from '../../models/firebase/user';
import { getFirestore } from './config';
import { useFirebaseService } from './serviceHandler';

const USERS_COLLECTION = 'users';
const db = getFirestore();

/**
 * Creates a new user in Firestore with Firestore document ID
 * @param email User's email
 * @param name User's name
 * @param cryptoWalletId Crypto wallet ID
 * @param customerId Stripe customer ID
 * @param poolIds Array of pool IDs (optional)
 * @param paymentMethodId Payment method ID (optional)
 * @param cardIds Array of card IDs (optional)
 * @returns The created user with Firestore-generated ID
 */
export const createUserInFirestore = async (
  email: string, 
  name: string, 
  cryptoWalletId: string,
  customerId: string,
  poolIds: string[] = [], 
  paymentMethodId?: string, 
  cardIds?: string[]
): Promise<User> => {
  // Create a new document reference with auto-generated ID
  const userCollectionRef = collection(db, USERS_COLLECTION);
  const userRef = doc(userCollectionRef);
  const docId = userRef.id;
  
  // Create user with the document ID
  const user = createUser(
    docId, 
    email, 
    name, 
    poolIds, 
    cryptoWalletId, 
    customerId, 
    paymentMethodId, 
    cardIds
  );
  
  // Log user object for debugging
  console.log('User object before saving:', JSON.stringify(user));
  
  // Set the document data
  try {
    await setDoc(userRef, user);
    console.log('User document written successfully with ID:', docId);
  } catch (error) {
    console.error('Error adding user document:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
  
  return user;
};

/**
 * Creates a user with a specific ID (e.g., Auth UID)
 */
export const createUserWithId = async (
  id: string,
  email: string,
  name: string,
  cryptoWalletId: string,
  customerId: string,
  poolIds: string[] = [],
  paymentMethodId?: string,
  cardIds?: string[]
): Promise<User> => {
  const user = createUser(
    id, 
    email, 
    name, 
    poolIds, 
    cryptoWalletId, 
    customerId, 
    paymentMethodId, 
    cardIds
  );
  
  
  const userRef = doc(db, USERS_COLLECTION, id);
  try {
    await setDoc(userRef, user);
    console.log('User document written successfully with provided ID:', id);
  } catch (error) {
    console.error('Error adding user document with provided ID:', error);
    throw error;
  }
  
  return user;
};

/**
 * Retrieves a user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  try {
    const documentSnapshot = await getDoc(userRef);
    
    const userData = documentSnapshot.data();
    if (userData) {
      // Ensure ID field is set from document ID
      return {
        ...(userData as User),
        id: documentSnapshot.id
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Retrieves a user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersCollection = collection(db, USERS_COLLECTION);
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      // Ensure ID field is set from document ID
      return {
        ...(docSnapshot.data() as User),
        id: docSnapshot.id
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Updates a user's information
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  // Remove id from updates as it shouldn't be updated
  const { id, ...updatesWithoutId } = updates;
  
  // Log updates for debugging
  console.log('User updates:', JSON.stringify(updatesWithoutId));
  
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, updatesWithoutId);
    console.log('User document updated successfully:', userId);
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

/**
 * Adds a pool ID to a user's poolIds array
 */
export const addPoolToUser = async (userId: string, poolId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      poolIds: arrayUnion(poolId)
    });
    console.log('Pool added to user successfully:', poolId);
  } catch (error) {
    console.error('Error adding pool to user:', error);
    throw error;
  }
};

/**
 * Removes a pool ID from a user's poolIds array
 */
export const removePoolFromUser = async (userId: string, poolId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      poolIds: arrayRemove(poolId)
    });
    console.log('Pool removed from user successfully:', poolId);
  } catch (error) {
    console.error('Error removing pool from user:', error);
    throw error;
  }
};

/**
 * Adds a card ID to a user's cardIds array
 */
export const addCardToUser = async (userId: string, cardId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      cardIds: arrayUnion(cardId)
    });
    console.log('Card added to user successfully:', cardId);
  } catch (error) {
    console.error('Error adding card to user:', error);
    throw error;
  }
};

/**
 * Removes a card ID from a user's cardIds array
 */
export const removeCardFromUser = async (userId: string, cardId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      cardIds: arrayRemove(cardId)
    });
    console.log('Card removed from user successfully:', cardId);
  } catch (error) {
    console.error('Error removing card from user:', error);
    throw error;
  }
};

/**
 * Updates a user's payment method
 */
export const updateUserPaymentMethod = async (userId: string, paymentMethodId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      paymentMethodId
    });
    console.log('User payment method updated successfully:', paymentMethodId);
  } catch (error) {
    console.error('Error updating user payment method:', error);
    throw error;
  }
};

/**
 * Deletes a user (use with caution)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    console.log('User deleted successfully:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Lists all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, USERS_COLLECTION);
    const querySnapshot = await getDocs(usersCollection);
    
    return querySnapshot.docs.map(doc => ({
      ...(doc.data() as User),
      id: doc.id // Ensure ID field is set from document ID
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Set up a real-time listener for a user
 * Returns an unsubscribe function
 */
export const onUserChanged = (userId: string, onNext: (user: User | null) => void): () => void => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    return onSnapshot(userRef, documentSnapshot => {
      const userData = documentSnapshot.data();
      if (userData) {
        onNext({
          ...(userData as User),
          id: documentSnapshot.id // Ensure ID field is set from document ID
        });
      } else {
        onNext(null);
      }
    });
  } catch (error) {
    console.error('Error setting up user change listener:', error);
    // Return a no-op unsubscribe function in case of error
    return () => {};
  }
};

/**
 * Hook to provide user service functions with error handling and toast notifications
 */
export const useUserService = () => {
  const { executeOperation } = useFirebaseService();

  /**
   * Creates a new user with error handling and toast notification
   */
  const createUser = async (
    email: string, 
    name: string, 
    cryptoWalletId: string,
    customerId: string,
    poolIds: string[] = [], 
    paymentMethodId?: string, 
    cardIds?: string[]
  ): Promise<User | null> => {
    return executeOperation(
      () => createUserInFirestore(email, name, cryptoWalletId, customerId, poolIds, paymentMethodId, cardIds),
      {
        operationName: 'Create user',
        successMessage: 'User account created successfully',
      }
    );
  };

  /**
   * Creates a user with specific ID with error handling
   */
  const createUserWithSpecificId = async (
    id: string,
    email: string,
    name: string,
    cryptoWalletId: string,
    customerId: string,
    poolIds: string[] = [],
    paymentMethodId?: string,
    cardIds?: string[]
  ): Promise<User | null> => {
    return executeOperation(
      () => createUserWithId(id, email, name, cryptoWalletId, customerId, poolIds, paymentMethodId, cardIds),
      {
        operationName: 'Create user',
        successMessage: 'User account created successfully',
      }
    );
  };

  /**
   * Retrieves a user by ID with error handling
   */
  const getUser = async (userId: string): Promise<User | null> => {
    return executeOperation(
      () => getUserById(userId),
      {
        operationName: 'Get user',
        showSuccessToast: false,
      }
    );
  };

  /**
   * Updates a user with error handling
   */
  const updateUserData = async (userId: string, updates: Partial<User>): Promise<void | null> => {
    return executeOperation(
      () => updateUser(userId, updates),
      {
        operationName: 'Update user',
        successMessage: 'User profile updated successfully',
      }
    );
  };

  /**
   * Adds a pool to user with error handling
   */
  const addPool = async (userId: string, poolId: string): Promise<void | null> => {
    return executeOperation(
      () => addPoolToUser(userId, poolId),
      {
        operationName: 'Add pool',
        successMessage: 'Added to pool successfully',
      }
    );
  };

  /**
   * Removes a pool from user with error handling
   */
  const removePool = async (userId: string, poolId: string): Promise<void | null> => {
    return executeOperation(
      () => removePoolFromUser(userId, poolId),
      {
        operationName: 'Remove pool',
        successMessage: 'Removed from pool successfully',
      }
    );
  };

  /**
   * Deletes a user with error handling
   */
  const deleteUserAccount = async (userId: string): Promise<void | null> => {
    return executeOperation(
      () => deleteUser(userId),
      {
        operationName: 'Delete account',
        successMessage: 'Account deleted successfully',
      }
    );
  };

  return {
    createUser,
    createUserWithSpecificId,
    getUser,
    updateUserData,
    addPool,
    removePool,
    deleteUserAccount,
    // Add more wrapped functions as needed
  };
}; 