import { toast } from "@/hooks/use-toast";

export enum WebSocketMessageType {
    CONNECTION_STATUS = 'CONNECTION_STATUS',
    AUTH_ERROR = 'AUTH_ERROR',
    FIGHT_STATUS_UPDATE = 'FIGHT_STATUS_UPDATE',
    FIGHT_RESULT = 'FIGHT_RESULT',
    FIGHT_STARTED = 'FIGHT_STARTED',
    FIGHT_FINISHED = 'FIGHT_FINISHED',
    FIGHT_CANCELLED = 'FIGHT_CANCELLED',
    BET_CREATED = 'BET_CREATED',
    BET_ACCEPTED = 'BET_ACCEPTED',
    BET_CANCELLED = 'BET_CANCELLED',
    BET_WON = 'BET_WON',
    BET_LOST = 'BET_LOST',
    TRANSACTION_CONFIRMED = 'TRANSACTION_CONFIRMED',
    TRANSACTION_FAILED = 'TRANSACTION_FAILED',
    WALLET_UPDATE = 'WALLET_UPDATE',
    NOTIFICATION = 'NOTIFICATION',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    SUBSCRIBE_FIGHT = 'SUBSCRIBE_FIGHT',
    UNSUBSCRIBE_FIGHT = 'UNSUBSCRIBE_FIGHT',
    SUBSCRIBE_BETS = 'SUBSCRIBE_BETS',
    UNSUBSCRIBE_BETS = 'UNSUBSCRIBE_BETS',
    PING = 'PING',
    PONG = 'PONG'
}

type MessageHandler = (payload: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
    private reconnectInterval: NodeJS.Timeout | null = null;
    private isConnecting = false;
    private url: string;

    constructor() {
        this.url = (import.meta.env.VITE_WS_URL || 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app').replace('http', 'ws') + '/ws';
    }

    public connect(userId: string) {
        if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;

        this.isConnecting = true;
        console.log(`Connecting to WebSocket at ${this.url}...`);

        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
            this.isConnecting = false;
            if (this.reconnectInterval) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }

            // Auto-subscribe to personal updates
            this.sendMessage(WebSocketMessageType.SUBSCRIBE_BETS, { userId });
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const { type, payload, message } = data; // backend sometimes sends 'message' instead of payload in connection status

                this.handleMessage(type, payload || message || data);

                // Global notification handling
                if (type === WebSocketMessageType.NOTIFICATION || type === WebSocketMessageType.SYSTEM_ALERT) {
                    toast({
                        title: payload.title || 'Notification',
                        description: payload.message || payload.description,
                    });
                }
            } catch (e) {
                console.error('Error parsing WS message', e);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket Disconnected');
            this.isConnecting = false;
            this.socket = null;
            this.startReconnect(userId);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket Error', error);
            this.isConnecting = false;
        };
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    public sendMessage(type: WebSocketMessageType, payload: any = {}) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        } else {
            console.warn('Cannot send message: WebSocket is not open');
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

    private handleMessage(type: WebSocketMessageType, payload: any) {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.forEach(handler => handler(payload));
        }
    }

    private startReconnect(userId: string) {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setInterval(() => {
                this.connect(userId);
            }, 5000);
        }
    }
}

export const webSocketService = new WebSocketService();
