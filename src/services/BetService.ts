import { BaseService, ApiResponse } from './BaseService';
import { Fight } from './FightService';

export interface Bet {
  id: string;
  amount: number;
  chosenFighter: 'A' | 'B';
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'POSTPONED' | 'WON' | 'LOST' | 'REFUNDED' | 'CREATOR_WON' | 'ACCEPTOR_WON';
  potentialWin?: number;
  winAmount?: number;
  actualWin?: number;
  odds?: number;
  createdAt: string;
  acceptedAt?: string;
  settledAt?: string;
  canCancelUntil?: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  acceptor?: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  fight: Fight;
}

export interface MyBetsResponse {
  created: Bet[];
  accepted: Bet[];
}

export interface BetFilters {
  status?: string;
  fightId?: string;
  userId?: string;
  dayEventId?: string;
  limit?: number;
  offset?: number;
}

export interface BetStats {
  totalBets: number;
  totalWon: number;
  totalLost: number;
  totalPending: number;
  winRate: number;
  totalAmount: number;
  totalWinnings: number;
}

export interface CreateBetPayload {
  fightId: string;
  chosenFighter: 'A' | 'B';
  amount: number;
  taggedUserId?: string;
}

class BetService extends BaseService {
  constructor() {
    super('/bet');
  }

  async getBets(params?: BetFilters): Promise<ApiResponse<Bet[]>> {
    const searchParams = new URLSearchParams();

    if (params?.status) searchParams.set('status', params.status);
    if (params?.fightId) searchParams.set('fightId', params.fightId);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.dayEventId) searchParams.set('dayEventId', params.dayEventId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.get<Bet[]>(query);
  }

  async getBet(betId: string): Promise<ApiResponse<Bet>> {
    return this.get<Bet>(`/${betId}`);
  }

  async getMyBets(): Promise<ApiResponse<MyBetsResponse>> {
    return this.get<MyBetsResponse>('/my-bets');
  }

  async getActiveBets(): Promise<ApiResponse<Bet[]>> {
    return this.get<Bet[]>('/active');
  }

  async getBetStats(): Promise<ApiResponse<BetStats>> {
    return this.get<BetStats>('/stats');
  }

  async getAvailableBets(fightId: string): Promise<ApiResponse<Bet[]>> {
    return this.get<Bet[]>(`/available/${fightId}`);
  }

  async getAvailableBetPending(params?: { limit?: number; offset?: number }): Promise<ApiResponse<Bet[]>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.get<Bet[]>(`/status/pending${query}`);
  }

  async createBet(payload: CreateBetPayload): Promise<ApiResponse<Bet>> {
    return this.post<Bet>('/', payload);
  }

  async acceptBet(betId: string): Promise<ApiResponse<Bet>> {
    return this.post<Bet>(`/${betId}/accept`);
  }

  async cancelBet(betId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/${betId}`);
  }

  // Admin Methods
  async settleBet(betId: string, winner: 'A' | 'B' | 'DRAW'): Promise<ApiResponse<Bet>> {
    return this.post<Bet>(`/${betId}/settle`, { winner });
  }

  async checkExpiredBets(): Promise<ApiResponse<{ expiredPendingBets: number }>> {
    return this.post<{ expiredPendingBets: number }>('/expire-check');
  }
}

export const betService = new BetService();
export default betService;