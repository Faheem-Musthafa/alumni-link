import { toast } from "@/hooks/use-toast";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function handleError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const errorContext = context ? `${context}: ` : "";
  
  console.error(`${errorContext}${message}`, error);
  
  toast({
    variant: "destructive",
    title: "Error",
    description: message,
  });
}

export async function handleAsync<T>(
  asyncFn: () => Promise<T>,
  errorContext?: string
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, errorContext);
    return null;
  }
}

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorContext?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, errorContext);
      throw error;
    }
  }) as T;
}

// Firebase-specific error messages
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No account found with this email",
  "auth/wrong-password": "Incorrect password",
  "auth/email-already-in-use": "An account with this email already exists",
  "auth/weak-password": "Password should be at least 6 characters",
  "auth/invalid-email": "Invalid email address",
  "auth/network-request-failed": "Network error. Please check your connection",
  "permission-denied": "You don't have permission to perform this action",
  "not-found": "The requested resource was not found",
  "already-exists": "This resource already exists",
  "resource-exhausted": "Too many requests. Please try again later",
};

export function getFirebaseErrorMessage(code: string): string {
  return FIREBASE_ERROR_MESSAGES[code] || "An error occurred. Please try again";
}
