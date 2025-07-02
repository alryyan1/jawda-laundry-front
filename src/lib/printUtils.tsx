export const printPosPdfReceipt = (orderId: number | string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
  const printUrl = `${baseUrl}/orders/${orderId}/pos-invoice-pdf`;

  // Open the URL in a new tab. The browser's PDF viewer will open and handle printing.
  window.open(printUrl, "_blank");
};