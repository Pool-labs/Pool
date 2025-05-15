// app/services/firebase/paymentService.ts
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
  orderBy,
  limit,
  getFirestore,
  onSnapshot,
  writeBatch
} from '@react-native-firebase/firestore';
import { Payment, createPayment } from '../../models/firebase/payment';

const PAYMENTS_COLLECTION = 'payments';
const db = getFirestore();

/**
 * Creates a new payment record in Firestore with Firestore document ID
 * @param userId User ID associated with the payment
 * @param poolId Pool ID associated with the payment
 * @param amount Payment amount
 * @param paymentMethod Payment method identifier
 * @param status Payment status (default: 'pending')
 * @returns The created payment with Firestore-generated ID
 */
export const createPaymentInFirestore = async (
  userId: string,
  poolId: string,
  amount: number,
  paymentMethod: string,
  status: 'pending' | 'completed' | 'failed' = 'pending'
): Promise<Payment> => {
  // Create a new document reference with auto-generated ID
  const paymentCollectionRef = collection(db, PAYMENTS_COLLECTION);
  const paymentRef = doc(paymentCollectionRef);
  const docId = paymentRef.id;
  
  // Create payment with the document ID
  const payment = createPayment(
    docId, 
    userId, 
    poolId, 
    amount, 
    paymentMethod, 
    status
  );
  
  // Set the document data
  await setDoc(paymentRef, payment);
  
  return payment;
};

/**
 * Creates a payment with a specific ID
 */
export const createPaymentWithId = async (
  id: string,
  userId: string,
  poolId: string,
  amount: number,
  paymentMethod: string,
  status: 'pending' | 'completed' | 'failed' = 'pending'
): Promise<Payment> => {
  const payment = createPayment(id, userId, poolId, amount, paymentMethod, status);
  
  const paymentRef = doc(db, PAYMENTS_COLLECTION, id);
  await setDoc(paymentRef, payment);
  
  return payment;
};

/**
 * Retrieves a payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  const documentSnapshot = await getDoc(paymentRef);
  
  const paymentData = documentSnapshot.data();
  if (paymentData) {
    // Ensure ID field is set from document ID
    return {
      ...(paymentData as Payment),
      id: documentSnapshot.id
    };
  }
  
  return null;
};

/**
 * Updates a payment's information
 */
export const updatePayment = async (paymentId: string, updates: Partial<Payment>): Promise<void> => {
  // Remove id from updates as it shouldn't be updated
  const { id, ...updatesWithoutId } = updates;
  
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, updatesWithoutId);
};

/**
 * Updates a payment's status
 */
export const updatePaymentStatus = async (paymentId: string, status: 'pending' | 'completed' | 'failed'): Promise<void> => {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, {
    status
  });
};

/**
 * Gets all payments made by a specific user
 */
export const getPaymentsByUser = async (userId: string): Promise<Payment[]> => {
  const paymentsCollection = collection(db, PAYMENTS_COLLECTION);
  const q = query(
    paymentsCollection, 
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Payment),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets all payments for a specific pool
 */
export const getPaymentsByPool = async (poolId: string): Promise<Payment[]> => {
  const paymentsCollection = collection(db, PAYMENTS_COLLECTION);
  const q = query(
    paymentsCollection, 
    where('poolId', '==', poolId),
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Payment),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets the most recent payments
 */
export const getRecentPayments = async (count: number = 10): Promise<Payment[]> => {
  const paymentsCollection = collection(db, PAYMENTS_COLLECTION);
  const q = query(
    paymentsCollection, 
    orderBy('timestamp', 'desc'),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Payment),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets payments with a specific status
 */
export const getPaymentsByStatus = async (status: 'pending' | 'completed' | 'failed'): Promise<Payment[]> => {
  const paymentsCollection = collection(db, PAYMENTS_COLLECTION);
  const q = query(
    paymentsCollection, 
    where('status', '==', status),
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Payment),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Process multiple payments in a batch
 */
export const batchProcessPayments = async (
  payments: { 
    userId: string, 
    poolId: string, 
    amount: number, 
    paymentMethod: string,
    status?: 'pending' | 'completed' | 'failed'
  }[]
): Promise<string[]> => {
  // Create a batch
  const batch = writeBatch(db);
  const paymentIds: string[] = [];
  
  // Add each payment to the batch
  payments.forEach(payment => {
    // Create a document reference with auto-generated ID
    const paymentCollectionRef = collection(db, PAYMENTS_COLLECTION);
    const paymentRef = doc(paymentCollectionRef);
    const docId = paymentRef.id;
      
    // Save the ID
    paymentIds.push(docId);
    
    // Create payment with the document ID
    const newPayment = createPayment(
      docId, 
      payment.userId, 
      payment.poolId, 
      payment.amount, 
      payment.paymentMethod, 
      payment.status || 'pending'
    );
    
    // Add to batch
    batch.set(paymentRef, newPayment);
  });
  
  // Commit the batch
  await batch.commit();
  
  // Return array of generated IDs
  return paymentIds;
};

/**
 * Deletes a payment (use with caution)
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await deleteDoc(paymentRef);
};

/**
 * Set up a real-time listener for payments of a certain user
 * Returns an unsubscribe function
 */
export const onUserPaymentsChanged = (
  userId: string, 
  onNext: (payments: Payment[]) => void,
  limitCount: number = 10
): () => void => {
  const paymentsCollection = collection(db, PAYMENTS_COLLECTION);
  const q = query(
    paymentsCollection,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, querySnapshot => {
    const payments = querySnapshot.docs.map(doc => ({
      ...(doc.data() as Payment),
      id: doc.id // Ensure ID field is set from document ID
    }));
    onNext(payments);
  });
}; 