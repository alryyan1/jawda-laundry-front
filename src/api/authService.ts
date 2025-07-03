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

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/login', credentials);
  return data;
};

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