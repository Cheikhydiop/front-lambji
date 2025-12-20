import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, notificationService } from '../services/NotificationService';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import config from '../config';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize WebSocket connection
    useEffect(() => {
        if (!user) return;

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) return;

        const newSocket = io(config.wsUrl, {
            query: { token },
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('WebSocket connected for notifications');
        });

        newSocket.on('notification', (notification: any) => {
            // Add new notification to the list
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification (you can use a toast library here)
            console.log('New notification:', notification);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]);

    // Load notifications on mount
    useEffect(() => {
        if (user) {
            refreshNotifications();
        }
    }, [user]);

    const refreshNotifications = async () => {
        try {
            setLoading(true);
            const [notifResponse, countResponse] = await Promise.all([
                notificationService.getNotifications({ limit: 20 }),
                notificationService.getUnreadCount(),
            ]);

            if (notifResponse.data) {
                setNotifications(notifResponse.data);
            }
            if (countResponse.data) {
                setUnreadCount(countResponse.data.count);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            const wasUnread = notifications.find(n => n.id === id && !n.isRead);
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
