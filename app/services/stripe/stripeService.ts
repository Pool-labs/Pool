import { useFirebaseService } from '../firebase/serviceHandler';
import { useAuth } from '../../context/AuthContext';

/**
 * Hook to provide Stripe service functions with error handling and toast notifications
 */
export const useStripeService = () => {
  const { executeOperation } = useFirebaseService();
  const { user, userData } = useAuth();

  /**
   * Create a payment intent
   */
  const createPaymentIntent = async (
    amount: number,
    destination: string,
    description: string,
    paymentMethodId: string
  ): Promise<any | null> => {
    return executeOperation(
      async () => {
        if (!userData?.customerId) {
          throw new Error('User has no Stripe customer ID');
        }

        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: userData.customerId,
            amount,
            destination,
            description,
            paymentMethodId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create payment intent');
        }

        return response.json();
      },
      {
        operationName: 'Create payment',
        successMessage: `Payment of $${amount.toFixed(2)} successfully initiated`,
        errorMessage: 'Payment failed',
      }
    );
  };

  /**
   * Create a Stripe customer
   */
  const createCustomer = async (
    name: string,
    email: string
  ): Promise<any | null> => {
    return executeOperation(
      async () => {
        const response = await fetch('/api/stripe/customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create Stripe customer');
        }

        return response.json();
      },
      {
        operationName: 'Create customer',
        successMessage: 'Stripe account created successfully',
        errorMessage: 'Failed to create Stripe account',
      }
    );
  };

  /**
   * Create a bank account setup intent
   */
  const createBankAccountSetupIntent = async (customerId: string, name: string): Promise<any | null> => {
    return executeOperation(
      async () => {
        if (!customerId) {
          throw new Error('User has no Stripe customer ID');
        }

        const response = await fetch('/api/stripe/customer/setup-intent/us-bank-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId,
            name,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create bank account setup intent');
        }

        return response.json();
      },
      {
        operationName: 'Bank setup',
        successMessage: 'Bank account setup initiated',
        errorMessage: 'Failed to setup bank account',
      }
    );
  };

  /**
   * Confirm a setup intent
   */
  const confirmSetupIntent = async (
    setupIntentId: string,
    paymentMethodId: string
  ): Promise<any | null> => {
    return executeOperation(
      async () => {
        const response = await fetch('/api/stripe/customer/setup-intent/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setupIntentId,
            paymentMethodId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to confirm setup intent');
        }

        return response.json();
      },
      {
        operationName: 'Confirm bank setup',
        successMessage: 'Bank account verified successfully',
        errorMessage: 'Failed to verify bank account',
      }
    );
  };

  /**
   * Create a Connect account
   */
  const createConnectAccount = async (
    name: string,
  ): Promise<any | null> => {
    return executeOperation(
      async () => {
        const response = await fetch('/api/stripe/connect-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create Connect account');
        }

        return response.json();
      },
      {
        operationName: 'Create Connect account',
        successMessage: 'Connect account created successfully',
        errorMessage: 'Failed to create Connect account',
      }
    );
  };

  /**
   * Create a card for a user
   */
  const createCard = async (
    connectAccountId: string,
    name: string,
    poolName: string,
    type: 'virtual' | 'physical' = 'virtual'
  ): Promise<any | null> => {
    return executeOperation(
      async () => {
        const response = await fetch('/api/stripe/card-issuing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectAccountId,
            type,
            poolName,
            name
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create card');
        }

        return response.json();
      },
      {
        operationName: 'Create card',
        successMessage: `${type === 'virtual' ? 'Virtual' : 'Physical'} card created successfully`,
        errorMessage: 'Failed to create card',
      }
    );
  };

  /**
   * Update a cardholder's information
   */
  const updateCardholder = async (
    cardholderId: string,
    updates: any
  ): Promise<any | null> => {
    return executeOperation(
      async () => {
        const response = await fetch('/api/stripe/card-issuing/update-cardholder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardholderId,
            ...updates,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update cardholder');
        }

        return response.json();
      },
      {
        operationName: 'Update cardholder',
        successMessage: 'Cardholder information updated',
        errorMessage: 'Failed to update cardholder information',
      }
    );
  };

  return {
    createPaymentIntent,
    createCustomer,
    createBankAccountSetupIntent,
    confirmSetupIntent,
    createConnectAccount,
    createCard,
    updateCardholder,
  };
}; 