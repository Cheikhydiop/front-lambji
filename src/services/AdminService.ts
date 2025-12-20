import { BaseService, ApiResponse } from './BaseService';
import { User } from './AuthService';
import { Fight, DayEvent } from './FightService';
import { Fighter } from './FighterService';
import { Bet } from './BetService';
import { WithdrawalRequest } from './WalletService';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFights: number;
  upcomingFights: number;
  totalBets: number;
  pendingBets: number;
  acceptedBets: number;
  cancelledBets: number;
  totalVolume: number;
  pendingWithdrawals: number;
  todayDeposits: number;
  todayWithdrawals: number;
}

export interface AuditLog {
  id: string;
  action: string;
  table: string;
  recordId?: string;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  isBanned?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateFighterPayload {
  name: string;
  nickname?: string;
  stable?: string;
  birthDate?: string;
  birthPlace?: string;
  weight?: number;
  height?: number;
  profileImage?: string;
}

export interface UpdateFighterPayload extends Partial<CreateFighterPayload> {
  status?: string;
  isActive?: boolean;
}

export interface CreateFightPayload {
  title: string;
  description?: string;
  location: string;
  scheduledAt: string;
  fighterAId: string;
  fighterBId: string;
  dayEventId?: string;
  oddsA?: number;
  oddsB?: number;
}

export interface CreateEventPayload {
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  venue?: string;
  bannerImage?: string;
  minBetAmount?: number;
  maxBetAmount?: number;
}

// Supprimé ValidateResultPayload d'ici car déplacé vers FightService

class AdminService extends BaseService {
  constructor() {
    super('/admin');
  }

  // Dashboard
  getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>('/stats');
  }

  // Users Management
  getUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.isBanned !== undefined) params.append('isBanned', filters.isBanned.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    return this.get<User[]>(`/users${queryString ? `?${queryString}` : ''}`);
  }

  getUser(userId: string): Promise<ApiResponse<User>> {
    return this.get<User>(`/users/${userId}`);
  }

  banUser(userId: string, reason: string): Promise<ApiResponse<User>> {
    return this.post<User>(`/users/${userId}/ban`, { reason });
  }

  unbanUser(userId: string): Promise<ApiResponse<User>> {
    return this.post<User>(`/users/${userId}/unban`);
  }

  // Fighters Management
  createFighter(payload: CreateFighterPayload): Promise<ApiResponse<Fighter>> {
    return this.post<Fighter>('/fighters', payload);
  }

  updateFighter(fighterId: string, payload: UpdateFighterPayload): Promise<ApiResponse<Fighter>> {
    return this.patch<Fighter>(`/fighters/${fighterId}`, payload);
  }

  deleteFighter(fighterId: string): Promise<ApiResponse<void>> {
    return this.delete(`/fighters/${fighterId}`);
  }

  // Fights Management
  createFight(payload: CreateFightPayload): Promise<ApiResponse<Fight>> {
    return this.post<Fight>('/fights', payload);
  }

  updateFightStatus(fightId: string, status: string): Promise<ApiResponse<Fight>> {
    return this.patch<Fight>(`/fights/${fightId}/status`, { status });
  }

  // validateFightResult déplacé vers FightService

  // Events Management
  createEvent(payload: CreateEventPayload): Promise<ApiResponse<DayEvent>> {
    return this.post<DayEvent>('/day-events', payload);
  }

  updateEvent(eventId: string, payload: Partial<CreateEventPayload>): Promise<ApiResponse<DayEvent>> {
    return this.put<DayEvent>(`/day-events/${eventId}`, payload);
  }

  deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    return this.delete(`/day-events/${eventId}`);
  }

  // Bets Management
  getBets(filters?: { status?: string; fightId?: string; limit?: number; offset?: number }): Promise<ApiResponse<Bet[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fightId) params.append('fightId', filters.fightId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    return this.get<Bet[]>(`/bets${queryString ? `?${queryString}` : ''}`);
  }

  settleBet(betId: string, winner: 'A' | 'B' | 'DRAW'): Promise<ApiResponse<Bet>> {
    return this.post<Bet>(`/bets/${betId}/settle`, { winner });
  }

  // Withdrawals Management
  getPendingWithdrawals(): Promise<ApiResponse<WithdrawalRequest[]>> {
    return this.get<WithdrawalRequest[]>('/withdrawals/pending');
  }

  approveWithdrawal(withdrawalId: string): Promise<ApiResponse<WithdrawalRequest>> {
    return this.post<WithdrawalRequest>(`/withdrawals/${withdrawalId}/approve`);
  }

  rejectWithdrawal(withdrawalId: string, reason: string): Promise<ApiResponse<WithdrawalRequest>> {
    return this.post<WithdrawalRequest>(`/withdrawals/${withdrawalId}/reject`, { reason });
  }

  // Audits Management
  getAuditLogs(page: number = 1, limit: number = 20): Promise<ApiResponse<AuditLog[]>> {
    return this.get<AuditLog[]>(`/audit-logs?page=${page}&limit=${limit}`);
  }
}

export const adminService = new AdminService();
