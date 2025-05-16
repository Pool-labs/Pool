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
  onSnapshot,
  writeBatch
} from '@react-native-firebase/firestore';
import { Payment, createPayment } from '../../models/firebase/payment';
import { getFirestore, getAuth } from './config';
import { useApiResponse } from '../../hooks/useApiResponse';
import useBearStore from '../../hooks/useBearStore';

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

// Example API functions for Stripe payments
export const usePaymentService = () => {
  const { handleApiCall } = useApiResponse();
  // We can access the bear store if needed for state that affects payments
  const bears = useBearStore(state => state.bears);
  
  // Create a payment method for the current user
  const createPaymentMethod = async (paymentDetails: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    accountType: 'checking' | 'savings';
  }) => {
    return handleApiCall(
      async () => {
        // Get current user
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('You must be logged in to create a payment method');
        }
        
        // This would normally be an API call to your server
        // which would then call Stripe API
        // For now, we'll simulate this process
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Validate payment details
        if (!paymentDetails.accountNumber || !paymentDetails.routingNumber) {
          throw new Error('Invalid payment details');
        }
        
        // Simulate successful response from Stripe
        return {
          id: 'pm_' + Math.random().toString(36).substring(2, 15),
          type: 'ach_debit',
          created: Date.now(),
          last4: paymentDetails.accountNumber.slice(-4),
          bankName: 'Test Bank',
        };
      },
      {
        successMessage: 'Payment method added successfully',
        errorMessage: 'Failed to add payment method',
      }
    );
  };
  
  // Process a payment
  const processPayment = async (amount: number, description: string) => {
    return handleApiCall(
      async () => {
        // Get current user
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('You must be logged in to make a payment');
        }
        
        // Validate amount
        if (amount <= 0) {
          throw new Error('Amount must be greater than 0');
        }
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Random success/failure for demonstration
        const isSuccess = Math.random() > 0.3;
        
        if (!isSuccess) {
          throw new Error('Payment processing failed');
        }
        
        // Return successful payment data
        return {
          id: 'py_' + Math.random().toString(36).substring(2, 15),
          amount,
          currency: 'usd',
          status: 'succeeded',
          description,
          created: Date.now(),
        };
      },
      {
        successMessage: `Payment of $${amount.toFixed(2)} successful`,
        errorMessage: 'Payment failed',
      }
    );
  };
  
  // Get payment history
  const getPaymentHistory = async () => {
    return handleApiCall(
      async () => {
        // Get current user
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('You must be logged in to view payment history');
        }
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulate payment history
        return Array.from({ length: 5 }).map((_, i) => ({
          id: 'py_' + Math.random().toString(36).substring(2, 15),
          amount: Math.floor(Math.random() * 10000) / 100,
          currency: 'usd',
          status: ['succeeded', 'pending', 'succeeded', 'succeeded', 'failed'][i],
          description: ['Monthly fee', 'Transfer to pool', 'Withdrawal', 'Deposit', 'Service charge'][i],
          created: Date.now() - i * 86400000, // days ago
        }));
      },
      {
        successMessage: 'Payment history loaded',
        showSuccessToast: false, // Don't show success toast for this one
      }
    );
  };
  
  return {
    createPaymentMethod,
    processPayment,
    getPaymentHistory,
  };
}; 