import { useEffect, useState } from 'react';
import { Users, Swords, Trophy, Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, Shield } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ADMIN_PATH } from '@/config/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService, DashboardStats, AnalyticsData } from '@/services/AdminService';
import { fightService, Fight } from '@/services/FightService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { webSocketService, WebSocketMessageType } from '@/services/WebSocketService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockStats: DashboardStats = {
  totalUsers: 1234,
  activeUsers: 856,
  totalFights: 45,
  upcomingFights: 8,
  totalBets: 3456,
  pendingBets: 127,
  acceptedBets: 3120,
  cancelledBets: 209,
  totalVolume: 45678000,
  pendingWithdrawals: 12,
  todayDeposits: 2500000,
  todayWithdrawals: 1800000,
  totalCommission: 150000,
  todayCommission: 12000,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [ongoingFights, setOngoingFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Polling de sécurité toutes les 30 secondes
    const interval = setInterval(loadData, 30000);

    // WebSocket Listeners pour le temps réel
    const handleUpdate = () => loadData();

    // S'abonner à tous les événements pertinents pour le dashboard
    webSocketService.on(WebSocketMessageType.FIGHT_STATUS_UPDATE, handleUpdate);
    webSocketService.on(WebSocketMessageType.FIGHT_RESULT, handleUpdate);
    webSocketService.on(WebSocketMessageType.FIGHT_STARTED, handleUpdate);
    webSocketService.on(WebSocketMessageType.FIGHT_FINISHED, handleUpdate);
    webSocketService.on(WebSocketMessageType.FIGHT_CANCELLED, handleUpdate);
    webSocketService.on(WebSocketMessageType.BET_ACCEPTED, handleUpdate);
    webSocketService.on(WebSocketMessageType.BET_CANCELLED, handleUpdate);
    webSocketService.on(WebSocketMessageType.TRANSACTION_CONFIRMED, handleUpdate);

    return () => {
      clearInterval(interval);
      webSocketService.off(WebSocketMessageType.FIGHT_STATUS_UPDATE, handleUpdate);
      webSocketService.off(WebSocketMessageType.FIGHT_RESULT, handleUpdate);
      webSocketService.off(WebSocketMessageType.FIGHT_STARTED, handleUpdate);
      webSocketService.off(WebSocketMessageType.FIGHT_FINISHED, handleUpdate);
      webSocketService.off(WebSocketMessageType.FIGHT_CANCELLED, handleUpdate);
      webSocketService.off(WebSocketMessageType.BET_ACCEPTED, handleUpdate);
      webSocketService.off(WebSocketMessageType.BET_CANCELLED, handleUpdate);
      webSocketService.off(WebSocketMessageType.TRANSACTION_CONFIRMED, handleUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, fightsRes, analyticsRes] = await Promise.all([
        adminService.getDashboardStats(),
        fightService.getFights({ status: 'ONGOING' }),
        adminService.getAnalytics()
      ]);

      if (statsRes.data) setStats(statsRes.data);
      else setStats(mockStats);

      if (fightsRes.data) setOngoingFights(fightsRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch {
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  // Format data for charts
  const financialData = analytics?.deposits.map((d) => ({
    date: d.date,
    deposits: d.total,
    withdrawals: analytics.withdrawals.find(w => w.date === d.date)?.total || 0,
  })) || [];

  const commissionData = analytics?.commissions || [];

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats?.totalUsers.toLocaleString() || '0',
      subtitle: `${stats?.activeUsers || 0} actifs`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Combats',
      value: stats?.totalFights.toString() || '0',
      subtitle: `${stats?.upcomingFights || 0} à venir`,
      icon: Swords,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Paris Acceptés',
      value: stats?.acceptedBets.toLocaleString() || '0',
      subtitle: `${stats?.totalBets || 0} au total`,
      icon: Trophy,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Paris en Attente',
      value: stats?.pendingBets.toLocaleString() || '0',
      subtitle: `${stats?.cancelledBets || 0} annulés`,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
            <Clock className="w-4 h-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Flux Financier (Derniers 7 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                      formatter={(value: number) => [`${value.toLocaleString()} F`, '']}
                    />
                    <Bar dataKey="deposits" name="Dépôts" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="withdrawals" name="Retraits" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Commissions Générées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={commissionData}>
                    <defs>
                      <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#8b5cf6', fontSize: '12px' }}
                      formatter={(value: number) => [`${value.toLocaleString()} F`, 'Commission']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCommission)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume & Commissions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {(stats?.totalVolume || 0).toLocaleString()} F
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-500">
                {(stats?.totalCommission || 0).toLocaleString()} F
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{(stats?.todayCommission || 0).toLocaleString()} F aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Dépôts (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">
                +{(stats?.todayDeposits || 0).toLocaleString()} F
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                Retraits (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                -{(stats?.todayWithdrawals || 0).toLocaleString()} F
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ongoing Fights & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Combats en cours
              </CardTitle>
              <Badge variant="outline" className="text-orange-500 border-orange-200">
                {ongoingFights.length} ACTIFS
              </Badge>
            </CardHeader>
            <CardContent>
              {ongoingFights.length > 0 ? (
                <div className="space-y-4">
                  {ongoingFights.map(fight => (
                    <div key={fight.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div>
                        <p className="font-bold text-sm">{fight.title}</p>
                        <p className="text-xs text-muted-foreground">{fight.fighterA.name} VS {fight.fighterB.name}</p>
                      </div>
                      <a href={`${ADMIN_PATH}/fights?tab=ongoing`}>
                        <Button size="sm" variant="gold" className="h-8">
                          Détails
                        </Button>
                      </a>
                    </div>
                  ))}
                  <a href={`${ADMIN_PATH}/fights`} className="block text-center text-xs text-primary hover:underline pt-2">
                    Voir tous les combats
                  </a>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Aucun combat en cours actuellement.</p>
                  <a href={`${ADMIN_PATH}/fights`}>
                    <Button variant="link" size="sm" className="mt-2">
                      Démarrer un combat
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={`${ADMIN_PATH}/fights?tab=validation`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Swords className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Gestion des Combats</span>
                </a>
                <a
                  href={`${ADMIN_PATH}/withdrawals`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Wallet className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-sm">Traiter Retraits</span>
                </a>
                <a
                  href={`${ADMIN_PATH}/audit`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Logs d'audit</span>
                </a>
                <a
                  href={`${ADMIN_PATH}/notifications`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-sm">Notifications</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
