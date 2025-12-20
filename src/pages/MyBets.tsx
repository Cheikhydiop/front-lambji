import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, TrendingUp, TrendingDown, Clock, Plus, Filter, RefreshCw, User, Trophy, Calendar, Swords } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BetCard } from '@/components/bets/BetCard';
import { CancelBetButton } from '@/components/bets/CancelBetButton';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { betService } from '@/services';
import type { Bet } from '@/services/BetService';

type TabType = 'active' | 'history';
type FilterStatus = 'all' | 'PENDING' | 'ACCEPTED' | 'WON' | 'LOST' | 'CANCELLED' | 'REFUNDED';

interface BetWithRole extends Bet {
  isCreator?: boolean;
  userRole?: 'creator' | 'acceptor';
}

export default function MyBets() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [bets, setBets] = useState<BetWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [totalCount, setTotalCount] = useState<number>(0);

  // Options de filtrage
  const filterOptions: { value: FilterStatus; label: string; color: string }[] = [
    { value: 'all', label: 'Tous', color: 'bg-gray-500' },
    { value: 'PENDING', label: 'En attente', color: 'bg-yellow-500' },
    { value: 'ACCEPTED', label: 'Acceptés', color: 'bg-blue-500' },
    { value: 'WON', label: 'Gagnés', color: 'bg-green-500' },
    { value: 'LOST', label: 'Perdus', color: 'bg-red-500' },
    { value: 'CANCELLED', label: 'Annulés', color: 'bg-gray-400' },
    { value: 'REFUNDED', label: 'Remboursés', color: 'bg-purple-500' },
  ];

  // Charger les données
  const loadData = async () => {
    if (!isAuthenticated) return;

    try {
      setIsRefreshing(true);

      // Charger les paris de l'utilisateur
      const betsResponse = await betService.getMyBets();

      if (betsResponse.data) {
        const { created, accepted } = betsResponse.data;
        const allBets = [...created, ...accepted];

        // Ajouter des informations sur le rôle de l'utilisateur
        const betsWithRole: BetWithRole[] = allBets.map((bet: any) => ({
          ...bet,
          amount: parseFloat(bet.amount),
          potentialWin: bet.potentialWin ? parseFloat(bet.potentialWin) : null,
          actualWin: bet.actualWin ? parseFloat(bet.actualWin) : null,
          // Déterminer si l'utilisateur est le créateur ou l'accepteur
          isCreator: bet.creatorId === user?.id,
          userRole: bet.creatorId === user?.id ? 'creator' : 'acceptor',
        }));

        setBets(betsWithRole);

        // Mettre à jour le compteur total depuis la pagination
        if (betsResponse.pagination?.total) {
          setTotalCount(betsResponse.pagination.total);
        }
      }

    } catch (error: any) {
      console.error('Erreur chargement paris:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos paris',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    loadData();
  }, [isAuthenticated]);

  // Calculer les paris filtrés
  const filteredBets = useMemo(() => {
    let filtered = [...bets];

    // Filtrer par onglet
    if (activeTab === 'active') {
      filtered = filtered.filter(bet => ['PENDING', 'ACCEPTED'].includes(bet.status));
    } else if (activeTab === 'history') {
      filtered = filtered.filter(bet => ['WON', 'LOST', 'CANCELLED', 'REFUNDED'].includes(bet.status));
    }

    // Filtrer par statut sélectionné
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(bet => bet.status === selectedFilter);
    }

    // Trier par date (les plus récents en premier)
    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bets, activeTab, selectedFilter]);

  // Calculer les statistiques en temps réel
  const calculatedStats = useMemo(() => {
    const activeBets = bets.filter(bet => ['PENDING', 'ACCEPTED'].includes(bet.status));
    const historyBets = bets.filter(bet => ['WON', 'LOST', 'CANCELLED', 'REFUNDED'].includes(bet.status));
    const wonBets = bets.filter(bet => bet.status === 'WON');
    const lostBets = bets.filter(bet => bet.status === 'LOST');
    const pendingBets = bets.filter(bet => bet.status === 'PENDING');
    const acceptedBets = bets.filter(bet => bet.status === 'ACCEPTED');
    const cancelledBets = bets.filter(bet => bet.status === 'CANCELLED');

    // Calcul du profit total (seulement pour les paris terminés)
    const totalWinnings = wonBets.reduce((sum, bet) => sum + (bet.actualWin || 0), 0);
    const totalInvested = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const profit = totalWinnings - totalInvested;

    // Calcul des montants par statut
    const investedByStatus = {
      PENDING: pendingBets.reduce((sum, bet) => sum + bet.amount, 0),
      ACCEPTED: acceptedBets.reduce((sum, bet) => sum + bet.amount, 0),
      WON: wonBets.reduce((sum, bet) => sum + bet.amount, 0),
      LOST: lostBets.reduce((sum, bet) => sum + bet.amount, 0),
      CANCELLED: cancelledBets.reduce((sum, bet) => sum + bet.amount, 0),
    };

    return {
      totalBets: bets.length,
      activeBets: activeBets.length,
      historyBets: historyBets.length,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      pendingBets: pendingBets.length,
      acceptedBets: acceptedBets.length,
      cancelledBets: cancelledBets.length,
      winRate: historyBets.length > 0 ? (wonBets.length / historyBets.length) * 100 : 0,
      totalWinnings,
      totalInvested,
      profit,
      investedByStatus,
    };
  }, [bets]);

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatage de la date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'REFUNDED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'ACCEPTED': return 'Accepté';
      case 'WON': return 'Gagné';
      case 'LOST': return 'Perdu';
      case 'CANCELLED': return 'Annulé';
      case 'REFUNDED': return 'Remboursé';
      default: return status;
    }
  };

  // Rafraîchissement automatique pour les paris en cours
  useEffect(() => {
    if (calculatedStats.activeBets > 0) {
      const interval = setInterval(() => {
        loadData();
      }, 30000); // Rafraîchir toutes les 30 secondes

      return () => clearInterval(interval);
    }
  }, [calculatedStats.activeBets]);

  if (!isAuthenticated) {
    return (
      <>
        <div className="safe-top flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full mb-4 shadow-lg">
            <Ticket className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Connectez-vous pour voir et gérer vos paris
          </p>
          <Link
            to="/auth"
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-primary/80 transition-all shadow-lg hover:shadow-xl"
          >
            Se connecter
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="safe-top">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-lg">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mes Paris</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {totalCount || calculatedStats.totalBets} paris au total
                </p>
                {calculatedStats.activeBets > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {calculatedStats.activeBets} en cours
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={loadData}
              disabled={isRefreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Link to="/fights">
              <div className="inline-flex items-center justify-center gap-1 h-9 rounded-md px-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow transition-colors">
                <Plus className="w-4 h-4" />
                Parier
              </div>
            </Link>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Profit net</p>
                  <p className={`text-lg font-bold ${calculatedStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculatedStats.profit >= 0 ? '+' : ''}{formatAmount(calculatedStats.profit)} FCFA
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${calculatedStats.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {calculatedStats.profit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Taux de gain</p>
                  <p className="text-lg font-bold text-foreground">
                    {calculatedStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gains totaux</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(calculatedStats.totalWinnings)} FCFA
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total misé</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatAmount(calculatedStats.totalInvested)} FCFA
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Ticket className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails par statut */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {['WON', 'LOST', 'PENDING', 'ACCEPTED', 'CANCELLED'].map((status) => {
            const count = bets.filter(bet => bet.status === status).length;
            const amount = calculatedStats.investedByStatus[status as keyof typeof calculatedStats.investedByStatus] || 0;

            if (count === 0) return null;

            const statusConfig = filterOptions.find(opt => opt.value === status);

            return (
              <Card key={status} className="border">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig?.color}`}></div>
                      <span className="text-xs font-medium">{getStatusLabel(status)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{formatAmount(amount)} FCFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Onglets */}
        <Tabs defaultValue="active" value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En cours ({calculatedStats.activeBets})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historique ({calculatedStats.historyBets})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtres */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrer :</span>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions
              .filter(option => {
                // Afficher seulement les filtres pertinents pour l'onglet actif
                if (activeTab === 'active') {
                  return ['all', 'PENDING', 'ACCEPTED'].includes(option.value);
                }
                return ['all', 'WON', 'LOST', 'CANCELLED', 'REFUNDED'].includes(option.value);
              })
              .map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFilter(option.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedFilter === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                  {option.label}
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* Liste des paris */}
      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <PageLoader message="Chargement de vos paris..." />
        ) : (
          <>
            {/* Indicateur de rafraîchissement */}
            {isRefreshing && (
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg text-sm text-center animate-pulse">
                Mise à jour des données...
              </div>
            )}

            {filteredBets.length > 0 ? (
              <div className="space-y-4">
                {filteredBets.map((bet) => {
                  // Déterminer les informations à afficher selon le rôle de l'utilisateur
                  const opponent = bet.userRole === 'creator' ? bet.acceptor : bet.creator;
                  const isUserCreator = bet.userRole === 'creator';

                  return (
                    <Card key={bet.id} className="border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* En-tête du pari */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(bet.status)}>
                              {getStatusLabel(bet.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(bet.createdAt)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Vous êtes</p>
                            <Badge variant="outline" className="text-xs">
                              {isUserCreator ? 'Créateur' : 'Accepteur'}
                            </Badge>
                          </div>
                        </div>

                        {/* Informations du combat */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Swords className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-bold">{bet.fight?.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{bet.fight?.fighterA?.name} vs {bet.fight?.fighterB?.name}</span>
                            </div>
                            {bet.fight?.dayEvent && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{bet.fight.dayEvent.title}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Détails du pari */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Montant</p>
                            <p className="text-lg font-bold">{formatAmount(bet.amount)} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Choix</p>
                            <Badge variant="outline" className={
                              bet.chosenFighter === 'A'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-red-500 text-red-600'
                            }>
                              {bet.chosenFighter === 'A'
                                ? bet.fight?.fighterA?.name
                                : bet.fight?.fighterB?.name}
                            </Badge>
                          </div>
                        </div>

                        {/* Informations financières */}
                        {(bet.actualWin || bet.potentialWin) && (
                          <div className={`p-3 rounded-lg mb-3 ${bet.status === 'WON' ? 'bg-green-50' :
                            bet.status === 'LOST' ? 'bg-red-50' : 'bg-blue-50'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {bet.status === 'WON' ? 'Gain réalisé' :
                                    bet.status === 'LOST' ? 'Perte' : 'Gain potentiel'}
                                </p>
                              </div>
                              <p className={`text-lg font-bold ${bet.status === 'WON' ? 'text-green-700' :
                                bet.status === 'LOST' ? 'text-red-700' : 'text-blue-700'
                                }`}>
                                {formatAmount(bet.actualWin || bet.potentialWin || 0)} FCFA
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Informations sur l'adversaire */}
                        {opponent && (
                          <div className="border-t pt-3">
                            <p className="text-sm text-muted-foreground mb-2">
                              {isUserCreator ? 'Accepteur' : 'Créateur'}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">{opponent.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {isUserCreator ? 'A accepté votre pari' : 'A créé ce pari'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bouton d'annulation pour les paris PENDING créés par l'utilisateur */}
                        {bet.status === 'PENDING' && isUserCreator && bet.canCancelUntil && (
                          <div className="border-t pt-3 mt-3">
                            <CancelBetButton
                              betId={bet.id}
                              canCancelUntil={bet.canCancelUntil}
                              onCancel={() => loadData()}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {selectedFilter === 'all'
                    ? 'Aucun pari trouvé'
                    : `Aucun pari ${filterOptions.find(f => f.value === selectedFilter)?.label.toLowerCase()}`
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'active'
                    ? 'Commencez par créer un pari sur un combat'
                    : 'Vous n\'avez pas encore d\'historique de paris'
                  }
                </p>
                {activeTab === 'active' && (
                  <Link
                    to="/fights"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-primary/80 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    Voir les combats
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bouton flottant pour créer un pari */}
      {/* Bouton flottant pour créer un pari */}
      <Link to="/fights" className="fixed bottom-24 right-6 group">
        <div className="relative">
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-colors"></div>
          <div
            className="relative flex items-center justify-center rounded-full w-16 h-16 bg-primary text-primary-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-6 h-6 mr-2.5" />
            <span className="font-semibold text-lg pr-1">Créer</span>
          </div>
        </div>
      </Link>
    </div>
  );
}