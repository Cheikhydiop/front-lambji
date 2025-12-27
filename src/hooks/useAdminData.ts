import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/AdminService';
import { useToast } from './use-toast';

// Query keys pour React Query
export const ADMIN_QUERY_KEYS = {
    dashboardStats: ['admin', 'dashboard', 'stats'],
    analytics: ['admin', 'analytics'],
    pendingWithdrawals: ['admin', 'withdrawals', 'pending'],
    users: (filters?: any) => ['admin', 'users', filters],
    fights: (filters?: any) => ['admin', 'fights', filters],
    bets: (filters?: any) => ['admin', 'bets', filters],
} as const;

/**
 * Hook pour les statistiques du dashboard
 * Auto-refetch toutes les 30 secondes
 */
export function useAdminDashboardStats() {
    return useQuery({
        queryKey: ADMIN_QUERY_KEYS.dashboardStats,
        queryFn: async () => {
            const response = await adminService.getDashboardStats();
            return response.data;
        },
        refetchInterval: 30000, // Refetch toutes les 30 secondes
        staleTime: 20000, // Considérer comme obsolète après 20 secondes
        retry: 2,
    });
}

/**
 * Hook pour les analytics
 * Auto-refetch toutes les 60 secondes
 */
export function useAdminAnalytics() {
    return useQuery({
        queryKey: ADMIN_QUERY_KEYS.analytics,
        queryFn: async () => {
            const response = await adminService.getAnalytics();
            return response.data;
        },
        refetchInterval: 60000, // Refetch toutes les 60 secondes
        staleTime: 40000,
        retry: 2,
    });
}

/**
 * Hook pour les retraits en attente
 * Auto-refetch toutes les 10 secondes
 */
export function useAdminPendingWithdrawals() {
    return useQuery({
        queryKey: ADMIN_QUERY_KEYS.pendingWithdrawals,
        queryFn: async () => {
            const response = await adminService.getPendingWithdrawals();
            return response.data || [];
        },
        refetchInterval: 10000, // Refetch toutes les 10 secondes
        staleTime: 5000,
        retry: 2,
    });
}

/**
 * Hook pour approuver un retrait
 * Invalide automatiquement le cache après succès
 */
export function useApproveWithdrawal() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (withdrawalId: string) => adminService.approveWithdrawal(withdrawalId),
        onSuccess: () => {
            // Invalider le cache pour forcer un refetch
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.pendingWithdrawals });
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardStats });

            toast({
                title: '✅ Retrait approuvé',
                description: 'Le retrait a été approuvé avec succès',
            });
        },
        onError: (error) => {
            toast({
                title: '❌ Erreur',
                description: 'Impossible d\'approuver le retrait',
                variant: 'destructive',
            });
        },
    });
}

/**
 * Hook pour rejeter un retrait
 * Invalide automatiquement le cache après succès
 */
export function useRejectWithdrawal() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ withdrawalId, reason }: { withdrawalId: string; reason: string }) =>
            adminService.rejectWithdrawal(withdrawalId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.pendingWithdrawals });
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardStats });

            toast({
                title: '✅ Retrait rejeté',
                description: 'Le retrait a été rejeté',
            });
        },
        onError: () => {
            toast({
                title: '❌ Erreur',
                description: 'Impossible de rejeter le retrait',
                variant: 'destructive',
            });
        },
    });
}

/**
 * Hook pour invalider toutes les données admin
 * Utile pour un bouton "Rafraîchir"
 */
export function useRefreshAdminData() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['admin'] });
    };
}
