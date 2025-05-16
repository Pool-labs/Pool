import { useApiResponse } from '../../hooks/useApiResponse';

/**
 * Central service handler for Firebase operations
 * Uses the API response hook to handle loading states, errors, and success messages
 */
export const useFirebaseService = () => {
  const { handleApiCall } = useApiResponse();

  /**
   * Executes a Firebase operation with proper error handling and success/error messaging
   * @param operation The Firebase operation to execute
   * @param options Configuration options for success/error handling
   * @returns Promise with the operation result or null on error
   */
  const executeOperation = async <T,>(
    operation: () => Promise<T>,
    options?: {
      operationName?: string;
      successMessage?: string;
      errorMessage?: string;
      showSuccessToast?: boolean;
      showErrorToast?: boolean;
    }
  ): Promise<T | null> => {
    const {
      operationName = 'Operation',
      successMessage,
      errorMessage = `${operationName} failed. Please try again.`,
      showSuccessToast = true,
      showErrorToast = true,
    } = options || {};

    return handleApiCall(
      operation,
      {
        successMessage,
        errorMessage,
        showSuccessToast,
        showErrorToast,
      }
    );
  };

  return {
    executeOperation,
  };
}; 