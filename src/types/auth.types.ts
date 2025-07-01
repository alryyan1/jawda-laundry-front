// src/types/auth.types.ts

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string; // The primary display role, if you keep it
  roles: string[]; // List of all role names from Spatie
  permissions: string[]; // List of all permission names from Spatie
  created_at: string;
  updated_at: string;
}