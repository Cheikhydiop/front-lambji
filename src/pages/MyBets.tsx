import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, TrendingUp, TrendingDown, Clock, Plus, Filter, RefreshCw, User, Trophy, Calendar, Swords, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BetCard } from '@/components/bets/BetCard';
import { CancelBetButtonNew } from '@/components/bets/CancelBetButtonNew';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { betService } from '@/services';
import type { Bet } from '@/services/BetService';
import { webSocketService, WebSocketMessageType } from '@/services/WebSocketService';

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

  // Écoute WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBetUpdate = (payload: any) => {
      console.log('[MyBets] Mise à jour de pari reçue:', payload);
      loadData();
    };

    const handleFightResult = (payload: any) => {
      console.log('[MyBets] Résultat de combat reçu:', payload);
      loadData();
    };

    // S'abonner aux événements
    webSocketService.on(WebSocketMessageType.BET_WON, handleBetUpdate);
    webSocketService.on(WebSocketMessageType.BET_LOST, handleBetUpdate);
    webSocketService.on(WebSocketMessageType.BET_ACCEPTED, handleBetUpdate);
    webSocketService.on(WebSocketMessageType.BET_CANCELLED, handleBetUpdate);
    webSocketService.on(WebSocketMessageType.FIGHT_RESULT, handleFightResult);

    return () => {
      webSocketService.off(WebSocketMessageType.BET_WON, handleBetUpdate);
      webSocketService.off(WebSocketMessageType.BET_LOST, handleBetUpdate);
      webSocketService.off(WebSocketMessageType.BET_ACCEPTED, handleBetUpdate);
      webSocketService.off(WebSocketMessageType.BET_CANCELLED, handleBetUpdate);
      webSocketService.off(WebSocketMessageType.FIGHT_RESULT, handleFightResult);
    };
  }, [isAuthenticated, loadData]);

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

                  // Déterminer le choix de l'utilisateur (si créateur = choix direct, si accepteur = choix opposé)
                  const userChoiceSide = isUserCreator ? bet.chosenFighter : (bet.chosenFighter === 'A' ? 'B' : 'A');
                  const userChoiceName = userChoiceSide === 'A' ? bet.fight?.fighterA?.name : bet.fight?.fighterB?.name;

                  return (
                    <Card key={bet.id} className="border-0 shadow-lg shadow-black/20 hover:shadow-black/40 transition-all duration-300 bg-[#1a1b1e] rounded-2xl overflow-hidden ring-1 ring-white/5">
                      <CardContent className="p-0">
                        {/* En-tête avec statut et date */}
                        <div className="bg-gradient-to-r from-zinc-800/50 to-[#1a1b1e] p-4 border-b border-white/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(bet.status)} border-0 shadow-sm`}>
                                {getStatusLabel(bet.status)}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium ml-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(bet.createdAt)}
                              </div>
                            </div>

                            <Badge variant="outline" className={`text-xs border-zinc-700 bg-zinc-800/50 ${isUserCreator ? 'text-blue-400' : 'text-purple-400'}`}>
                              {isUserCreator ? 'Vous avez créé' : 'Vous avez accepté'}
                            </Badge>
                          </div>
                        </div>

                        {/* Section principale */}
                        <div className="p-5">
                          {/* Titre du combat */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-gray-400">
                              <Swords className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-100 text-lg leading-tight">{bet.fight?.title || 'Combat inconnu'}</h3>
                              {bet.fight?.dayEvent && (
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  {bet.fight.dayEvent.title}
                                </p>
                              )}
                              {/* Affichage du vainqueur si combat terminé */}
                              {bet.fight?.status === 'FINISHED' && bet.fight?.result && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                  <span className="text-xs font-semibold text-yellow-500">
                                    {bet.fight.result.winner === 'A' && `${bet.fight.fighterA?.name} a gagné`}
                                    {bet.fight.result.winner === 'B' && `${bet.fight.fighterB?.name} a gagné`}
                                    {bet.fight.result.winner === 'DRAW' && 'Match nul'}
                                  </span>
                                  {bet.fight.result.victoryMethod && (
                                    <span className="text-xs text-gray-500">({bet.fight.result.victoryMethod})</span>
                                  )}
                                </div>
                              )}
                            </div>
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
                        {/* Détails du duel (Grid: Créateur vs Accepteur) */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {/* Colonne Créateur */}
                          <div className={`rounded-xl p-3 border-2 flex flex-col items-center transition-all duration-300 ${(bet.fight?.status === 'FINISHED' && bet.fight?.result && (
                              (bet.chosenFighter === 'A' && bet.fight.result.winner === 'A') ||
                              (bet.chosenFighter === 'B' && bet.fight.result.winner === 'B')
                            ))
                              ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 shadow-lg shadow-yellow-500/50'
                              : isUserCreator ? 'bg-primary/10 border-primary/20' : 'bg-zinc-800/50 border-zinc-700'
                            }`}>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 text-center truncate w-full">
                              Créateur
                            </p>
                            <p className="text-xs font-bold mb-2 truncate w-full text-center">
                              {bet.creator?.name || 'Inconnu'} {isUserCreator && '(Moi)'}
                            </p>
                            {(bet.fight?.status === 'FINISHED' && bet.fight?.result && (
                              (bet.chosenFighter === 'A' && bet.fight.result.winner === 'A') ||
                              (bet.chosenFighter === 'B' && bet.fight.result.winner === 'B')
                            )) && (
                                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/20 px-2 py-0.5 rounded-full mb-2">
                                  ✨ Gagnant
                                </span>
                              )}
                            <Badge className={`text-sm px-3 py-1 shadow-sm w-full justify-center ${bet.chosenFighter === 'A' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                              } border-0`}>
                              {bet.chosenFighter === 'A' ? bet.fight?.fighterA?.name : bet.fight?.fighterB?.name}
                            </Badge>
                          </div>

                          {/* Colonne Accepteur */}
                          <div className={`rounded-xl p-3 border-2 flex flex-col items-center transition-all duration-300 ${(bet.fight?.status === 'FINISHED' && bet.fight?.result && (
                              (bet.chosenFighter === 'A' && bet.fight.result.winner === 'B') ||
                              (bet.chosenFighter === 'B' && bet.fight.result.winner === 'A')
                            ))
                              ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 shadow-lg shadow-yellow-500/50'
                              : !isUserCreator ? 'bg-primary/10 border-primary/20' : 'bg-zinc-800/50 border-zinc-700'
                            }`}>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 text-center truncate w-full">
                              Accepteur
                            </p>
                            <p className="text-xs font-bold mb-2 truncate w-full text-center">
                              {bet.acceptor?.name || '(En attente)'} {!isUserCreator && '(Moi)'}
                            </p>
                            {(bet.fight?.status === 'FINISHED' && bet.fight?.result && (
                              (bet.chosenFighter === 'A' && bet.fight.result.winner === 'B') ||
                              (bet.chosenFighter === 'B' && bet.fight.result.winner === 'A')
                            )) && (
                                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/20 px-2 py-0.5 rounded-full mb-2">
                                  ✨ Gagnant
                                </span>
                              )}
                            <Badge variant="outline" className={`text-sm px-3 py-1 shadow-sm w-full justify-center bg-background ${bet.chosenFighter === 'A' ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600'
                              }`}>
                              {/* L'accepteur a forcément l'autre lutteur */}
                              {bet.chosenFighter === 'A' ? bet.fight?.fighterB?.name : bet.fight?.fighterA?.name}
                            </Badge>
                          </div>
                        </div>

                        {/* Montant (centré dessous) */}
                        <div className="flex justify-center mb-4">
                          <div className="bg-zinc-800 rounded-xl px-6 py-2 border border-zinc-700 text-center">
                            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">Mise</p>
                            <p className="text-xl font-bold">{formatAmount(bet.amount)} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
                          </div>
                        </div>

                        {/* Informations financières */}
                        {(bet.actualWin || bet.potentialWin) && (
                          <div className={`p-4 rounded-xl mb-4 relative overflow-hidden flex items-center justify-between ${bet.status === 'WON' ? 'bg-emerald-950/20 ring-1 ring-emerald-900/30' :
                            bet.status === 'LOST' ? 'bg-red-950/20 ring-1 ring-red-900/30' :
                              'bg-blue-950/20 ring-1 ring-blue-900/30'
                            }`}>
                            <div className={`absolute inset-0 opacity-10 ${bet.status === 'WON' ? 'bg-emerald-500' :
                              bet.status === 'LOST' ? 'bg-red-500' : 'bg-blue-500'
                              }`}></div>

                            <div className="relative z-10">
                              <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${bet.status === 'WON' ? 'text-emerald-500' :
                                bet.status === 'LOST' ? 'text-red-500' : 'text-blue-500'
                                }`}>
                                {bet.status === 'WON' ? 'Gain réalisé' :
                                  bet.status === 'LOST' ? 'Perte' : 'Gain potentiel'}
                              </p>
                            </div>

                            <p className={`relative z-10 text-xl font-black ${bet.status === 'WON' ? 'text-emerald-400' :
                              bet.status === 'LOST' ? 'text-red-400' : 'text-blue-400'
                              }`}>
                              {formatAmount(bet.actualWin || bet.potentialWin || 0)} <span className="text-xs">FCFA</span>
                            </p>
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
                        {bet.status === 'PENDING' && isUserCreator && (
                          <div className="border-t pt-3 mt-3">
                            <CancelBetButtonNew
                              betId={bet.id}
                              createdAt={bet.createdAt}
                              status={bet.status}
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