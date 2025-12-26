import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '@/services/AuthService';
import { webSocketService, WebSocketMessageType } from '@/services/WebSocketService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    token?: string;
    requiresDeviceVerification?: boolean;
    sessionId?: string;
    existingSessions?: any[];
    deviceInfo?: any;
  }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = authService.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await authService.getProfile();
    if (error) {
      authService.setToken(null);
      setUser(null);
    } else {
      // Le backend renvoie { user: User }
      const userData = (data as any)?.user || data;
      setUser(userData ?? null);
      if (userData?.id) {
        webSocketService.connect(userData.id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Écouter les mises à jour WebSocket pour rafraîchir le solde
  useEffect(() => {
    if (!user) return;

    const handleWalletUpdate = (payload: any) => {
      console.log('[AuthContext] Wallet update received, refreshing user...');
      // Si le payload contient le nouveau solde, on pourrait mettre à jour directement
      // Mais pour la cohérence, on recharge le profil
      refreshUser();
    };

    // S'abonner aux événements qui affectent le solde
    webSocketService.on(WebSocketMessageType.WALLET_UPDATE, handleWalletUpdate);
    webSocketService.on(WebSocketMessageType.BET_WON, handleWalletUpdate); // Gain = solde augmente
    webSocketService.on(WebSocketMessageType.BET_ACCEPTED, handleWalletUpdate); // Mise débitée = solde diminue
    webSocketService.on(WebSocketMessageType.BET_CANCELLED, handleWalletUpdate); // Remboursement = solde augmente
    webSocketService.on(WebSocketMessageType.BET_REFUNDED, handleWalletUpdate); // Remboursement = solde augmente
    webSocketService.on(WebSocketMessageType.TRANSACTION_CONFIRMED, handleWalletUpdate); // Dépôt/Retrait = solde change

    return () => {
      webSocketService.off(WebSocketMessageType.WALLET_UPDATE, handleWalletUpdate);
      webSocketService.off(WebSocketMessageType.BET_WON, handleWalletUpdate);
      webSocketService.off(WebSocketMessageType.BET_ACCEPTED, handleWalletUpdate);
      webSocketService.off(WebSocketMessageType.BET_CANCELLED, handleWalletUpdate);
      webSocketService.off(WebSocketMessageType.BET_REFUNDED, handleWalletUpdate);
      webSocketService.off(WebSocketMessageType.TRANSACTION_CONFIRMED, handleWalletUpdate);
    };
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    const { data, error } = await authService.login(email, password);
    if (error) {
      return { success: false, error };
    }

    // Gérer la vérification d'appareil
    if (data?.requiresDeviceVerification) {
      return {
        success: true,
        requiresDeviceVerification: true,
        sessionId: data.sessionId,
        existingSessions: data.existingSessions,
        deviceInfo: data.deviceInfo
      };
    }

    setUser(data!.user);
    if (data!.user.id) {
      webSocketService.connect(data!.user.id);
    }
    return { success: true, user: data!.user, token: data!.token };
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const { data, error } = await authService.register(name, email, password, phone);
    if (error) {
      return { success: false, error };
    }
    return { success: true, userId: data?.user?.id };
  };

  const logout = async () => {
    await authService.logout();
    webSocketService.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
