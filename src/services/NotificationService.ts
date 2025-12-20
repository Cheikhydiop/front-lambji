import { BaseService, ApiResponse } from './BaseService';

export type NotificationType =
  | 'BET_ACCEPTED'
  | 'BET_PLACED'
  | 'NEW_TAGGED_BET'
  | 'WIN_CREDITED'
  | 'FIGHT_FINISHED'
  | 'FIGHT_STARTING'
  | 'FIGHT_RESULT'
  | 'PAYMENT_CONFIRMED'
  | 'WITHDRAWAL_CONFIRMED'
  | 'WITHDRAWAL_PENDING'
  | 'DEPOSIT_SUCCESS'
  | 'DEPOSIT_FAILED'
  | 'BET_WON'
  | 'BET_LOST'
  | 'BET_REFUNDED'
  | 'ADMIN_ALERT'
  | 'SYSTEM_MAINTENANCE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: number;
  expiresAt?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

class NotificationService extends BaseService {
  constructor() {
    super('/notifications');
  }

  // Get all notifications
  getNotifications(filters?: NotificationFilters): Promise<ApiResponse<Notification[]>> {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    return this.get<Notification[]>(`/${queryString ? `?${queryString}` : ''}`);
  }

  // Get unread count
  getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.get('/unread-count');
  }

  // Mark as read
  markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    return this.patch<Notification>(`/${notificationId}/read`);
  }

  // Mark all as read
  markAllAsRead(): Promise<ApiResponse<{ updated: number }>> {
    return this.post('/mark-all-read');
  }

  // Delete notification
  deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return this.delete(`/${notificationId}`);
  }

  // Admin: Send notification to user
  sendNotification(userId: string, notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    actionUrl?: string;
  }): Promise<ApiResponse<Notification>> {
    return this.post('/admin/send', { userId, ...notification });
  }

  // Admin: Broadcast notification
  broadcastNotification(notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<ApiResponse<{ sent: number }>> {
    return this.post('/admin/broadcast', notification);
  }
}

export const notificationService = new NotificationService();
