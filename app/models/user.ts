export interface User {
    id: string; // Unique identifier for the user
    cryptoWalletId: string; // Unique identifier for the user's crypto wallet
    email: string; // User's email address
    name: string; // User's full name
    poolIds: string[]; // Array of pool IDs the user is associated with
    paymentMethodId?: string; // The user's attached payment method (e.g., ACH bank account)
    virtualCardIds?: string[]; // Array of virtual card IDs issued to the user
  }
  
  export const createUser = (id: string, email: string, name: string, poolIds: string[], cryptoWalletId: string, paymentMethodId?: string, virtualCardIds?: string[]): User => {
    return { id, email, name, poolIds, paymentMethodId, virtualCardIds, cryptoWalletId}; // Added required cryptoWalletId field
  };