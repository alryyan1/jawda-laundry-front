// src/api/authService.ts
import apiClient from './apiClient';
import type { User } from '@/types'; // Assuming User type is defined

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token: string;
  user: User; // Use your defined User type
  message?: string;
}



export const registerUser = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/register', credentials);
  return data;
};

export const logoutUser = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/logout');
  return data;
};

export const fetchAuthenticatedUser = async (): Promise<User> => { // Backend should return UserResource data
  const { data } = await apiClient.get<User>('/user'); // Adjust if backend wraps in 'data'
  return data;
};




// src/api/authService.ts
// ...
export interface LoginCredentials {
  username: string; // Changed from email
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  email?: string; // Email is now optional
  password_confirmation: string;
}

// The loginUser function now sends a username
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
const { data } = await apiClient.post<AuthResponse>('/login', credentials);
return data;
};
// ... (registerUser remains compatible as it already sends more fields)