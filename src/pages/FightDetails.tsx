// pages/FightDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  Swords,
  AlertCircle,
  Activity,
  Target,
  Scale,
  Zap
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fightService, betService } from '@/services';
import config from '@/config';

export default function FightDetails() {
  // Utilisez useParams pour récupérer l'ID depuis l'URL
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Débogage : extraire l'ID de l'URL actuelle
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/');
  const urlId = pathParts[pathParts.length - 1];

  // Utiliser l'ID du paramètre ou extrait de l'URL (priorité au paramètre)
  const fightId = paramId || urlId;

  console.log('=== DÉBOGAGE ROUTAGE ===');
  console.log('Param ID:', paramId);
  console.log('URL ID:', urlId);
  console.log('ID utilisé:', fightId);
  console.log('URL complète:', window.location.href);
  console.log('Chemin actuel:', currentPath);
  console.log('========================');

  const [fight, setFight] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBets, setAvailableBets] = useState<any[]>([]);
  const [selectedFighter, setSelectedFighter] = useState<'A' | 'B' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isCreatingBet, setIsCreatingBet] = useState(false);

  useEffect(() => {
    // Si aucun ID n'est trouvé
    if (!fightId || fightId === 'fights' || fightId === '') {
      console.error('ID invalide ou manquant:', fightId);
      toast({
        title: 'Erreur',
        description: 'ID du combat non trouvé',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const fetchFightDetails = async () => {
      setIsLoading(true);
      try {
        console.log('Chargement du combat avec ID:', fightId);

        // Option 1: Utiliser le service fightService
        const fightResponse = await fightService.getFight(fightId);
        console.log('Réponse du service:', fightResponse);

        if (fightResponse.data) {
          setFight(fightResponse.data);

          // Récupérer les paris disponibles
          try {
            const betsResponse = await betService.getAvailableBets(fightId);
            if (betsResponse.data) {
              setAvailableBets(betsResponse.data);
            }
          } catch (betsError) {
            console.warn('Erreur lors de la récupération des paris:', betsError);
          }
        } else {
          toast({
            title: 'Erreur',
            description: fightResponse.error || 'Combat non trouvé dans l\'API',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Erreur de chargement:', error);

        // Option 2: Tentative de secours avec fetch direct
        try {
          console.log('Tentative avec fetch direct...');
          const response = await fetch(`${config.apiUrl}/fight/${fightId}`);
          const data = await response.json();

          if (data.success && data.data) {
            setFight(data.data);
            toast({
              title: 'Chargé directement',
              description: 'Données récupérées via API directe',
              variant: 'default',
            });
          }
        } catch (directError) {
          console.error('Erreur fetch direct:', directError);
          toast({
            title: 'Erreur réseau',
            description: 'Impossible de charger les détails du combat',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFightDetails();
  }, [fightId, toast]);

  const handleCreateBet = async () => {
    if (!selectedFighter || !betAmount || !fight) return;

    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour parier',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Montant invalide',
        description: 'Veuillez entrer un montant valide',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier les limites de paris
    const minBet = parseFloat(fight.dayEvent?.minBetAmount || '100');
    const maxBet = parseFloat(fight.dayEvent?.maxBetAmount || '1000000');

    if (amount < minBet) {
      toast({
        title: 'Montant trop faible',
        description: `Le montant minimum est de ${minBet} FCFA`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > maxBet) {
      toast({
        title: 'Montant trop élevé',
        description: `Le montant maximum est de ${maxBet} FCFA`,
        variant: 'destructive',
      });
      return;
    }

    // Vérifier le solde disponible
    if (user?.wallet?.balance !== undefined) {
      const balance = Number(user.wallet.balance);
      if (balance < amount) {
        toast({
          title: 'Solde insuffisant',
          description: `Votre solde (${balance.toLocaleString()} FCFA) est insuffisant pour miser ${amount.toLocaleString()} FCFA.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsCreatingBet(true);
    try {
      await betService.createBet({
        fightId: fight.id,
        amount,
        chosenFighter: selectedFighter,
      });

      toast({
        title: 'Pari créé !',
        description: 'Votre pari a été créé avec succès',
      });

      // Rafraîchir la liste des paris disponibles
      const betsResponse = await betService.getAvailableBets(fight.id);
      if (betsResponse.data) {
        setAvailableBets(betsResponse.data);
      }

      // Réinitialiser le formulaire
      setSelectedFighter(null);
      setBetAmount('');

    } catch (error: any) {
      console.error('Erreur création pari:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le pari',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBet(false);
    }
  };

  const handleAcceptBet = async (betId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour accepter un pari',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // Trouver le pari pour vérifier le montant
    const bet = availableBets.find(b => b.id === betId);
    if (bet && user?.wallet?.balance !== undefined) {
      const balance = Number(user.wallet.balance);
      const amount = Number(bet.amount);

      if (balance < amount) {
        toast({
          title: 'Solde insuffisant',
          description: `Votre solde (${balance.toLocaleString()} FCFA) est insuffisant pour accepter ce pari de ${amount.toLocaleString()} FCFA.`,
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

      // Rafraîchir la liste des paris disponibles
      const betsResponse = await betService.getAvailableBets(fight.id);
      if (betsResponse.data) {
        setAvailableBets(betsResponse.data);
      }

    } catch (error: any) {
      console.error('Erreur acceptation pari:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'accepter le pari',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'Date non disponible';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return {
          color: 'bg-red-500 text-white',
          icon: Flame,
          text: 'EN DIRECT',
          gradient: 'from-red-500/10 to-red-500/5'
        };
      case 'SCHEDULED':
        return {
          color: 'bg-blue-500 text-white',
          icon: Clock,
          text: 'À VENIR',
          gradient: 'from-blue-500/10 to-blue-500/5'
        };
      case 'FINISHED':
        return {
          color: 'bg-green-500 text-white',
          icon: Trophy,
          text: 'TERMINÉ',
          gradient: 'from-green-500/10 to-green-500/5'
        };
      case 'CANCELLED':
        return {
          color: 'bg-gray-500 text-white',
          icon: AlertCircle,
          text: 'ANNULÉ',
          gradient: 'from-gray-500/10 to-gray-500/5'
        };
      default:
        return {
          color: 'bg-gray-500 text-white',
          icon: Swords,
          text: status,
          gradient: 'from-gray-500/10 to-gray-500/5'
        };
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="safe-top flex items-center justify-center min-h-screen">
          <PageLoader message={`Chargement du combat ${fightId}...`} />
        </div>
      </AppLayout>
    );
  }

  if (!fight) {
    return (
      <AppLayout>
        <div className="safe-top flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Swords className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Combat introuvable</h2>

          {/* Informations de débogage */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-md w-full">
            <h3 className="font-bold mb-2 text-gray-700">Informations techniques:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>ID paramètre:</strong> {paramId || 'non défini'}</p>
              <p><strong>ID URL:</strong> {urlId}</p>
              <p><strong>ID utilisé:</strong> {fightId}</p>
              <p><strong>URL actuelle:</strong> {window.location.href}</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            Ce combat n'existe pas ou a été supprimé
          </p>

          <div className="space-y-3 mb-6">
            <Button
              onClick={() => window.open(`${config.apiUrl}/fight/${fightId}`, '_blank')}
              variant="outline"
              className="w-full"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Tester l'API dans un nouvel onglet
              </span>
            </Button>

            <Button
              onClick={() => {
                console.log('Réessayer avec ID:', fightId);
                window.location.reload();
              }}
              variant="secondary"
              className="w-full"
            >
              Réessayer le chargement
            </Button>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button onClick={() => navigate('/fights')}>
              Voir tous les combats
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const statusConfig = getStatusConfig(fight.status);
  const StatusIcon = statusConfig.icon;
  const totalAmount = parseFloat(fight.totalAmount || '0');
  const amountOnA = parseFloat(fight.amountOnA || '0');
  const amountOnB = parseFloat(fight.amountOnB || '0');
  const totalBets = fight.totalBets || 0;
  const betsOnA = fight.betsOnA || 0;
  const betsOnB = fight.betsOnB || 0;

  const calculatePotentialWin = (amount: number, fighter: 'A' | 'B') => {
    const odds = fighter === 'A' ? fight.oddsA : fight.oddsB;
    return amount * odds;
  };

  const fighterAScore = fight.fighterA?.wins || 0;
  const fighterBScore = fight.fighterB?.wins || 0;

  return (
    <AppLayout>
      <div className="safe-top max-w-4xl mx-auto space-y-6 pb-24 px-4">
        {/* Bouton retour */}
        <div className="pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 px-0 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux combats
          </Button>
        </div>

        {/* Indicateur de débogage (seulement en développement) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Mode développement</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              ID: {fightId} • Statut: {fight.status}
            </p>
          </div>
        )}

        {/* En-tête du combat */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={`${statusConfig.color} gap-1.5 px-3 py-1.5`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.text}
            </Badge>

            {fight.dayEvent && (
              <Badge variant="outline" className="gap-1.5">
                <Calendar className="w-4 h-4" />
                {fight.dayEvent.title}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold">{fight.title}</h1>

          {fight.description && (
            <p className="text-muted-foreground">{fight.description}</p>
          )}
        </div>

        {/* Informations du combat */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Date et heure</span>
                </div>
                <p className="text-lg">{formatDate(fight.scheduledAt)}</p>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Lieu</span>
                </div>
                <p className="text-lg">{fight.location}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Paris</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total paris:</span>
                    <span className="font-bold">{totalBets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Montant total:</span>
                    <span className="font-bold">{totalAmount.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lutteurs */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Les Lutteurs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lutteur A */}
            <Card className={`border-l-4 border-l-blue-500`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{fight.fighterA.name}</h3>
                      {fight.fighterA.nickname && (
                        <p className="text-blue-600 font-medium">"{fight.fighterA.nickname}"</p>
                      )}
                    </div>
                    {/* Cote hidden */}
                  </div>

                  {fight.fighterA.stable && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>{fight.fighterA.stable}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Poids</span>
                      </div>
                      <p className="font-medium">{fight.fighterA.weight} kg</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Taille</span>
                      </div>
                      <p className="font-medium">{fight.fighterA.height} cm</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Victoires</span>
                      <span className="font-bold text-green-600">{fighterAScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Paris sur lui</span>
                      <span className="font-bold">{betsOnA} paris ({amountOnA.toLocaleString()} FCFA)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lutteur B */}
            <Card className={`border-l-4 border-l-red-500`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{fight.fighterB.name}</h3>
                      {fight.fighterB.nickname && (
                        <p className="text-red-600 font-medium">"{fight.fighterB.nickname}"</p>
                      )}
                    </div>
                    {/* Cote hidden */}
                  </div>

                  {fight.fighterB.stable && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>{fight.fighterB.stable}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Poids</span>
                      </div>
                      <p className="font-medium">{fight.fighterB.weight} kg</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Taille</span>
                      </div>
                      <p className="font-medium">{fight.fighterB.height} cm</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Victoires</span>
                      <span className="font-bold text-green-600">{fighterBScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Paris sur lui</span>
                      <span className="font-bold">{betsOnB} paris ({amountOnB.toLocaleString()} FCFA)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section pari (seulement pour les combats à venir) */}
        {fight.status === 'SCHEDULED' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Créer un pari</h2>

              <div className="space-y-6">
                {/* Sélection du lutteur */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Choisissez le gagnant</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedFighter('A')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${selectedFighter === 'A'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="font-bold mb-1">{fight.fighterA.name}</div>
                      <div className="flex items-center justify-between">
                        {/* Cote hidden */}
                        {selectedFighter === 'A' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedFighter('B')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${selectedFighter === 'B'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                        }`}
                    >
                      <div className="font-bold mb-1">{fight.fighterB.name}</div>
                      <div className="flex items-center justify-between">
                        {/* Cote hidden */}
                        {selectedFighter === 'B' && (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Montant du pari */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Montant du pari (FCFA)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full px-4 py-3 rounded-xl border bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    min={fight.dayEvent?.minBetAmount || "100"}
                    max={fight.dayEvent?.maxBetAmount || "1000000"}
                    step="100"
                  />

                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Minimum: {fight.dayEvent?.minBetAmount || "100"} FCFA</span>
                    <span>Maximum: {fight.dayEvent?.maxBetAmount || "1,000,000"} FCFA</span>
                  </div>

                  {betAmount && selectedFighter && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-600">Gain potentiel:</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        {calculatePotentialWin(parseFloat(betAmount) || 0, selectedFighter).toLocaleString()} FCFA
                      </p>
                    </div>
                  )}
                </div>

                {/* Bouton de création */}
                <Button
                  onClick={handleCreateBet}
                  disabled={!selectedFighter || !betAmount || isCreatingBet}
                  className="w-full"
                  size="lg"
                >
                  {isCreatingBet ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création en cours...
                    </div>
                  ) : (
                    'Créer le pari'
                  )}
                </Button>

                {!isAuthenticated && (
                  <p className="text-center text-sm text-muted-foreground">
                    Vous devez être connecté pour créer un pari
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message si les paris sont fermés */}
        {fight.status !== 'SCHEDULED' && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 mb-2">Paris fermés</h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {fight.status === 'ONGOING' && (
                      <>
                        Ce combat est <strong>en cours</strong>. Les paris ne sont plus acceptés. Consultez les résultats une fois le combat terminé.
                      </>
                    )}
                    {fight.status === 'FINISHED' && (
                      <>
                        Ce combat est <strong>terminé</strong>. Les paris ne sont plus acceptés. {fight.result && 'Consultez le résultat ci-dessous.'}
                      </>
                    )}
                    {fight.status === 'CANCELLED' && (
                      <>
                        Ce combat a été <strong>annulé</strong>. Les paris ont été remboursés.
                      </>
                    )}
                    {fight.status === 'POSTPONED' && (
                      <>
                        Ce combat a été <strong>reporté</strong>. Les paris seront à nouveau disponibles une fois la nouvelle date confirmée.
                      </>
                    )}
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700">
                      <strong>ℹ️ Règle importante :</strong> Les paris ne sont autorisés que sur les combats programmés (statut "À VENIR"). Dès qu'un combat démarre, les paris sont automatiquement fermés pour garantir l'équité.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Paris disponibles */}
        {availableBets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Paris disponibles</h2>
            <div className="space-y-3">
              {availableBets.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {bet.creator?.name || 'Utilisateur'} parie sur{' '}
                            <span className="font-bold">
                              {bet.chosenFighter === 'A' ? fight.fighterA.name : fight.fighterB.name}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(bet.createdAt).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(bet.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {parseFloat(bet.amount).toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gain: {calculatePotentialWin(parseFloat(bet.amount), bet.chosenFighter).toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptBet(bet.id)}
                          className="flex-1"
                          variant="outline"
                        >
                          Accepter ce pari
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Informations sur l'événement */}
        {fight.dayEvent && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Informations sur l'événement</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{fight.dayEvent.title}</h3>
                  {fight.dayEvent.description && (
                    <p className="text-muted-foreground mt-1">{fight.dayEvent.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Date</span>
                    </div>
                    <p>{formatDate(fight.dayEvent.date)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Lieu</span>
                    </div>
                    <p>{fight.dayEvent.location}</p>
                  </div>
                </div>

                {fight.dayEvent.totalBets > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Statistiques de l'événement</p>
                        <p className="text-sm text-muted-foreground">Total des paris</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{fight.dayEvent.totalBets} paris</p>
                        <p className="text-lg">{parseFloat(fight.dayEvent.totalAmount).toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Combat terminé - Résultat */}
        {fight.status === 'FINISHED' && fight.result && (
          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h2 className="text-xl font-bold">Résultat du combat</h2>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Vainqueur:</span>
                    <span className="text-lg font-bold text-green-700">
                      {fight.result.winner === 'A' ? fight.fighterA.name :
                        fight.result.winner === 'B' ? fight.fighterB.name :
                          'Match nul'}
                    </span>
                  </div>

                  {fight.result.victoryMethod && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-medium">Méthode de victoire:</span>
                      <Badge variant="outline" className="text-green-700">
                        {fight.result.victoryMethod}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}