import { BaseService, ApiResponse } from './BaseService';
import api from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  wallet?: {
    balance: number;
    lockedBalance: number;
    bonusBalance: number;
  };
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  // Champs pour multi-appareils
  requiresDeviceVerification?: boolean;
  sessionId?: string;
  deviceInfo?: any;
  existingSessions?: any[];
  message?: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

class AuthService extends BaseService {
  constructor() {
    super('/auth');
    console.log('🔐 AuthService initialisé');
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    console.log('🔑 Tentative de connexion pour:', email);

    const result = await this.post<LoginResponse>('/login', { email, password });

    if (result.data?.requiresDeviceVerification) {
      console.log('⚠️ Vérification d\'appareil requise');
    } else if (result.data?.token) {
      console.log('✅ Login réussi, utilisateur:', result.data.user.name);
      api.setToken(result.data.token);
    } else if (result.error) {
      console.error('❌ Échec de connexion:', result.error);
    }

    return result;
  }

  async register(name: string, email: string, password: string, phone: string): Promise<ApiResponse<RegisterResponse>> {
    console.log('📝 Tentative d\'inscription pour:', email);

    const result = await this.post<RegisterResponse>('/register', { name, email, password, phone });

    if (result.data?.user) {
      console.log('✅ Inscription réussie, utilisateur créé:', result.data.user.name);
    } else if (result.error) {
      console.error('❌ Échec d\'inscription:', result.error);
    }

    return result;
  }

  async logout(): Promise<ApiResponse<void>> {
    console.log('👋 Déconnexion en cours...');

    const result = await this.post<void>('/logout');
    api.setToken(null);

    console.log('✅ Déconnexion effectuée');
    return result;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    console.log('👤 Récupération du profil utilisateur...');

    const result = await this.get<User>('/profile');

    if (result.data) {
      console.log('✅ Profil récupéré:', result.data.name);
    } else if (result.error) {
      console.error('❌ Erreur récupération profil:', result.error);
    }

    return result;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    console.log('✏️ Mise à jour du profil:', Object.keys(data));

    const result = await this.put<User>('/profile', data);

    if (result.data) {
      console.log('✅ Profil mis à jour avec succès');
    } else if (result.error) {
      console.error('❌ Erreur mise à jour profil:', result.error);
    }

    return result;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    console.log('🔒 Changement de mot de passe en cours...');

    const result = await this.post<void>('/change-password', { currentPassword, newPassword });

    if (result.error) {
      console.error('❌ Erreur changement mot de passe:', result.error);
    } else {
      console.log('✅ Mot de passe changé avec succès');
    }

    return result;
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    console.log('📧 Demande de réinitialisation pour:', email);

    const result = await this.post<void>('/-password', { email });

    if (result.error) {
      console.error('❌ Erreur demande réinitialisation:', result.error);
    } else {
      console.log('✅ Email de réinitialisation envoyé');
    }

    return result;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    console.log('🔄 Réinitialisation du mot de passe...');

    const result = await this.post<void>('/reset-password', { token, password });

    if (result.error) {
      console.error('❌ Erreur réinitialisation:', result.error);
    } else {
      console.log('✅ Mot de passe réinitialisé avec succès');
    }

    return result;
  }

  async refreshSession(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    console.log('🔄 Rafraîchissement du token...');

    const result = await this.post<{ token: string; refreshToken: string }>('/refresh-token', { refreshToken });

    if (result.data) {
      console.log('✅ Token rafraîchi avec succès');
    } else if (result.error) {
      console.error('❌ Erreur rafraîchissement token:', result.error);
    }

    return result;
  }

  async verifyDevice(sessionId: string, otpCode: string): Promise<ApiResponse<LoginResponse>> {
    console.log('📱 Vérification appareil...');
    const result = await this.post<LoginResponse>('/verify-device', { sessionId, otpCode });
    if (result.data?.token) {
      console.log('✅ Appareil vérifié, token reçu');
      api.setToken(result.data.token);
    } else if (result.error) {
      console.error('❌ Échec vérification appareil:', result.error);
    }
    return result;
  }

  async resendDeviceOTP(sessionId: string): Promise<ApiResponse<void>> {
    console.log('📧 Envoi OTP appareil...');
    const result = await this.post<void>('/resend-device-otp', { sessionId });
    if (result.error) {
      console.error('❌ Échec envoi OTP:', result.error);
    } else {
      console.log('✅ OTP envoyé');
    }
    return result;
  }

  getAccessToken(): string | null {
    const token = api.getToken();
    console.log('🔍 Token actuel:', token ? 'Présent' : 'Absent');
    return token;
  }

  setToken(token: string | null): void {
    console.log('💾 Définition du token:', token ? 'Nouveau token' : 'Suppression');
    api.setToken(token);
  }
}

export const authService = new AuthService();
export default authService;