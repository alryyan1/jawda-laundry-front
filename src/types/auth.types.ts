// src/types/auth.types.ts

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  user_type: "admin" | "staff";
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  name: string;
  username: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  user_type: "admin" | "staff";
}
