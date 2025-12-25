import { BaseService, ApiResponse } from './BaseService';

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  stable?: string;
  birthDate?: string;
  birthPlace?: string;
  nationality: string;
  weight?: number;
  height?: number;
  reach?: number;
  fightingStyle?: string;
  status: 'ACTIVE' | 'INJURED' | 'RETIRED' | 'SUSPENDED' | 'INACTIVE';
  totalFights: number;
  wins: number;
  losses: number;
  draws: number;
  knockouts: number;
  profileImage?: string;
  coverImage?: string;
  popularity: number;
  ranking?: number;
}

export interface FighterFilters {
  status?: string;
  stable?: string;
  limit?: number;
  offset?: number;
}

export interface FighterStats {
  year: number;
  totalFights: number;
  wins: number;
  losses: number;
  knockouts: number;
  avgFightDuration?: number;
}

class FighterService extends BaseService {
  constructor() {
    super('/fighter');  // Correction: le backend utilise /api/fighter (singulier)
  }

  async getFighters(params?: FighterFilters): Promise<ApiResponse<Fighter[]>> {
    const searchParams = new URLSearchParams();

    // Le backend nécessite ces paramètres avec des valeurs par défaut
    searchParams.set('limit', (params?.limit || 500).toString());
    searchParams.set('offset', (params?.offset || 0).toString());

    // Paramètres optionnels
    if (params?.status) searchParams.set('status', params.status);
    if (params?.stable) searchParams.set('stable', params.stable);

    const query = `?${searchParams.toString()}`;

    try {
      // Tenter d'utiliser la route principale
      const response = await this.get<Fighter[]>(query);

      // Si la réponse est valide et contient des données, la retourner
      if (response.data && Array.isArray(response.data)) {
        return response;
      }

      // Sinon, utiliser la route /top comme fallback (bug du backend avec validation)
      console.warn('[FighterService] Route principale échouée ou vide, utilisation de /top comme fallback');
      return this.getTopFighters();
    } catch (error: any) {
      // En cas d'erreur, utiliser la route /top
      console.error('[FighterService] Erreur sur route principale:', error);
      return this.getTopFighters();
    }
  }

  async getFighter(fighterId: string): Promise<ApiResponse<Fighter>> {
    return this.get<Fighter>(`/${fighterId}`);
  }

  async getTopFighters(): Promise<ApiResponse<Fighter[]>> {
    return this.get<Fighter[]>('/top');
  }

  async searchFighters(query: string): Promise<ApiResponse<Fighter[]>> {
    return this.get<Fighter[]>(`/search?q=${encodeURIComponent(query)}`);
  }

  async getFighterStats(fighterId: string): Promise<ApiResponse<FighterStats[]>> {
    return this.get<FighterStats[]>(`/${fighterId}/stats`);
  }

  async createFighter(payload: Partial<Fighter>): Promise<ApiResponse<Fighter>> {
    return this.post<Fighter>('/', payload);
  }

  async updateFighter(fighterId: string, payload: Partial<Fighter>): Promise<ApiResponse<Fighter>> {
    return this.patch<Fighter>(`/${fighterId}`, payload);
  }

  async deleteFighter(fighterId: string): Promise<ApiResponse<void>> {
    return this.delete(`/${fighterId}`);
  }
}

export const fighterService = new FighterService();
export default fighterService;
