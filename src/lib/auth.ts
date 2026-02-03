import type { JWTAuthResponse, JWTErrorResponse } from '@/types/woocommerce';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

class AuthError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Login with username/email and password
 * Returns JWT token and user info
 */
export async function login(
  username: string,
  password: string
): Promise<JWTAuthResponse> {
  if (!WP_URL) {
    throw new AuthError('WordPress URL is not configured', 'config_error', 500);
  }

  const response = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as JWTErrorResponse;
    throw new AuthError(
      errorData.message || 'Login failed',
      errorData.code || 'auth_error',
      response.status
    );
  }

  return data as JWTAuthResponse;
}

/**
 * Validate an existing JWT token
 */
export async function validateToken(token: string): Promise<boolean> {
  if (!WP_URL) {
    throw new AuthError('WordPress URL is not configured', 'config_error', 500);
  }

  try {
    const response = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get user info from WordPress using JWT token
 */
export async function getCurrentUser(token: string): Promise<{
  id: number;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
}> {
  if (!WP_URL) {
    throw new AuthError('WordPress URL is not configured', 'config_error', 500);
  }

  const response = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new AuthError('Failed to get user info', 'user_error', response.status);
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email || '',
    displayName: data.name || '',
    firstName: data.first_name || '',
    lastName: data.last_name || '',
  };
}

/**
 * Register a new user
 * Note: This requires the WooCommerce REST API
 */
export async function register(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ id: number; email: string }> {
  // Registration is handled through WooCommerce customers API
  // This function should be called from an API route to keep secrets secure
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new AuthError(
      result.message || 'Registration failed',
      result.code || 'register_error',
      response.status
    );
  }

  return result;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new AuthError(
      data.message || 'Failed to request password reset',
      data.code || 'reset_error',
      response.status
    );
  }
}

/**
 * Check if a token is expired
 * JWT tokens have exp claim in payload
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

export { AuthError };
