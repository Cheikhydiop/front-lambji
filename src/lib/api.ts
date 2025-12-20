// API Configuration and HTTP Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Vérifier à la fois auth_token et token pour compatibilité
    this.token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    console.log('🔧 ApiClient initialisé avec baseUrl:', this.baseUrl);
    console.log('🔑 Token initial:', this.token ? 'Présent' : 'Absent');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
      console.log('✅ Token sauvegardé dans localStorage');
    } else {
      localStorage.removeItem('auth_token');
      console.log('🗑️ Token supprimé de localStorage');
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.setToken(null);
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    // 📤 Log de la requête sortante
    console.group(`📤 API Request: ${options.method || 'GET'} ${endpoint}`);
    console.log('🌐 URL complète:', url);
    console.log('🔑 Token présent:', this.token ? 'Oui' : 'Non');
    console.log('📋 Headers:', headers);
    if (options.body) {
      try {
        console.log('📦 Body:', JSON.parse(options.body as string));
      } catch {
        console.log('📦 Body:', options.body);
      }
    }
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
    console.groupEnd();

    try {
      const startTime = performance.now();
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Vérifier le type de contenu avant de parser
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      // 📥 Log de la réponse
      console.group(`📥 API Response: ${options.method || 'GET'} ${endpoint}`);
      console.log('✅ Status:', response.status, response.statusText);
      console.log('⏱️ Durée:', `${duration}ms`);
      console.log('📦 Data:', data);
      console.groupEnd();

      if (!response.ok) {
        // Gérer les erreurs spécifiques
        if (response.status === 401) {
          // Token invalide ou expiré
          console.warn('⚠️ Token invalide ou expiré, déconnexion...');
          this.clearToken();
        }
        
        const errorMessage = data.message || data.error || 'Une erreur est survenue';
        console.error(`❌ Erreur API [${response.status}]:`, errorMessage);
        
        return { 
          error: errorMessage, 
          message: data.message,
          status: response.status 
        };
      }

      return { 
        data,
        status: response.status 
      };
    } catch (error) {
      // 🔥 Log d'erreur réseau
      console.group(`🔥 Erreur réseau: ${options.method || 'GET'} ${endpoint}`);
      console.error('❌ Erreur:', error);
      console.log('🌐 URL tentée:', url);
      console.log('🔑 Token utilisé:', this.token);
      console.groupEnd();
      
      return { 
        error: 'Erreur de connexion au serveur',
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      };
    }
  }

  // Méthodes helper avec logs
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryParams}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Méthode pour upload de fichiers
  async upload<T>(endpoint: string, file: File, fieldName = 'file'): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    });
  }
}

// Créer une instance unique
export const api = new ApiClient(API_BASE_URL);

// Export par défaut
export default api;

// Hook pour utiliser l'API dans les composants React (optionnel)
export const useApi = () => {
  return api;
};