export interface User {
    id: string; // Unique identifier for the user provided by firebase doc id
    customerId: string; // Unique identifier for the user's Stripe customer
    cryptoWalletId: string; // Unique identifier for the user's crypto wallet
    email: string; // User's email address
    name: string; // User's full name
    poolIds: string[]; // Array of pool IDs the user is associated with
    paymentMethodId?: string; // The user's attached payment method (e.g., ACH bank account)
    cardIds?: string[]; // Array of card IDs issued to the user
  }
  
  export const createUser = (id: string, email: string, name: string, poolIds: string[], cryptoWalletId: string, customerId: string, paymentMethodId?: string, cardIds?: string[]): User => {
    // Ensure we don't pass undefined values to Firestore
    return { 
      id, 
      email, 
      name, 
      poolIds: poolIds || [], 
      cryptoWalletId, 
      customerId,
      // Use conditional assignment to handle optional fields
      ...(paymentMethodId ? { paymentMethodId } : {}),
      cardIds: cardIds || [] 
    };
  };