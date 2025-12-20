import { BaseService, ApiResponse } from './BaseService';

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  stable?: string;
  profileImage?: string;
  wins: number;
  losses: number;
  draws: number;
  totalFights: number;
}

export interface Fight {
  id: string;
  title: string;
  description?: string;
  location: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';
  oddsA: number;
  oddsB: number;
  totalBets: number;
  totalAmount: number;
  fighterA: Fighter;
  fighterB: Fighter;
  dayEvent?: DayEvent;
  result?: FightResult;
}

export interface FightResult {
  id: string;
  winner: 'A' | 'B' | 'DRAW' | 'CANCELLED';
  victoryMethod?: string;
}

export interface ValidateResultPayload {
  winner: 'A' | 'B' | 'DRAW' | 'CANCELLED';
  victoryMethod?: string;
  notes?: string;
  password?: string;
  otpCode?: string;
}

export interface DayEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  venue?: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  bannerImage?: string;
  posterImage?: string;
  fights?: Fight[];
  totalBets: number;
  totalAmount: number;
}

export interface FightFilters {
  status?: string;
  fighterId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

class FightService extends BaseService {
  constructor() {
    super('/fight');
  }

  async getFights(params?: FightFilters): Promise<ApiResponse<Fight[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.fighterId) searchParams.set('fighterId', params.fighterId);
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.get<Fight[]>(query);
  }

  async getFight(fightId: string): Promise<ApiResponse<Fight>> {
    return this.get<Fight>(`/${fightId}`);
  }

  async getUpcomingFights(): Promise<ApiResponse<Fight[]>> {
    return this.get<Fight[]>('/upcoming');
  }

  async getPopularFights(): Promise<ApiResponse<Fight[]>> {
    return this.get<Fight[]>('/popular');
  }

  // Day Events
  async getDayEvents(): Promise<ApiResponse<DayEvent[]>> {
    return this.get<DayEvent[]>('/day-events');
  }

  async getDayEvent(eventId: string): Promise<ApiResponse<DayEvent>> {
    return this.get<DayEvent>(`/day-events/${eventId}`);
  }

  async getUpcomingEvents(): Promise<ApiResponse<DayEvent[]>> {
    return this.get<DayEvent[]>('/day-events/upcoming');
  }

  async getCurrentEvent(): Promise<ApiResponse<DayEvent>> {
    return this.get<DayEvent>('/day-events/current');
  }

  async validateFightResult(fightId: string, payload: ValidateResultPayload): Promise<ApiResponse<Fight>> {
    return this.post<Fight>(`/${fightId}/validate-result`, payload);
  }

  async requestValidationOTP(fightId: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/${fightId}/request-validation-otp`, {});
  }
}

export const fightService = new FightService();
export default fightService;
