// app/services/firebase/cardService.ts
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
  getFirestore,
  onSnapshot,
  writeBatch
} from '@react-native-firebase/firestore';
import { Card, createCard } from '../../models/firebase/card';

const CARDS_COLLECTION = 'cards';
const db = getFirestore();

/**
 * Creates a new card in Firestore with Firestore document ID
 * @param userId User ID associated with the card
 * @param poolId Pool ID associated with the card
 * @param cardNumber Card number
 * @param expiryDate Card expiry date
 * @param cvv Card security code
 * @param type Card type ('virtual' or 'physical')
 * @param status Card status (default: 'active')
 * @returns The created card with Firestore-generated ID
 */
export const createCardInFirestore = async (
  userId: string,
  poolId: string,
  cardNumber: string,
  expiryDate: string,
  cvv: string,
  type: 'virtual' | 'physical',
  status: 'active' | 'inactive' = 'active'
): Promise<Card> => {
  // Create a new document reference with auto-generated ID
  const cardCollectionRef = collection(db, CARDS_COLLECTION);
  const cardRef = doc(cardCollectionRef);
  const docId = cardRef.id;
  
  // Create card with the document ID
  const card = createCard(
    docId, 
    userId, 
    poolId, 
    cardNumber, 
    expiryDate, 
    cvv, 
    status, 
    type
  );
  
  // Set the document data
  await setDoc(cardRef, card);
  
  return card;
};

/**
 * Creates a card with a specific ID
 */
export const createCardWithId = async (
  id: string,
  userId: string,
  poolId: string,
  cardNumber: string,
  expiryDate: string,
  cvv: string,
  type: 'virtual' | 'physical',
  status: 'active' | 'inactive' = 'active'
): Promise<Card> => {
  const card = createCard(id, userId, poolId, cardNumber, expiryDate, cvv, status, type);
  
  const cardRef = doc(db, CARDS_COLLECTION, id);
  await setDoc(cardRef, card);
  
  return card;
};

/**
 * Retrieves a card by ID
 */
export const getCardById = async (cardId: string): Promise<Card | null> => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  const documentSnapshot = await getDoc(cardRef);
  
  const cardData = documentSnapshot.data();
  if (cardData) {
    // Ensure ID field is set from document ID
    return {
      ...(cardData as Card),
      id: documentSnapshot.id
    };
  }
  
  return null;
};

/**
 * Updates a card's information
 */
export const updateCard = async (cardId: string, updates: Partial<Card>): Promise<void> => {
  // Remove id from updates as it shouldn't be updated
  const { id, ...updatesWithoutId } = updates;
  
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  await updateDoc(cardRef, updatesWithoutId);
};

/**
 * Activates a card
 */
export const activateCard = async (cardId: string): Promise<void> => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  await updateDoc(cardRef, {
    status: 'active'
  });
};

/**
 * Deactivates a card
 */
export const deactivateCard = async (cardId: string): Promise<void> => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  await updateDoc(cardRef, {
    status: 'inactive'
  });
};

/**
 * Gets all cards associated with a specific user
 */
export const getCardsByUser = async (userId: string): Promise<Card[]> => {
  const cardsCollection = collection(db, CARDS_COLLECTION);
  const q = query(cardsCollection, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Card),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets all cards associated with a specific pool
 */
export const getCardsByPool = async (poolId: string): Promise<Card[]> => {
  const cardsCollection = collection(db, CARDS_COLLECTION);
  const q = query(cardsCollection, where('poolId', '==', poolId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Card),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets all active cards
 */
export const getActiveCards = async (): Promise<Card[]> => {
  const cardsCollection = collection(db, CARDS_COLLECTION);
  const q = query(cardsCollection, where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Card),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets all virtual cards
 */
export const getVirtualCards = async (): Promise<Card[]> => {
  const cardsCollection = collection(db, CARDS_COLLECTION);
  const q = query(cardsCollection, where('type', '==', 'virtual'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Card),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Gets all physical cards
 */
export const getPhysicalCards = async (): Promise<Card[]> => {
  const cardsCollection = collection(db, CARDS_COLLECTION);
  const q = query(cardsCollection, where('type', '==', 'physical'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...(doc.data() as Card),
    id: doc.id // Ensure ID field is set from document ID
  }));
};

/**
 * Create multiple cards in a batch operation
 */
export const batchCreateCards = async (cards: {
  userId: string,
  poolId: string,
  cardNumber: string,
  expiryDate: string,
  cvv: string,
  type: 'virtual' | 'physical',
  status?: 'active' | 'inactive'
}[]): Promise<string[]> => {
  // Create a batch
  const batch = writeBatch(db);
  const cardIds: string[] = [];
  
  // Add each card to the batch
  cards.forEach(card => {
    // Create a document reference with auto-generated ID
    const cardCollectionRef = collection(db, CARDS_COLLECTION);
    const cardRef = doc(cardCollectionRef);
    const docId = cardRef.id;
      
    // Save the ID
    cardIds.push(docId);
    
    // Create card with the document ID
    const newCard = createCard(
      docId,
      card.userId,
      card.poolId,
      card.cardNumber,
      card.expiryDate,
      card.cvv,
      card.status || 'active',
      card.type
    );
    
    // Add to batch
    batch.set(cardRef, newCard);
  });
  
  // Commit the batch
  await batch.commit();
  
  // Return array of generated IDs
  return cardIds;
};

/**
 * Deletes a card (use with caution)
 */
export const deleteCard = async (cardId: string): Promise<void> => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  await deleteDoc(cardRef);
};

/**
 * Set up a real-time listener for a specific card
 * Returns an unsubscribe function
 */
export const onCardChanged = (cardId: string, onNext: (card: Card | null) => void): () => void => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  return onSnapshot(cardRef, documentSnapshot => {
    const cardData = documentSnapshot.data();
    if (cardData) {
      onNext({
        ...(cardData as Card),
        id: documentSnapshot.id // Ensure ID field is set from document ID
      });
    } else {
      onNext(null);
    }
  });
};

/**
 * Set up a real-time listener for a user's cards
 * Returns an unsubscribe function
 */
export const onUserCardsChanged = (userId: string, onNext: (cards: Card[]) => void): () => void => {
  const cardsCollection = collection(db, CARDS_COLLECTION);
  const q = query(cardsCollection, where('userId', '==', userId));
  return onSnapshot(q, querySnapshot => {
    const cards = querySnapshot.docs.map(doc => ({
      ...(doc.data() as Card),
      id: doc.id // Ensure ID field is set from document ID
    }));
    onNext(cards);
  });
}; 