import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Users,
  Clock,
  TrendingUp,
  Filter,
  Search,
  AlertCircle,
  Target,
  Zap,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { betService } from '@/services';
import type { Bet } from '@/services/BetService';

type FilterType = 'all' | 'fight' | 'fighter' | 'amount' | 'dayEvent';

interface FormattedBet {
  id: string;
  amount: number;
  chosenFighter: 'A' | 'B';
  status: string;
  createdAt: string;
  canCancelUntil?: string;
  creator: {
    id: string;
    name: string;
    phone: string;
  };
  acceptor?: {
    id: string;
    name: string;
    phone?: string;
  };
  fight: {
    id: string;
    title: string;
    location: string;
    scheduledAt: string;
    status: string;
    fighterA: {
      id: string;
      name: string;
      nickname?: string;
      stable?: string;
      weight: number;
      height: number;
    };
    fighterB: {
      id: string;
      name: string;
      nickname?: string;
      stable?: string;
      weight: number;
      height: number;
    };
    dayEvent: {
      id: string;
      title: string;
      date: string;
      status: string;
    };
  };
}

export default function AvailableBets() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [bets, setBets] = useState<FormattedBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedDayEvent, setSelectedDayEvent] = useState<string>('all');

  // Options de filtrage
  const filterOptions: { value: FilterType; label: string; icon: any }[] = [
    { value: 'all', label: 'Tous', icon: Ticket },
    { value: 'fight', label: 'Par combat', icon: Target },
    { value: 'fighter', label: 'Par lutteur', icon: Users },
    { value: 'amount', label: 'Montant', icon: TrendingUp },
    { value: 'dayEvent', label: 'Par événement', icon: Calendar },
  ];

  // Extraire les événements uniques
  const dayEvents = useMemo(() => {
    const events = bets.map(bet => ({
      id: bet.fight.dayEvent.id,
      title: bet.fight.dayEvent.title
    }));
    return Array.from(new Map(events.map(event => [event.id, event])).values());
  }, [bets]);

  // Charger les paris PENDING
  const loadPendingBets = async (isRefresh = false) => {
    if (!isAuthenticated) return;

    try {
      if (!isRefresh) setIsLoading(true);
      setIsRefreshing(isRefresh);

      const response = await betService.getAvailableBetPending();

      if (response.data) {
        // Formater les données selon votre structure
        const formattedBets: FormattedBet[] = (response.data as any[]).map((bet: any) => ({
          id: bet.id,
          amount: typeof bet.amount === 'string' ? parseFloat(bet.amount) : bet.amount,
          chosenFighter: bet.chosenFighter,
          status: bet.status,
          createdAt: bet.createdAt,
          canCancelUntil: bet.canCancelUntil,
          creator: {
            id: bet.creator.id,
            name: bet.creator.name,
            phone: bet.creator.phone || ''
          },
          acceptor: bet.acceptor ? {
            id: bet.acceptor.id,
            name: bet.acceptor.name,
            phone: bet.acceptor.phone
          } : undefined,
          fight: {
            id: bet.fight.id,
            title: bet.fight.title,
            location: bet.fight.location,
            scheduledAt: bet.fight.scheduledAt,
            status: bet.fight.status,
            fighterA: {
              id: bet.fight.fighterA.id,
              name: bet.fight.fighterA.name,
              nickname: bet.fight.fighterA.nickname,
              stable: bet.fight.fighterA.stable,
              weight: bet.fight.fighterA.weight,
              height: bet.fight.fighterA.height
            },
            fighterB: {
              id: bet.fight.fighterB.id,
              name: bet.fight.fighterB.name,
              nickname: bet.fight.fighterB.nickname,
              stable: bet.fight.fighterB.stable,
              weight: bet.fight.fighterB.weight,
              height: bet.fight.fighterB.height
            },
            dayEvent: {
              id: bet.fight.dayEvent.id,
              title: bet.fight.dayEvent.title,
              date: bet.fight.dayEvent.date,
              status: bet.fight.dayEvent.status
            }
          }
        }));

        // Filtrer pour exclure les paris créés par l'utilisateur connecté
        const availableBets = formattedBets.filter(bet =>
          bet.creator.id !== user?.id
        );

        setBets(availableBets);
      }

    } catch (error: any) {
      console.error('Erreur chargement paris PENDING:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les paris disponibles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (!isAuthenticated) return;

    loadPendingBets();

    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      loadPendingBets(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Filtrer les paris
  const filteredBets = useMemo(() => {
    let filtered = [...bets];

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bet => {
        const fighterA = bet.fight.fighterA.name?.toLowerCase() || '';
        const fighterB = bet.fight.fighterB.name?.toLowerCase() || '';
        const fightTitle = bet.fight.title?.toLowerCase() || '';
        const creatorName = bet.creator.name?.toLowerCase() || '';
        const eventTitle = bet.fight.dayEvent.title?.toLowerCase() || '';

        return fighterA.includes(query) ||
          fighterB.includes(query) ||
          fightTitle.includes(query) ||
          creatorName.includes(query) ||
          eventTitle.includes(query);
      });
    }

    // Filtrer par événement
    if (selectedDayEvent !== 'all') {
      filtered = filtered.filter(bet => bet.fight.dayEvent.id === selectedDayEvent);
    }

    // Trier selon le filtre
    switch (filterType) {
      case 'amount':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'fighter':
        filtered.sort((a, b) => {
          const fighterA = a.chosenFighter === 'A' ? a.fight.fighterA.name : a.fight.fighterB.name;
          const fighterB = b.chosenFighter === 'A' ? b.fight.fighterA.name : b.fight.fighterB.name;
          return fighterA.localeCompare(fighterB);
        });
        break;
      case 'fight':
        filtered.sort((a, b) => a.fight.title.localeCompare(b.fight.title));
        break;
      case 'dayEvent':
        filtered.sort((a, b) => a.fight.dayEvent.title.localeCompare(b.fight.dayEvent.title));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [bets, searchQuery, filterType, selectedDayEvent]);

  // Accepter un pari
  const handleAcceptBet = async (betId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour accepter un pari',
        variant: 'destructive',
      });
      return;
    }

    const bet = bets.find(b => b.id === betId);
    if (!bet) return;

    // Check for sufficient balance
    if (user?.wallet?.balance !== undefined) {
      // Ensure we compare numbers
      const balance = Number(user.wallet.balance);
      const amount = Number(bet.amount);

      if (balance < amount) {
        toast({
          title: 'Solde insuffisant',
          description: `Votre solde (${formatAmount(balance)} FCFA) est insuffisant pour accepter ce pari de ${formatAmount(amount)} FCFA.`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await betService.acceptBet(betId);

      toast({
        title: 'Pari accepté !',
        description: 'Vous avez accepté le pari avec succès',
      });

      // Rafraîchir la liste
      loadPendingBets(true);

    } catch (error: any) {
      console.error('Erreur acceptation pari:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'accepter le pari',
        variant: 'destructive',
      });
    }
  };

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Formatage de la date
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Calculer le gain potentiel (utilisez vos cotes réelles)
  const calculatePotentialWin = (bet: FormattedBet) => {
    const amount = bet.amount;
    // Utilisez les cotes de votre API si disponibles
    // Pour l'exemple, on utilise 80% de gain
    return amount * 1.8;
  };

  // Vérifier si le pari peut encore être accepté
  const canAcceptBet = (canCancelUntil: string) => {
    if (!canCancelUntil) return true;
    const cancelTime = new Date(canCancelUntil);
    return new Date() < cancelTime;
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="safe-top flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full mb-4 shadow-lg">
            <Ticket className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Connectez-vous pour voir et accepter les paris disponibles
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
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Paris Disponibles</h1>
              <p className="text-sm text-muted-foreground">
                {filteredBets.length} paris en attente d'acceptation
              </p>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => loadPendingBets(true)}
            disabled={isRefreshing}
            className="h-9 w-9"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un combat, lutteur ou créateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 bg-gray-50 border-gray-200 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterType === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtre par événement */}
        {dayEvents.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedDayEvent}
              onChange={(e) => setSelectedDayEvent(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-sm"
            >
              <option value="all">Tous les événements</option>
              {dayEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Statistiques rapides */}
        {filteredBets.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Card className="border">
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Montant moyen</p>
                  <p className="text-lg font-bold">
                    {formatAmount(
                      filteredBets.reduce((sum, bet) => sum + bet.amount, 0) / filteredBets.length
                    )} FCFA
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total disponible</p>
                  <p className="text-lg font-bold text-primary">
                    {formatAmount(
                      filteredBets.reduce((sum, bet) => sum + bet.amount, 0)
                    )} FCFA
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </header>

      {/* Liste des paris */}
      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <PageLoader message="Chargement des paris disponibles..." />
        ) : (
          <>
            {/* Indicateur de rafraîchissement */}
            {isRefreshing && (
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg text-sm text-center animate-pulse">
                Mise à jour des paris...
              </div>
            )}

            {filteredBets.length > 0 ? (
              <div className="space-y-4">
                {filteredBets.map((bet) => {
                  const potentialWin = calculatePotentialWin(bet);
                  const isChosenFighterA = bet.chosenFighter === 'A';
                  const chosenFighter = isChosenFighterA ? bet.fight.fighterA : bet.fight.fighterB;
                  const opponentFighter = isChosenFighterA ? bet.fight.fighterB : bet.fight.fighterA;
                  const canAccept = canAcceptBet(bet.canCancelUntil || '');

                  return (
                    <Card key={bet.id} className="border-0 shadow-lg shadow-black/20 hover:shadow-black/40 transition-all duration-300 bg-[#1a1b1e] rounded-2xl overflow-hidden ring-1 ring-white/5">
                      {/* En-tête de carte avec dégradé sombre subtil */}
                      <div className="bg-gradient-to-r from-zinc-800/50 to-[#1a1b1e] p-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-[#1a1b1e]">
                                {(bet.creator?.name || '?').charAt(0).toUpperCase()}
                              </div>
                              {/* Indicateur en ligne optionnel */}
                              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#1a1b1e] rounded-full"></div>
                            </div>
                            <div>
                              <p className="font-bold text-gray-100 leading-tight">{bet.creator?.name || 'Utilisateur Inconnu'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-400 font-medium">
                                  {formatTimeAgo(bet.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Badge de statut ou compte à rebours */}
                          {bet.canCancelUntil ? (
                            <Badge variant="outline" className="bg-orange-950/30 text-orange-400 border-orange-900/50 font-medium px-2 py-0.5">
                              ⏳ {new Date(bet.canCancelUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-zinc-800 text-gray-400 font-medium border border-zinc-700">
                              En attente
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-0">
                        {/* Section Combat */}
                        <div className="p-5">
                          {/* Événement */}
                          <div className="flex justify-center mb-4">
                            <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0 shadow-sm px-3 py-1 text-xs uppercase tracking-wide">
                              {bet.fight?.dayEvent?.title || 'Événement'}
                            </Badge>
                          </div>

                          {/* Lutteurs */}
                          <div className="flex items-end justify-between gap-2 mb-6 relative">
                            {/* Lutteur A */}
                            <div className="flex-1 text-center group cursor-pointer">
                              <div className="mb-2 relative inline-block">
                                <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 group-hover:border-primary/50 transition-colors overflow-hidden">
                                  {/* Placeholder pour photo */}
                                  <Users className="w-8 h-8 text-zinc-500" />
                                </div>
                              </div>
                              <h3 className="font-bold text-gray-100 text-sm md:text-base leading-tight">
                                {bet.fight?.fighterA?.name || 'Combattant A'}
                              </h3>
                              {bet.fight.fighterA.nickname && (
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  "{bet.fight?.fighterA?.nickname}"
                                </p>
                              )}
                            </div>

                            {/* VS Badge */}
                            <div className="flex flex-col items-center justify-center pb-6 z-10">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 text-gray-400 border border-zinc-700 flex items-center justify-center text-xs font-black shadow-lg shadow-black/30">
                                VS
                              </div>
                            </div>

                            {/* Lutteur B */}
                            <div className="flex-1 text-center group cursor-pointer">
                              <div className="mb-2 relative inline-block">
                                <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 group-hover:border-primary/50 transition-colors overflow-hidden">
                                  <Users className="w-8 h-8 text-zinc-500" />
                                </div>
                              </div>
                              <h3 className="font-bold text-gray-100 text-sm md:text-base leading-tight">
                                {bet.fight?.fighterB?.name || 'Combattant B'}
                              </h3>
                              {bet.fight?.fighterB?.nickname && (
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  "{bet.fight?.fighterB?.nickname}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Lieu */}
                          <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 border border-white/5 rounded-full">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-xs font-medium text-zinc-400">{bet.fight?.location || 'Lieu inconnu'}</span>
                            </div>
                          </div>

                          {/* Choix du parieur (Highlight) */}
                          <div className="bg-blue-950/20 rounded-xl p-4 mb-6 border border-blue-900/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5">
                              <Target className="w-16 h-16 text-blue-400" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                              <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-1">
                                {bet.creator.name} a misé sur
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-sm px-4 py-1.5 shadow-sm ${isChosenFighterA
                                  ? 'bg-blue-600 hover:bg-blue-700'
                                  : 'bg-red-600 hover:bg-red-700'
                                  } border-0`}>
                                  {chosenFighter.name}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Grid Montants */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700 flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">Mise</span>
                              <span className="text-lg font-black text-gray-100">
                                {formatAmount(bet.amount)} <span className="text-xs font-bold text-zinc-500">FCFA</span>
                              </span>
                            </div>
                            <div className="bg-emerald-950/20 rounded-xl p-3 border border-emerald-900/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 transform"></div>
                              <span className="text-xs text-emerald-400 font-medium mb-1 uppercase tracking-wide">Gain</span>
                              <span className="text-lg font-black text-emerald-400 relative z-10">
                                {formatAmount(potentialWin)} <span className="text-xs font-bold text-emerald-600">FCFA</span>
                              </span>
                            </div>
                          </div>

                          {/* Boutons Actions */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={() => handleAcceptBet(bet.id)}
                              className="flex-1 h-11 text-sm font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:brightness-110 active:scale-[0.98] transition-all rounded-xl text-white border-0"
                              disabled={!canAccept}
                            >
                              <Zap className="w-4 h-4 mr-2 fill-current" />
                              {canAccept ? 'Relever le défi' : 'Indisponible'}
                            </Button>

                            <Link to={`/fights/${bet.fight.id}`} className="sm:w-auto w-full">
                              <Button variant="outline" className="w-full h-11 border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-xl bg-transparent">
                                Détails
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucun pari disponible
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? `Aucun résultat pour "${searchQuery}"`
                    : "Aucun pari en attente d'acceptation d'autres joueurs."
                  }
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  (Vos propres paris sont visibles dans "Mes Paris")
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    className="mr-2"
                  >
                    Effacer la recherche
                  </Button>
                )}
                <Link to="/fights">
                  <Button>
                    Voir les combats
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation vers mes paris */}
      <div className="px-4 pb-20">
        <Link to="/my-bets">
          <Button variant="outline" className="w-full">
            <Ticket className="w-4 h-4 mr-2" />
            Voir mes paris
          </Button>
        </Link>
      </div>
    </div>
  );
}