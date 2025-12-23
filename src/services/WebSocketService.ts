import { io, Socket } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';

// Enum updated to match backend event names (snake_case)
// This ensures compatibility with the socket.io events emitted by the backend
export enum WebSocketMessageType {
    CONNECTION_STATUS = 'connection_status',
    AUTH_ERROR = 'auth_error',
    FIGHT_STATUS_UPDATE = 'fight_status_update',
    FIGHT_RESULT = 'fight_result',
    FIGHT_STARTED = 'fight_started',
    FIGHT_FINISHED = 'fight_finished',
    FIGHT_CANCELLED = 'fight_cancelled',
    BET_CREATED = 'bet_created',
    BET_ACCEPTED = 'bet_accepted',
    BET_CANCELLED = 'bet_cancelled',
    BET_WON = 'bet_won',
    BET_LOST = 'bet_lost',
    TRANSACTION_CONFIRMED = 'transaction_confirmed',
    TRANSACTION_FAILED = 'transaction_failed',
    WALLET_UPDATE = 'wallet_update',
    NOTIFICATION = 'notification',
    SYSTEM_ALERT = 'system_alert',
    SUBSCRIBE_FIGHT = 'subscribe_fight',
    UNSUBSCRIBE_FIGHT = 'unsubscribe_fight',
    SUBSCRIBE_BETS = 'subscribe_bets',
    UNSUBSCRIBE_BETS = 'unsubscribe_bets',
    PING = 'ping',
    PONG = 'pong'
}

type MessageHandler = (payload: any) => void;

class WebSocketService {
    private socket: Socket | null = null;
    private handlers: Map<string, Set<MessageHandler>> = new Map();
    private baseUrl: string;

    constructor() {
        const envUrl = import.meta.env.VITE_WS_URL || 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app';
        // Remove /ws suffix if present as it's added via path option
        this.baseUrl = envUrl.replace(/\/ws\/?$/, '');
    }

    public connect(userId?: string) {
        if (this.socket?.connected) return;

        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            console.warn('[WebSocket] Cannot connect: No token found');
            return;
        }

        console.log('[WebSocket] Connecting to Socket.io at', this.baseUrl);

        this.socket = io(this.baseUrl, {
            path: '/ws', // Matches backend configuration
            query: { token }, // Backend expects token in query
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            withCredentials: true
        });

        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected', this.socket?.id);

            // Log connection status
            this.handleMessage(WebSocketMessageType.CONNECTION_STATUS, {
                status: 'connected',
                userId: userId,
                socketId: this.socket?.id
            });
        });

        this.socket.on('connect_error', (err) => {
            console.error('[WebSocket] Connection Error', err.message);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason);
        });

        // Listen to ALL events and dispatch to handlers
        this.socket.onAny((eventName, ...args) => {
            const data = args[0];
            // console.debug(`[WebSocket] Event received: ${eventName}`, data);

            this.handleMessage(eventName, data);

            // Global handling for notifications
            if (eventName === WebSocketMessageType.NOTIFICATION) {
                toast({
                    title: data.title || 'Notification',
                    description: data.message || data.description,
                });
            } else if (eventName === WebSocketMessageType.SYSTEM_ALERT) {
                toast({
                    title: data.title || 'Alerte Système',
                    description: data.message,
                    variant: 'destructive'
                });
            }
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public sendMessage(type: WebSocketMessageType, payload: any = {}) {
        if (this.socket?.connected) {
            this.socket.emit(type, payload);
        } else {
            // Queue message or warn?
            // console.warn('[WebSocket] Cannot send message: not connected');
        }
    }

    public on(type: WebSocketMessageType, handler: MessageHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);
    }

    public off(type: WebSocketMessageType, handler: MessageHandler) {
        this.handlers.get(type)?.delete(handler);
    }

    private handleMessage(type: string, payload: any) {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.forEach(handler => handler(payload));
        }
    }
}

export const webSocketService = new WebSocketService();
