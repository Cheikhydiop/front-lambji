import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Calendar, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { FightCard } from '@/components/fights/FightCard';
import { EventCard } from '@/components/fights/EventCard';
import { WalletBalance } from '@/components/common/WalletBalance';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { fightService } from '@/services';
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Mock data for demo
const mockFights = [
  {
    id: '1',
    title: 'Combat Principal',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'SCHEDULED',
    fighterA: { id: '1', name: 'Balla Gaye 2', wins: 25, losses: 3 },
    fighterB: { id: '2', name: 'Modou Lo', wins: 22, losses: 4 },
    oddsA: 1.85,
    oddsB: 2.10,
    totalBets: 156,
  },
  {
    id: '2',
    title: 'Combat Semi-Final',
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    status: 'SCHEDULED',
    fighterA: { id: '3', name: 'Bombardier', wins: 18, losses: 5 },
    fighterB: { id: '4', name: 'Eumeu Sène', wins: 20, losses: 6 },
    oddsA: 2.20,
    oddsB: 1.75,
    totalBets: 89,
  },
];

const mockEvents = [
  {
    id: '1',
    title: 'Grand Lamb de Dakar',
    date: new Date(Date.now() + 86400000).toISOString(),
    location: 'Dakar',
    venue: 'Arène Nationale',
    isFeatured: true,
    status: 'SCHEDULED',
    totalFights: 8,
  },
  {
    id: '2',
    title: 'Tournoi de Thiès',
    date: new Date(Date.now() + 604800000).toISOString(),
    location: 'Thiès',
    venue: 'Stade Lat Dior',
    isFeatured: false,
    status: 'SCHEDULED',
    totalFights: 6,
  },
];

export default function Index() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fights, setFights] = useState<any[]>(mockFights);
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fightsRes, eventsRes] = await Promise.all([
          fightService.getUpcomingFights(),
          fightService.getUpcomingEvents(),
        ]);
        if (fightsRes.data) setFights(fightsRes.data);
        if (eventsRes.data) setEvents(eventsRes.data);
      } catch (error) {
        // Keep mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchData();
  }, []);

  const handleAuthCheck = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.info("Connectez-vous pour voir les détails", {
        description: "Créez un compte gratuitement pour parier et suivre les combats.",
        action: {
          label: "Connexion",
          onClick: () => navigate('/auth')
        }
      });
      navigate('/auth');
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <AppLayout>
      <div className="safe-top">
        {/* Header */}
        <header className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient-gold">Lamb Ji</h1>
              <p className="text-sm text-muted-foreground">Lutte Sénégalaise</p>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <NotificationBell />
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 bg-gradient-gold text-primary-foreground rounded-xl font-semibold text-sm shadow-gold"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Wallet Card (if authenticated) */}
        {isAuthenticated && user?.wallet && (
          <div className="px-4 py-3">
            <WalletBalance
              balance={Number(user.wallet.balance) || 0}
              lockedBalance={Number(user.wallet.lockedBalance) || 0}
              bonusBalance={Number(user.wallet.bonusBalance) || 0}
            />
          </div>
        )}

        {/* Quick Stats (if not authenticated) */}
        {!isAuthenticated && (
          <div className="px-4 py-4">
            <div className="bg-gradient-card rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Bienvenue!</h2>
                  <p className="text-sm text-muted-foreground">Pariez sur vos lutteurs préférés</p>
                </div>
              </div>
              <Link
                to="/auth"
                className="block w-full py-3 bg-gradient-gold text-center text-primary-foreground rounded-xl font-semibold shadow-gold"
              >
                Créer un compte gratuit
              </Link>
            </div>
          </div>
        )}

        {/* Featured Events */}
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Événements</h2>
            </div>
            <Link to="/events" className="flex items-center gap-1 text-sm text-primary font-medium">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {events.slice(0, 2).map((event) => (
              <EventCard key={event.id} {...event} onClick={handleAuthCheck} />
            ))}
          </div>
        </section>

        {/* Upcoming Fights */}
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-secondary" />
              <h2 className="font-bold text-foreground">Combats à venir</h2>
            </div>
            <Link to="/fights" className="flex items-center gap-1 text-sm text-primary font-medium">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {fights.slice(0, 3).map((fight) => (
              <FightCard key={fight.id} {...fight} onClick={handleAuthCheck} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
