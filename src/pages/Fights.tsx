import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Filter, Swords, Calendar, Flame, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FightCard } from '@/components/fights/FightCard';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { fightService, Fight, DayEvent } from '@/services';

// Types étendus
type FilterStatus = 'all' | 'SCHEDULED' | 'ONGOING' | 'FINISHED';

interface FightStats {
  totalFights: number;
  liveFights: number;
  upcomingFights: number;
  totalBets: number;
}

export default function Fights() {
  // États principaux
  const [fights, setFights] = useState<Fight[]>([]);
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [stats, setStats] = useState<FightStats>({
    totalFights: 0,
    liveFights: 0,
    upcomingFights: 0,
    totalBets: 0
  });

  // Fonction pour charger les données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Charger les combats
      const fightsResponse = await fightService.getFights();
      if (fightsResponse.data) {
        setFights(fightsResponse.data);
      }

      // Charger les événements
      const eventsResponse = await fightService.getDayEvents();
      if (eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Erreur API, utilisation des données de secours:', error);
      // Fallback sur les données mock en cas d'erreur
      setFights(mockFights as unknown as Fight[]);
      setEvents(mockEvents as unknown as DayEvent[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculer les statistiques quand les combats changent
  useEffect(() => {
    const liveFights = fights.filter(f => f.status === 'ONGOING').length;
    const upcomingFights = fights.filter(f => f.status === 'SCHEDULED').length;
    const totalBets = fights.reduce((sum, fight) => sum + fight.totalBets, 0);

    setStats({
      totalFights: fights.length,
      liveFights,
      upcomingFights,
      totalBets
    });
  }, [fights]);

  // Filtrage des combats
  const filteredFights = useMemo(() => {
    let filtered = [...fights];

    // Filtre par statut
    if (filter !== 'all') {
      filtered = filtered.filter(fight => fight.status === filter);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fight =>
        fight.title.toLowerCase().includes(query) ||
        fight.fighterA.name.toLowerCase().includes(query) ||
        fight.fighterB.name.toLowerCase().includes(query) ||
        (fight.location && fight.location.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [fights, filter, searchQuery]);

  // Rafraîchissement automatique pour les combats en direct
  useEffect(() => {
    const interval = setInterval(() => {
      if (stats.liveFights > 0) {
        // Recharger uniquement les combats en direct
        fightService.getFights({ status: 'ONGOING' })
          .then(response => {
            if (response.data) {
              setFights(prev =>
                prev.map(fight =>
                  fight.status === 'ONGOING'
                    ? response.data.find(f => f.id === fight.id) || fight
                    : fight
                )
              );
            }
          })
          .catch(console.error);
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [stats.liveFights]);

  // Données mock pour le fallback
  const mockFights = [
    {
      id: '1',
      title: 'Combat Principal',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      status: 'SCHEDULED',
      fighterA: {
        id: '1',
        name: 'Balla Gaye 2',
        wins: 25,
        losses: 3,
        draws: 0,
        totalFights: 28
      },
      fighterB: {
        id: '2',
        name: 'Modou Lo',
        wins: 22,
        losses: 4,
        draws: 0,
        totalFights: 26
      },
      oddsA: 1.85,
      oddsB: 2.10,
      totalBets: 156,
      totalAmount: 125000,
      location: 'Stade Demba Diop, Dakar',
    },
    {
      id: '2',
      title: 'Combat Semi-Final',
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      status: 'SCHEDULED',
      fighterA: {
        id: '3',
        name: 'Bombardier',
        wins: 18,
        losses: 5,
        draws: 0,
        totalFights: 23
      },
      fighterB: {
        id: '4',
        name: 'Eumeu Sène',
        wins: 20,
        losses: 6,
        draws: 0,
        totalFights: 26
      },
      oddsA: 2.20,
      oddsB: 1.75,
      totalBets: 89,
      totalAmount: 78000,
      location: 'Arena de Thiès',
    },
    {
      id: '3',
      title: 'Combat Espoirs',
      scheduledAt: new Date(Date.now() + 259200000).toISOString(),
      status: 'SCHEDULED',
      fighterA: {
        id: '5',
        name: 'Gris Bordeaux',
        wins: 15,
        losses: 4,
        draws: 0,
        totalFights: 19
      },
      fighterB: {
        id: '6',
        name: 'Sa Thiès',
        wins: 14,
        losses: 5,
        draws: 0,
        totalFights: 19
      },
      oddsA: 1.95,
      oddsB: 1.95,
      totalBets: 67,
      totalAmount: 54000,
      location: 'Terrain de Mbour',
    },
    {
      id: '4',
      title: 'Match Amical',
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'ONGOING',
      fighterA: {
        id: '7',
        name: 'Tyson',
        wins: 12,
        losses: 2,
        draws: 1,
        totalFights: 15
      },
      fighterB: {
        id: '8',
        name: 'Rambo',
        wins: 10,
        losses: 3,
        draws: 2,
        totalFights: 15
      },
      oddsA: 1.70,
      oddsB: 2.30,
      totalBets: 210,
      totalAmount: 189000,
      location: 'Palais des Sports, Dakar',
    },
    {
      id: '5',
      title: 'Combat de Légende',
      scheduledAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'FINISHED',
      fighterA: {
        id: '9',
        name: 'Yékini',
        wins: 30,
        losses: 5,
        draws: 2,
        totalFights: 37
      },
      fighterB: {
        id: '10',
        name: 'Tyson 2',
        wins: 28,
        losses: 7,
        draws: 1,
        totalFights: 36
      },
      oddsA: 1.65,
      oddsB: 2.40,
      totalBets: 350,
      totalAmount: 315000,
      location: 'Stade Iba Mar Diop',
      result: {
        id: '1',
        winner: 'A',
        victoryMethod: 'KO'
      }
    },
  ];

  const mockEvents = [
    {
      id: '1',
      title: 'Grand Tournoi de Lutte',
      slug: 'grand-tournoi-lutte',
      date: new Date().toISOString(),
      location: 'Dakar',
      status: 'SCHEDULED',
      totalBets: 500,
      totalAmount: 450000
    },
    {
      id: '2',
      title: 'Tournoi Régional',
      slug: 'tournoi-regional',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Thiès',
      status: 'SCHEDULED',
      totalBets: 200,
      totalAmount: 180000
    },
  ];

  const filterOptions: { value: FilterStatus; label: string; icon?: any }[] = [
    { value: 'all', label: 'Tous', icon: Swords },
    { value: 'SCHEDULED', label: 'À venir', icon: Calendar },
    { value: 'ONGOING', label: 'En direct', icon: Flame },
    { value: 'FINISHED', label: 'Terminés', icon: TrendingUp },
  ];

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Aujourd'hui ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Demain ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays > 1 && diffDays <= 7) {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return `${days[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="safe-top">
      {/* Header amélioré avec statistiques */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Swords className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Combats</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{stats.totalFights} combats</span>
                {stats.liveFights > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    {stats.liveFights} en direct
                  </span>
                )}
                <span>{stats.totalBets} paris</span>
              </div>
            </div>
          </div>

          {/* Bouton de rafraîchissement */}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>

        {/* Search amélioré */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un combat, lutteur ou lieu..."
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

        {/* Filters améliorés */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Fights List dynamique */}
      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <PageLoader />
        ) : filteredFights.length > 0 ? (
          <div className="space-y-6">
            {filteredFights.map((fight) => (
              <div key={fight.id} className="relative">
                {/* Badge de statut */}
                {fight.status === 'ONGOING' && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      EN DIRECT
                    </div>
                  </div>
                )}

                <FightCard
                  {...fight}
                  // Props supplémentaires pour dynamiser
                  showTime={true}
                  timeText={formatDate(fight.scheduledAt)}
                  showLocation={true}
                  showEvent={fight.dayEvent ? true : false}
                  eventName={fight.dayEvent?.title}
                />

                {/* Informations supplémentaires */}
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {fight.location || 'Lieu non précisé'}
                  </span>

                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fight.totalBets} paris • {fight.totalAmount?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {/* Résultat pour les combats terminés */}
                {fight.status === 'FINISHED' && fight.result && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Résultat :</span>
                        <span>
                          {fight.result.winner === 'A' && `Victoire de ${fight.fighterA.name}`}
                          {fight.result.winner === 'B' && `Victoire de ${fight.fighterB.name}`}
                          {fight.result.winner === 'DRAW' && 'Match nul'}
                        </span>
                      </div>
                      {fight.result.victoryMethod && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          {fight.result.victoryMethod}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun combat trouvé</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}"`
                : "Essayez de modifier vos filtres"}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bouton flottant pour remonter */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-24 right-6 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}