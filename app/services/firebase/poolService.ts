// app/services/poolService.ts
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
  getFirestore,
  onSnapshot,
  runTransaction
} from '@react-native-firebase/firestore';
import { Pool, createPool } from '../../models/firebase/pool';

const POOLS_COLLECTION = 'pools';
const db = getFirestore();

/**
 * Creates a new pool in Firestore with Firestore document ID
 * @param name Pool name
 * @param ownerId User who owns the pool
 * @param stripeConnectAccountId Stripe Connect account ID
 * @param memberIds Array of member IDs (optional)
 * @param balance Initial balance (optional)
 * @returns The created pool with Firestore-generated ID
 */
export const createPoolInFirestore = async (
  name: string,
  ownerId: string,
  stripeConnectAccountId: string,
  memberIds: string[] = [],
  balance: number = 0
): Promise<Pool> => {
  // Create a new document reference with auto-generated ID
  const poolCollectionRef = collection(db, POOLS_COLLECTION);
  const poolRef = doc(poolCollectionRef);
  const docId = poolRef.id;
  
  // Create pool with the document ID
  const pool = createPool(
    docId, 
    name, 
    ownerId, 
    memberIds, 
    balance, 
    stripeConnectAccountId
  );
  
  // Set the document data
  await setDoc(poolRef, pool);
  
  return pool;
};

/**
 * Creates a pool with a specific ID
 */
export const createPoolWithId = async (
  id: string,
  name: string,
  ownerId: string,
  stripeConnectAccountId: string,
  memberIds: string[] = [],
  balance: number = 0
): Promise<Pool> => {
  const pool = createPool(id, name, ownerId, memberIds, balance, stripeConnectAccountId);
  
  const poolRef = doc(db, POOLS_COLLECTION, id);
  await setDoc(poolRef, pool);
  
  return pool;
};

/**
 * Retrieves a pool by ID
 */
export const getPoolById = async (poolId: string): Promise<Pool | null> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  const documentSnapshot = await getDoc(poolRef);
  
  const poolData = documentSnapshot.data();
  if (poolData) {
    // Ensure ID field is set from document ID
    return {
      ...(poolData as Pool),
      id: documentSnapshot.id
    };
  }
  
  return null;
};

/**
 * Updates a pool's information
 */
export const updatePool = async (poolId: string, updates: Partial<Pool>): Promise<void> => {
  // Remove id from updates as it shouldn't be updated
  const { id, ...updatesWithoutId } = updates;
  
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  await updateDoc(poolRef, updatesWithoutId);
};

/**
 * Adds a member to a pool
 */
export const addMemberToPool = async (poolId: string, userId: string): Promise<void> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  await updateDoc(poolRef, {
    memberIds: arrayUnion(userId)
  });
};

/**
 * Removes a member from a pool
 */
export const removeMemberFromPool = async (poolId: string, userId: string): Promise<void> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  await updateDoc(poolRef, {
    memberIds: arrayRemove(userId)
  });
};

/**
 * Updates a pool's balance
 */
export const updatePoolBalance = async (poolId: string, newBalance: number): Promise<void> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  await updateDoc(poolRef, {
    balance: newBalance
  });
};

/**
 * Increments a pool's balance by the specified amount
 * Uses a transaction to ensure consistency
 */
export const addFundsToPool = async (poolId: string, amount: number): Promise<void> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  
  await runTransaction(db, async (transaction) => {
    const poolSnapshot = await transaction.get(poolRef);
    const poolData = poolSnapshot.data();
    
    if (!poolData) {
      throw new Error('Pool does not exist!');
    }
    
    transaction.update(poolRef, {
      balance: poolData.balance + amount
    });
  });
};

/**
 * Decrements a pool's balance by the specified amount
 * Uses a transaction to ensure consistency
 */
export const withdrawFundsFromPool = async (poolId: string, amount: number): Promise<void> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  
  await runTransaction(db, async (transaction) => {
    const poolSnapshot = await transaction.get(poolRef);
    const poolData = poolSnapshot.data();
    
    if (!poolData) {
      throw new Error('Pool does not exist!');
    }
    
    if (poolData.balance < amount) {
      throw new Error('Insufficient funds in pool');
    }
    
    transaction.update(poolRef, {
      balance: poolData.balance - amount
    });
  });
};

/**
 * Deletes a pool (use with caution)
 */
export const deletePool = async (poolId: string): Promise<void> => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  await deleteDoc(poolRef);
};

/**
 * Gets all pools owned by a specific user
 */
export const getPoolsByOwner = async (ownerId: string): Promise<Pool[]> => {
  const poolsCollection = collection(db, POOLS_COLLECTION);
  const q = query(poolsCollection, where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Pool),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets all pools that a user is a member of
 */
export const getPoolsByMember = async (userId: string): Promise<Pool[]> => {
  const poolsCollection = collection(db, POOLS_COLLECTION);
  const q = query(poolsCollection, where('memberIds', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Pool),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Set up a real-time listener for a pool
 * Returns an unsubscribe function
 */
export const onPoolChanged = (poolId: string, onNext: (pool: Pool | null) => void): () => void => {
  const poolRef = doc(db, POOLS_COLLECTION, poolId);
  return onSnapshot(poolRef, documentSnapshot => {
    const poolData = documentSnapshot.data();
    if (poolData) {
      onNext({
        ...(poolData as Pool),
        id: documentSnapshot.id // Ensure ID field is set from document ID
      });
    } else {
      onNext(null);
    }
  });
}; 