// src/types/auth.types.ts

export interface User {
    id: number;
    name: string;
    email: string;
    role?: 'admin' | 'staff' | string; // More specific roles if known
    avatar_url?: string;
    created_at: string;
    updated_at: string;
    // Add any other user-specific fields from your UserResource
  }
  
  // You might also include types for login/register payloads if not defined in authService.ts
  // export interface LoginPayload { email: string; password: string; }
  // export interface RegisterPayload extends LoginPayload { name: string; password_confirmation: string; }