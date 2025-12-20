import { Swords, Ticket, Users, User, Plus, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { betService } from '@/services';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [pendingBetsCount, setPendingBetsCount] = useState(0);
  
  // Navigation ultra-simplifiée pour mobile (4 éléments max)
  const navItems = [
    { 
      icon: Swords, 
      label: 'Combats', 
      path: '/fights',
      activePaths: ['/fights', '/fight/', '/fights/', '/']
    },
    { 
      icon: Users, 
      label: 'Accepter', 
      path: '/available-bets',
      activePaths: ['/available-bets', '/bets'],
      badgeCount: pendingBetsCount
    },
    { 
      icon: Ticket, 
      label: 'Mes Paris', 
      path: '/my-bets',
      activePaths: ['/my-bets', '/bet/']
    },
    { 
      icon: User, 
      label: 'Moi', 
      path: '/profile',
      activePaths: ['/profile', '/settings', '/wallet']
    },
  ];

  // Charger les paris en attente
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPendingBetsCount = async () => {
      try {
        const response = await betService.getBets({ status: 'PENDING' });
        if (response.data) {
          const pendingCount = response.data.filter((bet: any) => 
            bet.status === 'PENDING' && bet.creatorId !== user?.id
          ).length;
          setPendingBetsCount(pendingCount);
        }
      } catch (error) {
        console.error('Erreur chargement paris:', error);
      }
    };

    loadPendingBetsCount();
    const interval = setInterval(loadPendingBetsCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Vérifier l'activité
  const isActive = (item: any) => {
    const currentPath = location.pathname;
    return item.activePaths?.some((path: string) => 
      path.endsWith('/') ? currentPath.startsWith(path) : currentPath === path
    ) || currentPath === item.path;
  };

  return (
    <>
      {/* Bouton central flottant pour création rapide */}
      {isAuthenticated && location.pathname !== '/fights' && (
        <button
          onClick={() => navigate('/fights')}
          className="fixed bottom-20 right-4 z-50 p-5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)'
          }}
          aria-label="Créer un pari"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Navigation principale - Design iOS-like */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 safe-bottom">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const hasBadge = item.badgeCount && item.badgeCount > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-1.5",
                  "transition-all duration-300",
                  active ? "text-primary" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {/* Conteneur de l'icône */}
                <div className="relative">
                  {/* Badge animé */}
                  {hasBadge && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                        <div className={cn(
                          "relative w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                          active ? "bg-red-600" : "bg-red-500"
                        )}>
                          {item.badgeCount! > 9 ? '9+' : item.badgeCount}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Icône */}
                  <div className={cn(
                    "p-2.5 rounded-2xl transition-all duration-300",
                    active && "bg-primary/10 dark:bg-primary/20"
                  )}>
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform duration-300",
                        active && "scale-110"
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium mt-0.5 transition-all duration-300",
                  active 
                    ? "font-bold text-primary" 
                    : "text-gray-600 dark:text-gray-400",
                  hasBadge && !active && "font-semibold"
                )}>
                  {item.label}
                </span>

                {/* Indicateur d'activité (petit point) */}
                {active && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}