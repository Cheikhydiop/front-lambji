// services/BaseService.ts
export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  pagination?: {
    total: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

export class BaseService {
  protected baseURL: string;
  protected basePath: string;

  constructor(basePath: string = '') {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app/api';
    this.basePath = basePath;
  }

  private getFullURL(endpoint: string): string {
    // Si l'endpoint commence déjà par http, on le retourne tel quel
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // Sinon on construit l'URL complète
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${this.basePath}${path}`;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Impossible de rafraîchir le token');
      }

      const data = await response.json();

      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        if (data.data.refreshToken) {
          localStorage.setItem('refresh_token', data.data.refreshToken);
        }
        return data.data.token;
      }

      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      // Nettoyer les tokens invalides
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('wallet_data');
      return null;
    }
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.getFullURL(endpoint);
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Si le token a expiré (401), tenter de le rafraîchir
      if (response.status === 401 && token) {
        const newToken = await this.refreshToken();

        if (newToken) {
          // Réessayer la requête avec le nouveau token
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Impossible de rafraîchir
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth';
          }
          return {
            data: null,
            error: 'Session expirée, veuillez vous reconnecter',
          };
        }
      }

      // Gérer les erreurs HTTP
      if (!response.ok) {
        let errorMessage = 'Une erreur est survenue';

        try {
          const errorData = await response.json();
          // Handle standard API error format { success: false, error: { message: "..." } }
          if (errorData.error && typeof errorData.error === 'object' && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
          // Handle simple format { message: "..." } or { error: "..." }
          else {
            const err = errorData.error;
            if (typeof err === 'string') {
              errorMessage = err;
            } else if (err && typeof err === 'object') {
              // Avoid stringifying DOM events or objects that result in {"isTrusted": true}
              if ('isTrusted' in err && Object.keys(err).length === 1) {
                errorMessage = 'Une erreur est survenue (détails techniques masqués)';
              } else {
                errorMessage = errorData.message || JSON.stringify(err);
              }
            } else {
              errorMessage = errorData.message || errorMessage;
            }
          }
        } catch {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }

        return {
          data: null,
          error: errorMessage,
        };
      }

      // Gérer le cas où il n'y a pas de contenu (204)
      if (response.status === 204) {
        return { data: null };
      }

      const data = await response.json();

      // L'API retourne { success, message, data }
      if (data.success === false) {
        return {
          data: null,
          error: data.message || 'Une erreur est survenue',
        };
      }

      // Si la réponse contient un champ "data", l'extraire
      return {
        data: data.data || data,
      };
    } catch (error: any) {
      console.error('Erreur réseau:', error);
      return {
        data: null,
        error: error.message || 'Erreur de connexion au serveur',
      };
    }
  }

  protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  protected async post<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}