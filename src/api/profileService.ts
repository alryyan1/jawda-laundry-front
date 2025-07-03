// src/api/profileService.ts
import apiClient from './apiClient';
import type { User } from '@/types';

export interface UserProfileUpdateData {
    name: string;
    email?: string; // Make email optional as it might not be updatable
    // Add other fields like avatar_url if handled
}

export const updateUserProfile = async (profileData: UserProfileUpdateData): Promise<User> => {
    const { data } = await apiClient.put<{data: User}>('/profile', profileData); // Laravel's default is often {data: User}
    return data.data; // Adjust if your backend returns User directly
};

export interface ChangePasswordData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export const updateUserPassword = async (passwordData: ChangePasswordData): Promise<{message: string}> => {
    const { data } = await apiClient.put<{message: string}>('/profile/password', passwordData);
    return data;
};