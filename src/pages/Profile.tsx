import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronRight, Shield, Bell, HelpCircle, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Shield, label: 'Sécurité', path: '/security' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
  { icon: HelpCircle, label: 'Aide & Support', path: '/help' },
  { icon: FileText, label: 'Conditions d\'utilisation', path: '/terms' },
];

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Déconnexion',
      description: 'À bientôt!',
    });
    navigate('/');
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

        {/* Stats */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">Paris totaux</p>
            </div>
            <div className="bg-gradient-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">8</p>
              <p className="text-xs text-muted-foreground">Victoires</p>
            </div>
            <div className="bg-gradient-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">67%</p>
              <p className="text-xs text-muted-foreground">Taux réussite</p>
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
                  className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-border' : ''
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
