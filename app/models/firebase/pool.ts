// models/Pool.ts
export interface Pool {
    id: string; // Unique identifier for the pool provided by firebase doc id
    stripeConnectAccountId: string; // Unique identifier corresponds to the Stripe account ID)
    name: string; // Name of the pool (e.g., "Development Fund")
    ownerId: string; // ID of the user who owns the pool
    memberIds: string[]; // Array of user IDs who are part of the pool
    balance: number; // Total funds available in the pool
  }
  
  export const createPool = (id: string, name: string, ownerId: string, memberIds: string[], balance: number, stripeConnectAccountId: string): Pool => {
    return { id, name, ownerId, memberIds, balance, stripeConnectAccountId };
  };
  