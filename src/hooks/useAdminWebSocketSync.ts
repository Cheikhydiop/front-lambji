import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { webSocketService, WebSocketMessageType } from '../services/WebSocketService';
import { ADMIN_QUERY_KEYS } from './useAdminData';

/**
 * Hook pour synchroniser React Query avec les événements WebSocket
 * Invalide automatiquement le cache quand des mises à jour arrivent en temps réél
 */
export function useAdminWebSocketSync() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Handler générique qui invalide les queries appropriées
        const handleFightUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardStats });
            queryClient.invalidateQueries({ queryKey: ['admin', 'fights'] });
        };

        const handleBetUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardStats });
            queryClient.invalidateQueries({ queryKey: ['admin', 'bets'] });
        };

        const handleTransactionUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardStats });
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.pendingWithdrawals });
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.analytics });
        };

        const handleUserUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardStats });
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        };

        // S'abonner aux événements WebSocket
        webSocketService.on(WebSocketMessageType.FIGHT_STATUS_UPDATE, handleFightUpdate);
        webSocketService.on(WebSocketMessageType.FIGHT_RESULT, handleFightUpdate);
        webSocketService.on(WebSocketMessageType.FIGHT_STARTED, handleFightUpdate);
        webSocketService.on(WebSocketMessageType.FIGHT_FINISHED, handleFightUpdate);
        webSocketService.on(WebSocketMessageType.FIGHT_CANCELLED, handleFightUpdate);

        webSocketService.on(WebSocketMessageType.BET_CREATED, handleBetUpdate);
        webSocketService.on(WebSocketMessageType.BET_ACCEPTED, handleBetUpdate);
        webSocketService.on(WebSocketMessageType.BET_CANCELLED, handleBetUpdate);
        webSocketService.on(WebSocketMessageType.BET_SETTLED, handleBetUpdate);

        webSocketService.on(WebSocketMessageType.TRANSACTION_CONFIRMED, handleTransactionUpdate);
        webSocketService.on(WebSocketMessageType.WALLET_UPDATE, handleTransactionUpdate);

        webSocketService.on(WebSocketMessageType.USER_REGISTERED, handleUserUpdate);

        // Cleanup au démontage
        return () => {
            webSocketService.off(WebSocketMessageType.FIGHT_STATUS_UPDATE, handleFightUpdate);
            webSocketService.off(WebSocketMessageType.FIGHT_RESULT, handleFightUpdate);
            webSocketService.off(WebSocketMessageType.FIGHT_STARTED, handleFightUpdate);
            webSocketService.off(WebSocketMessageType.FIGHT_FINISHED, handleFightUpdate);
            webSocketService.off(WebSocketMessageType.FIGHT_CANCELLED, handleFightUpdate);

            webSocketService.off(WebSocketMessageType.BET_CREATED, handleBetUpdate);
            webSocketService.off(WebSocketMessageType.BET_ACCEPTED, handleBetUpdate);
            webSocketService.off(WebSocketMessageType.BET_CANCELLED, handleBetUpdate);
            webSocketService.off(WebSocketMessageType.BET_SETTLED, handleBetUpdate);

            webSocketService.off(WebSocketMessageType.TRANSACTION_CONFIRMED, handleTransactionUpdate);
            webSocketService.off(WebSocketMessageType.WALLET_UPDATE, handleTransactionUpdate);

            webSocketService.off(WebSocketMessageType.USER_REGISTERED, handleUserUpdate);
        };
    }, [queryClient]);
}

/**
 * Hook pour le provider admin global
 * À utiliser dans AdminLayout pour activer la sync temps réel partout
 */
export function useAdminRealtimeSync() {
    useAdminWebSocketSync();

    // Log pour debug
    useEffect(() => {
        console.log('🔄 Admin realtime sync activated');
        return () => console.log('🔄 Admin realtime sync deactivated');
    }, []);
}
