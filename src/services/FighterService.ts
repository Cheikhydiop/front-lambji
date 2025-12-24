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
    super('/fighters');
  }

  async getFighters(params?: FighterFilters): Promise<ApiResponse<Fighter[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.stable) searchParams.set('stable', params.stable);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.get<Fighter[]>(query);
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
