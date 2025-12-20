import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import config from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const DeviceVerification = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // Récupérer les données depuis l'état de navigation
    const { sessionId, existingSessions, deviceInfo } = location.state || {};

    if (!sessionId) {
        navigate('/login');
        return null;
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast({
                title: 'Code incomplet',
                description: 'Veuillez saisir les 6 chiffres du code',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${config.apiUrl}/auth/verify-device`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, otpCode: otp }),
            });

            const data = await response.json();

            if (response.ok) {
                // Sauvegarder le token
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('refreshToken', data.data.refreshToken);

                toast({
                    title: 'Appareil vérifié !',
                    description: 'Connexion réussie sur ce nouvel appareil',
                });

                setTimeout(() => navigate('/'), 1500);
            } else {
                toast({
                    title: 'Code invalide',
                    description: data.message || 'Le code est incorrect ou expiré',
                    variant: 'destructive',
                });
                setOtp('');
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de vérifier le code',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);

        try {
            const response = await fetch(`${config.apiUrl}/auth/resend-device-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            if (response.ok) {
                toast({
                    title: 'Code renvoyé',
                    description: 'Un nouveau code a été envoyé à votre email',
                });
            } else {
                toast({
                    title: 'Erreur',
                    description: 'Impossible de renvoyer le code',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de renvoyer le code',
                variant: 'destructive',
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl">Connexion détectée</CardTitle>
                    <CardDescription>
                        Vous êtes déjà connecté sur un autre appareil
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Afficher les sessions existantes */}
                    {existingSessions && existingSessions.length > 0 && (
                        <Alert>
                            <Smartphone className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-2">Appareils actuellement connectés :</p>
                                {existingSessions.map((session: any, index: number) => (
                                    <div key={index} className="text-sm text-muted-foreground">
                                        📱 {session.deviceName || 'Appareil inconnu'}
                                    </div>
                                ))}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Informations sur le nouvel appareil */}
                    {deviceInfo && (
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-semibold mb-2">Nouvel appareil détecté :</p>
                            <p className="text-sm text-muted-foreground">
                                📱 {deviceInfo.deviceName || 'Appareil inconnu'}
                            </p>
                        </div>
                    )}

                    <Alert>
                        <AlertDescription className="text-sm">
                            Pour des raisons de sécurité, un code de vérification a été envoyé à votre email.
                        </AlertDescription>
                    </Alert>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-center block">
                                Entrez le code de vérification
                            </label>
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                    disabled={loading}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                        </div>

                        <Alert className="bg-orange-50 border-orange-200">
                            <AlertDescription className="text-sm text-center">
                                ⏱️ Le code expire dans <strong>5 minutes</strong>
                            </AlertDescription>
                        </Alert>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Vérification...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Vérifier et se connecter
                                </>
                            )}
                        </Button>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Vous n'avez pas reçu le code ?
                            </p>
                            <Button
                                type="button"
                                variant="link"
                                onClick={handleResend}
                                disabled={resending}
                                className="p-0 h-auto"
                            >
                                {resending ? 'Envoi en cours...' : 'Renvoyer le code'}
                            </Button>
                        </div>

                        <div className="text-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/login')}
                                className="text-sm"
                            >
                                Retour à la connexion
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default DeviceVerification;
