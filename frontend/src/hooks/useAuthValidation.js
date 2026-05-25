import { useEffect, useState } from 'react';
import { get } from '../utils/apiClient';

/**
 * Hook to validate authentication token on app startup
 * Clears invalid tokens automatically
 */
export const useAuthValidation = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const storedUser = localStorage.getItem('user');

        if (!storedUser) {
          setIsValidating(false);
          setIsAuthenticated(false);
          return;
        }

        const user = JSON.parse(storedUser);

        // Check if token exists
        if (!user.token) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsValidating(false);
          setIsAuthenticated(false);
          return;
        }

        // Validate token by making a request to /api/users/me
        try {
          const response = await get('/api/users/me');

          // Token is valid, update user data if needed
          if (response.data) {
            const updatedUser = { ...user, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('userLogin'));
          }

          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  return { isValidating, isAuthenticated };
};
