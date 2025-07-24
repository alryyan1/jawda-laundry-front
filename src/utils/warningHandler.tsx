import React from 'react';
import { toast } from 'sonner';

/**
 * Displays warnings as toast notifications
 * @param warnings Array of warning messages
 * @param title Optional title for the warning group
 */
export const displayWarnings = (warnings: string[], title: string = 'Warning'): void => {
  if (!warnings || warnings.length === 0) {
    return;
  }

  // If there's only one warning, show it as a simple toast
  if (warnings.length === 1) {
    toast.warning(warnings[0]);
    return;
  }

  // If there are multiple warnings, show them as a grouped toast
  toast.warning(title, {
    description: (
      <div className="space-y-1">
        {warnings.map((warning, index) => (
          <div key={index} className="text-sm">
            • {warning}
          </div>
        ))}
      </div>
    ),
    duration: 8000, // Show for 8 seconds since there might be multiple warnings
  });
};

/**
 * Handles order API responses that may contain warnings
 * @param response The API response that might contain warnings
 * @param successMessage Optional success message to show
 */
export const handleOrderResponse = (
  response: { order: any; warnings?: string[]; message?: string },
  successMessage?: string
): any => {
  // Display warnings if any
  if (response.warnings && response.warnings.length > 0) {
    displayWarnings(response.warnings, 'Order Warnings');
  }

  // Show success message if provided
  if (successMessage) {
    toast.success(successMessage);
  }

  // Return the order data
  return response.order;
}; 