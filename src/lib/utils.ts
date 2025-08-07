import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Construct a full image URL from a relative path
 * @param relativePath - The relative path from the database (e.g., "product_types/image.png")
 * @returns The full URL to the image
 */
export function getImageUrl(relativePath: string | null | undefined): string | undefined {
  if (!relativePath) return undefined;
  
  // If it's already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Get the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // For images, we need to use the backend URL without /api suffix
  // If API base URL ends with /api, remove it for image URLs
  const baseUrl = apiBaseUrl.endsWith('/api') 
    ? apiBaseUrl.replace('/api', '') 
    : apiBaseUrl;
  
  return `${baseUrl}/storage/${relativePath}`;
}
