// models/Payment.ts
export interface Payment {
    id: string; // Unique payment ID
    userId: string; // User who made the payment
    poolId: string; // Pool the payment was deposited into
    amount: number; // Amount of money being transferred
    paymentMethod: string; // e.g., 'ACH', 'credit_card'
    status: 'pending' | 'completed' | 'failed'; // Payment status
    timestamp: number; // Timestamp of when the payment was made
  }
  
  export const createPayment = (id: string, userId: string, poolId: string, amount: number, paymentMethod: string, status: 'pending' | 'completed' | 'failed'): Payment => {
    return { id, userId, poolId, amount, paymentMethod, status, timestamp: Date.now() };
  };
  