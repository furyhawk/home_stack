/**
 * Error thrown by API requests
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;
  isNoDataAvailable: boolean;

  constructor(status: number, statusText: string, data?: any) {
    super(`API Error: ${status} ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.name = 'ApiError';
    
    // Check if this is a "no data available" error
    this.isNoDataAvailable = 
      status === 404 || 
      (statusText && statusText.toLowerCase().includes('no data available')) ||
      (data && typeof data === 'string' && data.toLowerCase().includes('no data available')) ||
      (data && data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('no data available'));
  }
}
