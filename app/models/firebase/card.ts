// models/VirtualCard.ts
export interface Card {
    id: string; // Unique identifier for the  card provided by firebase doc id
    type: 'virtual' | 'physical'; // Type of card virtual or physical
    userId: string; // User associated with the  card
    poolId: string; // Pool associated with the  card
    cardNumber: string; // The  card number (encrypted in production)
    expiryDate: string; // Expiry date of the card
    cvv: string; // CVV code (should be encrypted in production)
    status: 'active' | 'inactive'; // Status of the card
  }
  
  export const createCard = (id: string, userId: string, poolId: string, cardNumber: string, expiryDate: string, cvv: string, status: 'active' | 'inactive', type: 'virtual' | 'physical'): Card => {
    return { id, userId, poolId, cardNumber, expiryDate, cvv, status, type };
  };