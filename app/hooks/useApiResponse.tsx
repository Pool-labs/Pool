import { create } from 'zustand';
import Toast from 'react-native-toast-message';

// Define the API response state types
interface ApiResponseState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  statusCode?: number;
  data: any;
  
  // Actions
  startLoading: () => void;
  setSuccess: (message: string, data?: any) => void;
  setError: (message: string, statusCode?: number) => void;
  reset: () => void;
  setState: (state: Partial<Omit<ApiResponseState, 'setState'>>) => void;
}

// Create the Zustand store
const useApiResponseStore = create<ApiResponseState>((set) => ({
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  statusCode: undefined,
  data: null,
  
  // Set loading state
  startLoading: () => set({ 
    isLoading: true,
    isSuccess: false,
    isError: false,
    message: '',
    data: null
  }),
  
  // Set success state and show success toast
  setSuccess: (message, data = null) => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
    });
    
    set({ 
      isLoading: false,
      isSuccess: true,
      isError: false,
      message,
      data
    });
  },
  
  // Set error state and show error toast
  setError: (message, statusCode) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
    });
    
    set({ 
      isLoading: false,
      isSuccess: false,
      isError: true,
      message,
      statusCode,
      data: null
    });
  },
  
  // Reset state
  reset: () => set({ 
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    statusCode: undefined,
    data: null
  }),
  
  // Generic state setter
  setState: (state) => set(state),
}));

// Hook to handle API calls with automatic toast notifications
export const useApiResponse = () => {
  const store = useApiResponseStore();
  
  // Utility function to handle API calls
  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showSuccessToast?: boolean;
      showErrorToast?: boolean;
    }
  ): Promise<T | null> => {
    const {
      successMessage,
      errorMessage = 'Something went wrong. Please try again.',
      showSuccessToast = true,
      showErrorToast = true,
    } = options || {};
    
    try {
      store.startLoading();
      const result = await apiCall();
      
      if (showSuccessToast && successMessage) {
        store.setSuccess(successMessage, result);
      } else {
        // Still set success state but don't show toast
        store.setState({ 
          isLoading: false,
          isSuccess: true,
          isError: false,
          message: successMessage || '',
          data: result
        });
      }
      
      return result;
    } catch (error: any) {
      const message = error?.message || errorMessage;
      
      if (showErrorToast) {
        store.setError(message, error?.statusCode);
      } else {
        // Still set error state but don't show toast
        store.setState({ 
          isLoading: false,
          isSuccess: false,
          isError: true,
          message,
          statusCode: error?.statusCode,
          data: null
        });
      }
      
      return null;
    }
  };
  
  return {
    ...store,
    handleApiCall,
  };
};

// Direct access to the store (useful for subscribing to state changes)
export default useApiResponseStore; 