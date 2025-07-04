// src/types/auth.types.ts
import type { Role } from './admin.types';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string; // The primary display role, if you keep it
  roles: Role[]; // List of all role objects from Spatie
  permissions: string[]; // List of all permission names from Spatie
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role_ids: number[];
}