import { BaseService, ApiResponse } from './BaseService';

export interface Transaction {
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET_PLACED' | 'BET_WIN';
    amount: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED';
    provider?: string;
    createdAt: string;
}

export interface WalletData {
    balance: number;
    lockedBalance: number;
    bonusBalance: number;
}

export class TransactionService extends BaseService {
    constructor() {
        super('/transactions');
    }

    // Obtenir l'historique des transactions
    // Backend route: GET /api/transactions?limit=X&offset=Y
    getHistory(limit = 10, offset = 0): Promise<ApiResponse<Transaction[]>> {
        return this.get<Transaction[]>(`/?limit=${limit}&offset=${offset}`);
    }

    // Dépôt
    deposit(amount: number, provider: string): Promise<ApiResponse<Transaction>> {
        return this.post<Transaction>('/', { amount, provider });
    }

    // Retrait
    withdraw(amount: number, provider: string, phone: string): Promise<ApiResponse<Transaction>> {
        return this.post<Transaction>('/withdrawal', { amount, provider, phone });
    }
}

export const transactionService = new TransactionService();
