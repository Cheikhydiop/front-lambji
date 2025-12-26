import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronRight, Shield, Bell, HelpCircle, FileText, ArrowLeft, Check, Trash2, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import betService, { BetStats } from '@/services/BetService';
import { webSocketService, WebSocketMessageType } from '@/services/WebSocketService';
interface ProfileProps {
  tab?: string;
}

const menuItems = [
  { icon: Wallet, label: 'Mon Portefeuille', path: '/wallet' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Shield, label: 'Sécurité', path: '/profile/security' },
  { icon: Settings, label: 'Paramètres', path: '/profile/settings' },
  { icon: HelpCircle, label: 'Aide & Support', path: '/help' },
];

export default function Profile({ tab }: ProfileProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifications, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [stats, setStats] = useState<BetStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);



  useEffect(() => {
    if (isAuthenticated) {
      loadStats();

      // Subscribe to relevant events for stats update
      const handleStatsUpdate = () => {
        loadStats();
      };

      webSocketService.on(WebSocketMessageType.BET_WON, handleStatsUpdate);
      webSocketService.on(WebSocketMessageType.BET_LOST, handleStatsUpdate);
      webSocketService.on(WebSocketMessageType.BET_CANCELLED, handleStatsUpdate);
      webSocketService.on(WebSocketMessageType.BET_REFUNDED, handleStatsUpdate);
      // Also BET_ACCEPTED changes "active" bets but implies "Total Bets" might increment if "Total Bets" counts all? 
      // Actually usually Total Bets counts finished bets or all? 
      // The stats query counts all (count(*)). So CREATED (PENDING) counts too.
      // So BET_CREATED (if viewed by creator) or just on mount is enough.
      // But if stats counts ACCEPTED vs WON, settlement changes stats.
      webSocketService.on(WebSocketMessageType.BET_ACCEPTED, handleStatsUpdate);

      return () => {
        webSocketService.off(WebSocketMessageType.BET_WON, handleStatsUpdate);
        webSocketService.off(WebSocketMessageType.BET_LOST, handleStatsUpdate);
        webSocketService.off(WebSocketMessageType.BET_CANCELLED, handleStatsUpdate);
        webSocketService.off(WebSocketMessageType.BET_REFUNDED, handleStatsUpdate);
        webSocketService.off(WebSocketMessageType.BET_ACCEPTED, handleStatsUpdate);
      };
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await betService.getBetStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Déconnexion',
      description: 'À bientôt!',
    });
    navigate('/');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BET_WON': return '🎉';
      case 'BET_LOST': return '😔';
      case 'DEPOSIT_SUCCESS': return '💰';
      case 'FIGHT_FINISHED': return '⚔️';
      case 'NEW_BET_AVAILABLE': return '📢';
      default: return '🔔';
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="safe-top flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="p-4 bg-muted rounded-full mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground text-center mb-6">
            Connectez-vous pour accéder à votre profil
          </p>
          <Link
            to="/auth"
            className="px-8 py-3 bg-gradient-gold text-primary-foreground rounded-xl font-semibold shadow-gold"
          >
            Se connecter
          </Link>
        </div>
      </AppLayout>
    );
  }

  // View: Notifications History
  if (tab === 'notifications') {
    return (
      <AppLayout>
        <div className="safe-top h-screen flex flex-col">
          {/* Header */}
          <header className="px-4 py-4 flex items-center justify-between border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Notifications</h1>
            </div>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                Tout lire
              </Button>
            )}
          </header>

          {/* List */}
          <ScrollArea className="flex-1 px-4 py-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Bell className="h-16 w-16 mb-4 opacity-20" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-3 pb-20">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-all ${!notification.isRead
                      ? 'bg-primary/5 border-primary/20 shadow-sm'
                      : 'bg-card border-border/50'
                      }`}
                  >
                    <div className="flex gap-4">
                      <div className="text-3xl pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-primary' : 'text-foreground'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-snug">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-dashed border-border/50">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3 h-3 mr-1" /> Marquer lu
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </AppLayout>
    );
  }

  // Default View: Profile Menu
  return (
    <AppLayout>
      <div className="safe-top">
        {/* Header */}
        <header className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-foreground mb-4">Mon Profil</h1>
        </header>

        {/* User Info */}
        <div className="px-4 py-4">
          <div className="bg-gradient-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.phone}</p>
                {user?.email && (
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/edit-profile')}
            >
              Modifier le profil
            </Button>
          </div>
        </div>

        {/* Stats Section - Premium Design */}
        <div className="px-4 py-4">
          <div className="bg-[#1a1b1e] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Background Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[120px] rounded-full transition-all duration-700 group-hover:bg-primary/20"></div>

            <div className="relative z-10 grid grid-cols-3 gap-4 items-center">
              {/* Paris Totaux */}
              <div className="text-center">
                <p className="text-3xl font-black text-amber-500 mb-1 tracking-tighter">
                  {isLoadingStats ? '...' : (stats?.totalBets || 0)}
                </p>
                <p className="text-[10px] uppercase font-extrabold text-gray-500 tracking-[0.1em]">
                  Paris totaux
                </p>
              </div>

              {/* Victoires */}
              <div className="text-center border-x border-white/10 px-2">
                <p className="text-3xl font-black text-emerald-500 mb-1 tracking-tighter">
                  {isLoadingStats ? '...' : (stats?.totalWon || 0)}
                </p>
                <p className="text-[10px] uppercase font-extrabold text-gray-500 tracking-[0.1em]">
                  Victoires
                </p>
              </div>

              {/* Taux de réussite */}
              <div className="text-center">
                <p className="text-3xl font-black text-white mb-1 tracking-tighter">
                  {isLoadingStats ? '...' : `${Math.round(stats?.winRate || 0)}%`}
                </p>
                <p className="text-[10px] uppercase font-extrabold text-gray-500 tracking-[0.1em]">
                  Taux réussite
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="px-4 py-4">
          <div className="bg-gradient-card rounded-2xl overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-border' : ''
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 py-4">
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Lamb Ji v1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
