import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/AuthService';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_PATH } from '@/config/admin';
import { decodeJWT } from '@/utils/jwt';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // États pour OTP
    const [showOtp, setShowOtp] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [sessionId, setSessionId] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const { login, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // ÉTAPE 1 : Connexion initiale
            if (!showOtp) {
                const result = await login(email, password);

                if (!result.success) {
                    toast({
                        title: 'Erreur',
                        description: result.error || 'Identifiants incorrects',
                        variant: 'destructive',
                    });
                    setIsLoading(false);
                    return;
                }

                // Vérification du rôle
                let userRole = result.user?.role;
                if (!userRole && result.token) {
                    const decoded = decodeJWT(result.token);
                    if (decoded?.role) userRole = decoded.role;
                }

                // On autorise si Admin OU si une vérification d'appareil est requise (le rôle sera vérifié après l'OTP)
                if (result.requiresDeviceVerification || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
                    // Admin détecté ou sécurité activée -> On force l'OTP
                    // 1. Sauvegarder sessionId
                    if (!result.sessionId) {
                        console.error('Session ID manquant pour OTP');
                    }
                    setSessionId(result.sessionId || '');

                    // 2. Déclencher l'envoi du code si pas déjà fait par le backend
                    if (!result.requiresDeviceVerification) {
                        await authService.resendDeviceOTP(result.sessionId!);
                    }

                    // Sécurité : On retire le token temporairement pour force la validation OTP
                    authService.setToken(null);

                    toast({
                        title: 'Vérification requise',
                        description: 'Un code de vérification a été envoyé à votre email.',
                    });

                    setShowOtp(true);
                } else {
                    await logout();
                    toast({
                        title: 'Accès refusé',
                        description: 'Ce compte n\'a pas les droits d\'administration.',
                        variant: 'destructive',
                    });
                }
            }
            // ÉTAPE 2 : Vérification OTP
            else {
                const verifyResult = await authService.verifyDevice(sessionId, otpCode);

                if (verifyResult.data?.token) {
                    // VERIFICATION FINALE DU ROLE
                    const decoded = decodeJWT(verifyResult.data.token);
                    const role = decoded?.role;

                    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                        await refreshUser();
                        toast({
                            title: 'Accès autorisé',
                            description: 'Bienvenue dans l\'administration',
                        });
                        navigate(`${ADMIN_PATH}/fights?tab=validation`, { replace: true });
                    } else {
                        // C'est un simple utilisateur qui a passé l'OTP -> DEHORS
                        authService.setToken(null); // Clear token
                        toast({
                            title: 'Accès refusé',
                            description: 'Vous n\'avez pas les droits d\'administration.',
                            variant: 'destructive',
                        });
                        // Reset state to login
                        setShowOtp(false);
                        setPassword('');
                        setOtpCode('');
                    }
                } else {
                    toast({
                        title: 'Erreur OTP',
                        description: 'Code invalide ou expiré.',
                        variant: 'destructive',
                    });
                }
            }

        } catch (error) {
            console.error('Admin login error:', error);
            toast({
                title: 'Erreur technique',
                description: 'Une erreur est survenue.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-900/20 flex items-center justify-center border border-red-900/50">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {showOtp ? 'Vérification Admin' : 'Accès Administration'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {showOtp ? 'Entrez le code envoyé à votre email' : 'Zone restreinte. Toute tentative d\'accès non autorisé sera enregistrée.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!showOtp ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email administrateur</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-slate-950 border-slate-800 text-white focus:border-red-500/50"
                                        placeholder="admin@exemple.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-slate-950 border-slate-800 text-white focus:border-red-500/50"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Code de vérification (OTP)</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-4 flex items-center justify-center text-slate-500 font-mono text-xs">123</div>
                                <Input
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    className="pl-10 bg-slate-950 border-slate-800 text-white focus:border-red-500/50 tracking-widest text-center text-lg"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white border-0"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Vérification...' : (showOtp ? 'Valider le code' : 'Se connecter au panel')}
                    </Button>

                    {showOtp && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-slate-400 hover:text-white"
                            onClick={() => setShowOtp(false)}
                        >
                            Retour
                        </Button>
                    )}
                </form>

                <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-900/10 border border-yellow-900/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-500/80">
                        Pour des raisons de sécurité, cette page est isolée du reste de l'application.
                        Les sessions utilisateurs classiques ne sont pas valides ici.
                    </p>
                </div>
            </div>
        </div>
    );
}
