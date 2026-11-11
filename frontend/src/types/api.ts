/**
 * Standard C++ Backend API Envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: number;
}

export interface ApiError {
  success: false;
  error: string;
  timestamp?: number;
}
