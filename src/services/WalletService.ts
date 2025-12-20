import { BaseService, ApiResponse } from './BaseService';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface WithdrawalRequest {
    id: string;
    amount: number;
    phoneNumber: string;
    provider: string;
    status: WithdrawalStatus;
    requestedAt: string;
    approvedAt?: string;
    processedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    transactionRef?: string;
    adminNotes?: string;
    userId: string;
    user?: {
        name: string;
        phone: string;
    };
}

export interface WalletBalance {
    balance: number;
    lockedBalance: number;
    totalWon: number;
    totalLost: number;
}

export interface DepositRequest {
    amount: bigint;
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
    phoneNumber: string;
}

export interface WithdrawalRequestData {
    amount: bigint;
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
    phoneNumber: string;
}

class WalletService extends BaseService {
    constructor() {
        super('/wallet');
    }

    async getWithdrawalRequests(): Promise<ApiResponse<WithdrawalRequest[]>> {
        return this.get<WithdrawalRequest[]>('/withdrawals');
    }

    async getBalance(): Promise<ApiResponse<WalletBalance>> {
        return this.get<WalletBalance>('/balance');
    }

    async deposit(data: DepositRequest): Promise<ApiResponse<any>> {
        return this.post<any>('/deposit', {
            amount: data.amount.toString(),
            provider: data.provider,
            phoneNumber: data.phoneNumber
        });
    }

    async withdraw(data: WithdrawalRequestData): Promise<ApiResponse<any>> {
        return this.post<any>('/withdraw', {
            amount: data.amount.toString(),
            provider: data.provider,
            phoneNumber: data.phoneNumber
        });
    }

    async getTransactionHistory(limit: number = 20): Promise<ApiResponse<any[]>> {
        return this.get<any[]>(`/transactions?limit=${limit}`);
    }
}

export const walletService = new WalletService();
export default walletService;
