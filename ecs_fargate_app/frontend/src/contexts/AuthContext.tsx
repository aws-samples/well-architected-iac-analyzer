import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '../types/auth';

interface AuthContextType {
    authState: AuthState;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        userProfile: null,
    });

    useEffect(() => {
        const fetchAuthConfig = async () => {
            try {
                const response = await fetch('/api/auth/config');
                if (response.ok) {
                    const userResponse = await fetch('/api/auth/user-info');

                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        setAuthState({
                            // When auth is disabled, "iac-analyzer" common profile
                            isAuthenticated: true,
                            userProfile: {
                                username: userData.username,
                                email: userData.email
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching auth configuration:', error);
                // For development, if there's an error but we're in local mode,
                // we can still set a default authenticated state
                if (process.env.NODE_ENV === 'development') {
                    setAuthState({
                        isAuthenticated: true,
                        userProfile: {
                            username: 'Dev User',
                            email: 'dev-user@example.com'
                        }
                    });
                }
            }
        };

        fetchAuthConfig();
    }, []);

    const logout = async () => {
        try {
            // Call backend logout endpoint to expire ALB cookies
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const { redirectUrl } = await response.json();
                // In development or when auth is disabled, reset the auth state
                if (process.env.NODE_ENV === 'development' || !redirectUrl) {
                    setAuthState({
                        isAuthenticated: false,
                        userProfile: null
                    });
                    return;
                }
                // In auth-mode, redirect to Cognito logout URL
                window.location.href = redirectUrl;
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ authState, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};