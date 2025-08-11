import { toast } from 'sonner';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

interface ApiError {
  response?: {
    data?: ApiErrorResponse;
  };
  message?: string;
}

export const handleApiError = (error: ApiError, defaultMessage = 'An error occurred') => {
  // Handle API validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    
    // Show the main message first
    if (error.response.data.message) {
      toast.error(error.response.data.message);
    }
    
    // Show individual field errors
    Object.keys(errors).forEach(field => {
      if (Array.isArray(errors[field])) {
        errors[field].forEach((errorMsg: string) => {
          // Capitalize field name for better display
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
          toast.error(`${fieldName}: ${errorMsg}`);
        });
      }
    });
  } else {
    // Fallback to generic error message
    toast.error(error.message || defaultMessage);
  }
};

// Alternative function that returns errors for form handling
export const getApiErrors = (error: ApiError): Record<string, string[]> => {
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return {};
};

// Function to get the main error message
export const getApiErrorMessage = (error: ApiError): string => {
  return error.response?.data?.message || error.message || 'An error occurred';
};

// Advanced function for react-hook-form integration
export const handleApiErrorWithForm = (
  error: ApiError, 
  setError: (name: string, options: { message: string }) => void,
  defaultMessage = 'An error occurred'
) => {
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    
    // Show the main message first
    if (error.response.data.message) {
      toast.error(error.response.data.message);
    }
    
    // Set form errors for each field
    Object.keys(errors).forEach(field => {
      if (Array.isArray(errors[field]) && errors[field].length > 0) {
        setError(field, { message: errors[field][0] });
      }
    });
  } else {
    // Fallback to generic error message
    toast.error(error.message || defaultMessage);
  }
};
