import React, {useState, useEffect, createContext, useContext} from 'react';
import * as SecureStore from 'expo-secure-store';
import { registerClearAuth } from '../utils/api';

type AuthContextType = {
    user: any | null;
    token: string | null;
    isLoading: boolean;
    login: (userdata: any, token: string, refreshToken: string) => Promise<void>
    logout: () => Promise<void>
    clearAuth: () => Promise<void>
    updateUser: (partial: Record<string, unknown>) => void
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}:{children:React.ReactNode}) {
    const [user, setUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        registerClearAuth(clearAuth);
        const loadAuth = async () => {
            try{
                const storedToken = await SecureStore.getItemAsync('access_token');
                const storedUser = await SecureStore.getItemAsync('user');
                if(storedToken) setToken(storedToken);
                if(storedUser) setUser(JSON.parse(storedUser));
            } finally {
                setIsLoading(false);
            }    
        };
        loadAuth();
    }, []); 

    const login = async (userData:any, accessToken:string, refreshToken:string) => {
        setIsLoading(true);
        try{
            await SecureStore.setItemAsync('access_token', accessToken);
            await SecureStore.setItemAsync('refresh_token', refreshToken);
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            setUser(userData);
            setToken(accessToken);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try{
            await clearAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const clearAuth = async() => {
        setIsLoading(true)
        try{
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            await SecureStore.deleteItemAsync('user');
            setUser(null);
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = (partial: Record<string, unknown>) => {
        setUser((prev: any) => {
            if (!prev) return prev;
            const next = { ...prev, ...partial };
            SecureStore.setItemAsync('user', JSON.stringify(next)).catch(() => {});
            return next;
        });
    };
    
    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, clearAuth, updateUser }}>
            {children}
        </AuthContext.Provider>
    );  

}

export const useAuth = () => useContext(AuthContext)!;