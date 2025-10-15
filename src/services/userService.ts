// User Service API Client
export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  idToken?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// User service URL - through Kong API Gateway
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const API_BASE_PATH = '/api/users';

// Error handling helper
class UserServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

/**
 * Get current user profile
 * Requires: Authorization header with Bearer token
 */
export async function getUserProfile(accessToken: string): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new UserServiceError(
        `Failed to fetch user profile: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const data: UserProfile = await response.json();
    return data;
  } catch (error) {
    if (error instanceof UserServiceError) {
      throw error;
    }

    throw new UserServiceError(
      `Network error while fetching user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

/**
 * Update user profile
 * Requires: Authorization header with Bearer token
 */
export async function updateUserProfile(
  accessToken: string,
  updateData: UserProfileUpdateRequest
): Promise<{ message: string; user: UserProfile }> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}${API_BASE_PATH}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new UserServiceError(
        `Failed to update user profile: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof UserServiceError) {
      throw error;
    }

    throw new UserServiceError(
      `Network error while updating user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    );
  }
}

export const userService = {
  getUserProfile,
  updateUserProfile,
};

export default userService;