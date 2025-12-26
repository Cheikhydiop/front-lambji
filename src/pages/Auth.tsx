import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/AuthService';
import { ADMIN_PATH } from '@/config/admin';
import { decodeJWT } from '@/utils/jwt';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthProps {
  type?: AuthMode;
}

export default function Auth({ type }: AuthProps = {}) {
  const [mode, setMode] = useState<AuthMode>(type || 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '+221',
    password: '',
    confirmPassword: '',
    resetToken: '',
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Erreur',
            description: 'Les mots de passe ne correspondent pas',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Validation mot de passe simple (min 4 caractères)
        if (formData.password.length < 4) {
          toast({
            title: 'Mot de passe trop court',
            description: 'Le mot de passe doit contenir au moins 4 caractères.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Valider le format du téléphone sénégalais
        const phoneRegex = /^\+221[0-9]{9}$/;
        if (!formData.phone || formData.phone.length < 13) {
          toast({
            title: 'Erreur',
            description: 'Veuillez saisir un numéro de téléphone complet (+221 + 9 chiffres)',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        if (!phoneRegex.test(formData.phone)) {
          toast({
            title: 'Erreur',
            description: 'Format de téléphone invalide. Utilisez +221XXXXXXXXX',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const result = await register(formData.name, formData.email, formData.password, formData.phone);
        if (result.success) {
          toast({
            title: 'Inscription réussie',
            description: 'Un code de vérification a été envoyé à votre email',
          });
          // Rediriger vers la page de vérification email
          navigate('/verify-email', {
            state: {
              userId: result.userId,
              email: formData.email
            }
          });
        } else {
          toast({
            title: 'Erreur',
            description: result.error || "Erreur lors de l'inscription",
            variant: 'destructive',
          });
        }
      } else if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          // Vérification multi-appareils
          if (result.requiresDeviceVerification) {
            navigate('/device-verification', {
              state: {
                sessionId: result.sessionId,
                existingSessions: result.existingSessions,
                deviceInfo: result.deviceInfo
              }
            });
            return;
          }

          toast({
            title: 'Connexion réussie',
            description: 'Bienvenue sur MBAYAR BET!',
          });

          let userRole = result.user?.role;

          if (!userRole && result.token) {
            console.log('⚠️ Role missing in user object, trying to decode token...');
            const decoded = decodeJWT(result.token);
            if (decoded?.role) {
              userRole = decoded.role;
              console.log('✅ Role decoded from token:', userRole);
            }
          }

          console.log('👤 LOGIN DEBUG - Final Role:', userRole);
          console.log('👤 LOGIN DEBUG - Target ADMIN_PATH:', ADMIN_PATH);

          if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
            console.log('👉 Redirecting to ADMIN...');
            navigate(ADMIN_PATH);
          } else {
            console.log('👉 Redirecting to HOME...');
            navigate('/');
          }
        } else {
          toast({
            title: 'Erreur',
            description: result.error || 'Identifiants incorrects',
            variant: 'destructive',
          });
        }
      } else if (mode === 'forgot') {
        const result = await authService.forgotPassword(formData.email);
        if (!result.error) {
          toast({
            title: 'Email envoyé',
            description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
          });
          setMode('reset');
        } else {
          toast({
            title: 'Erreur',
            description: result.error,
            variant: 'destructive',
          });
        }
      } else if (mode === 'reset') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Erreur',
            description: 'Les mots de passe ne correspondent pas',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const result = await authService.resetPassword(formData.resetToken, formData.password);
        if (!result.error) {
          toast({
            title: 'Mot de passe réinitialisé',
            description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe',
          });
          setMode('login');
          setFormData({ ...formData, password: '', confirmPassword: '', resetToken: '' });
        } else {
          toast({
            title: 'Erreur',
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Connexion';
      case 'register':
        return 'Inscription';
      case 'forgot':
        return 'Mot de passe oublié';
      case 'reset':
        return 'Réinitialiser le mot de passe';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Connectez-vous pour parier';
      case 'register':
        return 'Créez votre compte gratuitement';
      case 'forgot':
        return 'Entrez votre email pour recevoir un lien de réinitialisation';
      case 'reset':
        return 'Entrez le code reçu par email et votre nouveau mot de passe';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 safe-top">
        <button
          onClick={() => {
            if (mode === 'reset') {
              setMode('forgot');
            } else if (mode === 'forgot') {
              setMode('login');
            } else {
              navigate('/');
            }
          }}
          className="p-2 hover:bg-muted rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="MBAYAR BET" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground">
            {getDescription()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  name="name"
                  placeholder="Votre nom"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-12"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+221771234567"
                  value={formData.phone}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Toujours commencer par +221
                    if (!value.startsWith('+221')) {
                      value = '+221';
                    }
                    // Limiter à 13 caractères
                    if (value.length <= 13) {
                      setFormData({ ...formData, phone: value });
                    }
                  }}
                  className="pl-12"
                  maxLength={13}
                  required
                />
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                placeholder="Adresse email"
                value={formData.email}
                onChange={handleChange}
                className="pl-12"
                required
              />
            </div>
          )}

          {mode === 'reset' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="resetToken"
                placeholder="Code de réinitialisation"
                value={formData.resetToken}
                onChange={handleChange}
                className="pl-12"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              {(mode === 'register' || mode === 'reset') && (
                <p className="text-xs text-muted-foreground ml-1">
                  💡 4 caractères minimum.
                </p>
              )}
            </div>
          )}

          {(mode === 'register' || mode === 'reset') && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-12"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            size="xl"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading
              ? 'Chargement...'
              : mode === 'login'
                ? 'Se connecter'
                : mode === 'register'
                  ? "S'inscrire"
                  : mode === 'forgot'
                    ? 'Envoyer le lien'
                    : 'Réinitialiser'}
          </Button>

          {/* Terms of Service for Registration */}
          {mode === 'register' && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              En vous inscrivant, vous acceptez nos{' '}
              <button
                type="button"
                onClick={() => navigate('/terms')}
                className="text-primary hover:underline font-medium"
              >
                Conditions Générales d'Utilisation
              </button>
            </p>
          )}
        </form>

        {/* Toggle Mode */}
        {(mode === 'login' || mode === 'register') && (
          <p className="text-center mt-6 text-muted-foreground">
            {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary font-semibold hover:underline"
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="text-center mt-6 text-muted-foreground">
            Vous avez déjà un code ?{' '}
            <button
              type="button"
              onClick={() => setMode('reset')}
              className="text-primary font-semibold hover:underline"
            >
              Réinitialiser maintenant
            </button>
          </p>
        )}
      </div>
    </div>
  );
}